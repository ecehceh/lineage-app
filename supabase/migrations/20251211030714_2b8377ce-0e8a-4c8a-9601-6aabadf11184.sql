-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create family_trees table
CREATE TABLE public.family_trees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create family_members table
CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID NOT NULL REFERENCES public.family_trees(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  birth_date DATE,
  death_date DATE,
  photo_url TEXT,
  bio TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  is_root BOOLEAN DEFAULT false,
  position_x NUMERIC DEFAULT 0,
  position_y NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create relationships table (parent-child connections)
CREATE TABLE public.relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID NOT NULL REFERENCES public.family_trees(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'biological' CHECK (relationship_type IN ('biological', 'adopted', 'step')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(parent_id, child_id)
);

-- Create spouse_relationships table
CREATE TABLE public.spouse_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID NOT NULL REFERENCES public.family_trees(id) ON DELETE CASCADE,
  member1_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  member2_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'married' CHECK (relationship_type IN ('married', 'divorced', 'partner')),
  marriage_date DATE,
  divorce_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member1_id, member2_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spouse_relationships ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Family trees policies
CREATE POLICY "Anyone can view public trees" ON public.family_trees FOR SELECT USING (is_public = true OR owner_id = auth.uid());
CREATE POLICY "Owners can insert trees" ON public.family_trees FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can update own trees" ON public.family_trees FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Owners can delete own trees" ON public.family_trees FOR DELETE USING (owner_id = auth.uid());

-- Family members policies
CREATE POLICY "Anyone can view members of accessible trees" ON public.family_members FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.family_trees 
    WHERE family_trees.id = family_members.tree_id 
    AND (family_trees.is_public = true OR family_trees.owner_id = auth.uid())
  ));
CREATE POLICY "Owners can insert members" ON public.family_members FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.family_trees 
    WHERE family_trees.id = family_members.tree_id 
    AND family_trees.owner_id = auth.uid()
  ));
CREATE POLICY "Owners can update members" ON public.family_members FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.family_trees 
    WHERE family_trees.id = family_members.tree_id 
    AND family_trees.owner_id = auth.uid()
  ));
CREATE POLICY "Owners can delete members" ON public.family_members FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.family_trees 
    WHERE family_trees.id = family_members.tree_id 
    AND family_trees.owner_id = auth.uid()
  ));

-- Relationships policies
CREATE POLICY "Anyone can view relationships of accessible trees" ON public.relationships FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.family_trees 
    WHERE family_trees.id = relationships.tree_id 
    AND (family_trees.is_public = true OR family_trees.owner_id = auth.uid())
  ));
CREATE POLICY "Owners can insert relationships" ON public.relationships FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.family_trees 
    WHERE family_trees.id = relationships.tree_id 
    AND family_trees.owner_id = auth.uid()
  ));
CREATE POLICY "Owners can update relationships" ON public.relationships FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.family_trees 
    WHERE family_trees.id = relationships.tree_id 
    AND family_trees.owner_id = auth.uid()
  ));
CREATE POLICY "Owners can delete relationships" ON public.relationships FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.family_trees 
    WHERE family_trees.id = relationships.tree_id 
    AND family_trees.owner_id = auth.uid()
  ));

-- Spouse relationships policies
CREATE POLICY "Anyone can view spouse relationships of accessible trees" ON public.spouse_relationships FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.family_trees 
    WHERE family_trees.id = spouse_relationships.tree_id 
    AND (family_trees.is_public = true OR family_trees.owner_id = auth.uid())
  ));
CREATE POLICY "Owners can insert spouse relationships" ON public.spouse_relationships FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.family_trees 
    WHERE family_trees.id = spouse_relationships.tree_id 
    AND family_trees.owner_id = auth.uid()
  ));
CREATE POLICY "Owners can update spouse relationships" ON public.spouse_relationships FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.family_trees 
    WHERE family_trees.id = spouse_relationships.tree_id 
    AND family_trees.owner_id = auth.uid()
  ));
CREATE POLICY "Owners can delete spouse relationships" ON public.spouse_relationships FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.family_trees 
    WHERE family_trees.id = spouse_relationships.tree_id 
    AND family_trees.owner_id = auth.uid()
  ));

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_family_trees_updated_at BEFORE UPDATE ON public.family_trees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_family_members_updated_at BEFORE UPDATE ON public.family_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();