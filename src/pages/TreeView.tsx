import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FamilyTree, FamilyMember, Relationship, SpouseRelationship } from '@/lib/types';
import { Navbar } from '@/components/layout/Navbar';
import { TreeViewer } from '@/components/tree/TreeViewer';
import { MemberFormDialog } from '@/components/tree/MemberFormDialog';
import { SpouseDialog } from '@/components/tree/SpouseDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, 
  Settings, 
  Globe, 
  Lock, 
  Loader2, 
  MoreVertical,
  Trash2,
  UserPlus,
  Heart
} from 'lucide-react';
import { toast } from 'sonner';

export default function TreeView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tree, setTree] = useState<FamilyTree | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [spouseRelationships, setSpouseRelationships] = useState<SpouseRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [isNewMember, setIsNewMember] = useState(false);
  const [parentForNewMember, setParentForNewMember] = useState<string | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [spouseDialogOpen, setSpouseDialogOpen] = useState(false);
  const [treeSettings, setTreeSettings] = useState({ name: '', is_public: false });

  useEffect(() => {
    if (id) {
      fetchTreeData();
    }
  }, [id, user]);

  const fetchTreeData = async () => {
    if (!id) return;

    try {
      // Fetch tree
      const { data: treeData, error: treeError } = await supabase
        .from('family_trees')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (treeError) throw treeError;
      if (!treeData) {
        toast.error('Family tree not found');
        navigate('/dashboard');
        return;
      }

      setTree(treeData as FamilyTree);
      setTreeSettings({ name: treeData.name, is_public: treeData.is_public });
      setIsOwner(user?.id === treeData.owner_id);

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('family_members')
        .select('*')
        .eq('tree_id', id);

      if (membersError) throw membersError;
      setMembers((membersData as FamilyMember[]) || []);

      // Fetch relationships
      const { data: relData, error: relError } = await supabase
        .from('relationships')
        .select('*')
        .eq('tree_id', id);

      if (relError) throw relError;
      setRelationships((relData as Relationship[]) || []);

      // Fetch spouse relationships
      const { data: spouseData, error: spouseError } = await supabase
        .from('spouse_relationships')
        .select('*')
        .eq('tree_id', id);

      if (spouseError) throw spouseError;
      setSpouseRelationships((spouseData as SpouseRelationship[]) || []);
    } catch (error) {
      console.error('Error fetching tree data:', error);
      toast.error('Failed to load family tree');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = (parentId?: string) => {
    setSelectedMember(null);
    setParentForNewMember(parentId || null);
    setIsNewMember(true);
    setMemberDialogOpen(true);
  };

  const handleEditMember = (member: FamilyMember) => {
    setSelectedMember(member);
    setIsNewMember(false);
    setMemberDialogOpen(true);
  };

  const handleSaveMember = async (data: Partial<FamilyMember>) => {
    if (!tree || !id) return;

    try {
      if (isNewMember) {
        // Create new member
        const { data: newMember, error } = await supabase
          .from('family_members')
          .insert({
            tree_id: id,
            first_name: data.first_name || 'New Member',
            last_name: data.last_name,
            birth_date: data.birth_date,
            death_date: data.death_date,
            gender: data.gender,
            bio: data.bio,
            photo_url: data.photo_url,
            is_root: members.length === 0,
          })
          .select()
          .single();

        if (error) throw error;

        // If there's a parent, create relationship
        if (parentForNewMember && newMember) {
          await supabase.from('relationships').insert({
            tree_id: id,
            parent_id: parentForNewMember,
            child_id: newMember.id,
          });
        }

        toast.success('Family member added!');
      } else if (selectedMember) {
        // Update existing member
        const { error } = await supabase
          .from('family_members')
          .update({
            first_name: data.first_name,
            last_name: data.last_name,
            birth_date: data.birth_date,
            death_date: data.death_date,
            gender: data.gender,
            bio: data.bio,
            photo_url: data.photo_url,
          })
          .eq('id', selectedMember.id);

        if (error) throw error;
        toast.success('Member updated!');
      }

      setMemberDialogOpen(false);
      fetchTreeData();
    } catch (error) {
      console.error('Error saving member:', error);
      toast.error('Failed to save member');
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;

    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', selectedMember.id);

      if (error) throw error;

      toast.success('Member removed');
      setMemberDialogOpen(false);
      fetchTreeData();
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('Failed to delete member');
    }
  };

  const handleAddSpouseRelationship = async (member1Id: string, member2Id: string, marriageDate?: string) => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from('spouse_relationships')
        .insert({
          tree_id: id,
          member1_id: member1Id,
          member2_id: member2Id,
          marriage_date: marriageDate || null,
          relationship_type: 'married',
        });

      if (error) throw error;

      toast.success('Spouse relationship added!');
      fetchTreeData();
    } catch (error) {
      console.error('Error adding spouse relationship:', error);
      toast.error('Failed to add relationship');
    }
  };

  const handleDeleteSpouseRelationship = async (relationshipId: string) => {
    try {
      const { error } = await supabase
        .from('spouse_relationships')
        .delete()
        .eq('id', relationshipId);

      if (error) throw error;

      toast.success('Relationship removed');
      fetchTreeData();
    } catch (error) {
      console.error('Error deleting spouse relationship:', error);
      toast.error('Failed to remove relationship');
    }
  };

  const handleUpdateTreeSettings = async () => {
    if (!tree || !id) return;

    try {
      const { error } = await supabase
        .from('family_trees')
        .update({
          name: treeSettings.name,
          is_public: treeSettings.is_public,
        })
        .eq('id', id);

      if (error) throw error;

      setTree({ ...tree, ...treeSettings });
      toast.success('Settings updated');
      setSettingsOpen(false);
    } catch (error) {
      console.error('Error updating tree:', error);
      toast.error('Failed to update settings');
    }
  };

  const handleDeleteTree = async () => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from('family_trees')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Family tree deleted');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting tree:', error);
      toast.error('Failed to delete tree');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!tree) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-20">
        {/* Header */}
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(isOwner ? '/dashboard' : '/explore')}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-serif font-semibold">{tree.name}</h1>
                    {tree.is_public ? (
                      <Globe className="h-4 w-4 text-forest" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {members.length} member{members.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {isOwner && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => handleAddMember()}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                  {members.length >= 2 && (
                    <Button variant="outline" onClick={() => setSpouseDialogOpen(true)}>
                      <Heart className="mr-2 h-4 w-4" />
                      Manage Spouses
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteConfirmOpen(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Tree
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tree Viewer */}
        <div className="container mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-[calc(100vh-200px)]"
          >
            <TreeViewer
              members={members}
              relationships={relationships}
              spouseRelationships={spouseRelationships}
              canEdit={isOwner}
              onMemberClick={(member) => setSelectedMember(member)}
              onMemberEdit={handleEditMember}
              onAddMember={handleAddMember}
              selectedMemberId={selectedMember?.id}
            />
          </motion.div>
        </div>
      </main>

      {/* Member Form Dialog */}
      <MemberFormDialog
        open={memberDialogOpen}
        onClose={() => setMemberDialogOpen(false)}
        onSave={handleSaveMember}
        onDelete={!isNewMember ? handleDeleteMember : undefined}
        member={selectedMember}
        isNew={isNewMember}
      />

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Tree Settings</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tree Name</label>
              <Input
                value={treeSettings.name}
                onChange={(e) => setTreeSettings({ ...treeSettings, name: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Public Tree</label>
                <p className="text-xs text-muted-foreground">
                  Allow anyone to view this tree
                </p>
              </div>
              <Switch
                checked={treeSettings.is_public}
                onCheckedChange={(checked) => setTreeSettings({ ...treeSettings, is_public: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleUpdateTreeSettings}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Family Tree?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{tree.name}" and all its members. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTree}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Spouse Relationship Dialog */}
      <SpouseDialog
        open={spouseDialogOpen}
        onClose={() => setSpouseDialogOpen(false)}
        members={members}
        existingRelationships={spouseRelationships}
        onSave={handleAddSpouseRelationship}
        onDelete={handleDeleteSpouseRelationship}
      />
    </div>
  );
}
