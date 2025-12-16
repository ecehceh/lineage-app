-- Create table to store linked trees (e.g., two families connected by marriage)
CREATE TABLE public.linked_trees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tree1_id UUID NOT NULL REFERENCES public.family_trees(id) ON DELETE CASCADE,
  tree2_id UUID NOT NULL REFERENCES public.family_trees(id) ON DELETE CASCADE,
  link_member1_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  link_member2_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT different_trees CHECK (tree1_id != tree2_id),
  CONSTRAINT different_members CHECK (link_member1_id != link_member2_id)
);

-- Enable RLS
ALTER TABLE public.linked_trees ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own linked trees"
ON public.linked_trees
FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY "Users can create linked trees"
ON public.linked_trees
FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own linked trees"
ON public.linked_trees
FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own linked trees"
ON public.linked_trees
FOR DELETE
USING (owner_id = auth.uid());