export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface FamilyTree {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface FamilyMember {
  id: string;
  tree_id: string;
  first_name: string;
  last_name: string | null;
  birth_date: string | null;
  death_date: string | null;
  photo_url: string | null;
  bio: string | null;
  gender: string | null;
  is_root: boolean;
  position_x: number | null;
  position_y: number | null;
  created_at: string;
  updated_at: string;
}

export interface Relationship {
  id: string;
  tree_id: string;
  parent_id: string;
  child_id: string;
  relationship_type: string;
  created_at: string;
}

export interface SpouseRelationship {
  id: string;
  tree_id: string;
  member1_id: string;
  member2_id: string;
  relationship_type: string;
  marriage_date: string | null;
  divorce_date: string | null;
  created_at: string;
}

export interface LinkedTree {
  id: string;
  name: string;
  tree1_id: string;
  tree2_id: string;
  link_member1_id: string;
  link_member2_id: string;
  owner_id: string;
  created_at: string;
}

export interface TreeNodeData extends FamilyMember {
  children?: TreeNodeData[];
  spouse?: FamilyMember;
  level?: number;
}
