import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LinkedTree, FamilyTree, FamilyMember, Relationship, SpouseRelationship } from '@/lib/types';
import { Navbar } from '@/components/layout/Navbar';
import { TreeViewer } from '@/components/tree/TreeViewer';
import { MemberFormDialog } from '@/components/tree/MemberFormDialog';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ArrowLeft, Link2, Loader2, Trash2, TreeDeciduous, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function LinkedTreeView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [linkedTree, setLinkedTree] = useState<LinkedTree | null>(null);
  const [tree1, setTree1] = useState<FamilyTree | null>(null);
  const [tree2, setTree2] = useState<FamilyTree | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [spouseRelationships, setSpouseRelationships] = useState<SpouseRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [originDialogOpen, setOriginDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchLinkedTreeData();
    }
  }, [id, user]);

  const fetchLinkedTreeData = async () => {
    if (!id) return;

    try {
      // Fetch linked tree info
      const { data: linkedData, error: linkedError } = await supabase
        .from('linked_trees')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (linkedError) throw linkedError;
      if (!linkedData) {
        toast.error('Linked tree not found');
        navigate('/dashboard');
        return;
      }

      setLinkedTree(linkedData as LinkedTree);
      setIsOwner(user?.id === linkedData.owner_id);

      // Fetch both trees
      const { data: treesData, error: treesError } = await supabase
        .from('family_trees')
        .select('*')
        .in('id', [linkedData.tree1_id, linkedData.tree2_id]);

      if (treesError) throw treesError;
      
      const t1 = treesData?.find(t => t.id === linkedData.tree1_id);
      const t2 = treesData?.find(t => t.id === linkedData.tree2_id);
      setTree1(t1 as FamilyTree || null);
      setTree2(t2 as FamilyTree || null);

      // Fetch all members from both trees
      const { data: membersData, error: membersError } = await supabase
        .from('family_members')
        .select('*')
        .in('tree_id', [linkedData.tree1_id, linkedData.tree2_id]);

      if (membersError) throw membersError;
      setMembers((membersData as FamilyMember[]) || []);

      // Fetch all relationships from both trees
      const { data: relData, error: relError } = await supabase
        .from('relationships')
        .select('*')
        .in('tree_id', [linkedData.tree1_id, linkedData.tree2_id]);

      if (relError) throw relError;
      setRelationships((relData as Relationship[]) || []);

      // Fetch all spouse relationships from both trees
      const { data: spouseData, error: spouseError } = await supabase
        .from('spouse_relationships')
        .select('*')
        .in('tree_id', [linkedData.tree1_id, linkedData.tree2_id]);

      if (spouseError) throw spouseError;
      
      // Add the linking spouse relationship if not exists
      const linkSpouseRel: SpouseRelationship = {
        id: 'link-' + linkedData.id,
        tree_id: linkedData.tree1_id,
        member1_id: linkedData.link_member1_id,
        member2_id: linkedData.link_member2_id,
        relationship_type: 'married',
        marriage_date: null,
        divorce_date: null,
        created_at: linkedData.created_at,
      };
      
      const allSpouseRels = [...((spouseData as SpouseRelationship[]) || [])];
      // Check if link relationship already exists
      const linkExists = allSpouseRels.some(
        sr => (sr.member1_id === linkedData.link_member1_id && sr.member2_id === linkedData.link_member2_id) ||
              (sr.member1_id === linkedData.link_member2_id && sr.member2_id === linkedData.link_member1_id)
      );
      if (!linkExists) {
        allSpouseRels.push(linkSpouseRel);
      }
      setSpouseRelationships(allSpouseRels);

    } catch (error) {
      console.error('Error fetching linked tree data:', error);
      toast.error('Failed to load linked family tree');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMember = (member: FamilyMember) => {
    setSelectedMember(member);
    setOriginDialogOpen(true);
  };

  const getOriginTree = (member: FamilyMember): FamilyTree | null => {
    if (member.tree_id === tree1?.id) return tree1;
    if (member.tree_id === tree2?.id) return tree2;
    return null;
  };

  const handleViewOriginFamily = () => {
    if (selectedMember) {
      navigate(`/tree/${selectedMember.tree_id}`);
    }
  };

  const handleViewMemberDetails = () => {
    setOriginDialogOpen(false);
    setMemberDialogOpen(true);
  };

  const handleDeleteLink = async () => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from('linked_trees')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Link removed');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting link:', error);
      toast.error('Failed to remove link');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!linkedTree) {
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
                  onClick={() => navigate('/dashboard')}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <div className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-accent" />
                    <h1 className="text-xl font-serif font-semibold">{linkedTree.name}</h1>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Combined view: {tree1?.name} + {tree2?.name}
                  </p>
                </div>
              </div>

              {isOwner && (
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Link
                </Button>
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
              canEdit={false}
              onMemberClick={handleViewMember}
              selectedMemberId={selectedMember?.id}
            />
          </motion.div>
        </div>
      </main>

      {/* Origin Family Dialog */}
      <Dialog open={originDialogOpen} onOpenChange={setOriginDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {selectedMember?.first_name} {selectedMember?.last_name}
            </DialogTitle>
            <DialogDescription>
              View member details or navigate to their origin family tree.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedMember && getOriginTree(selectedMember) && (
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <TreeDeciduous className="h-4 w-4" />
                  <span>Origin Family</span>
                </div>
                <p className="font-serif font-medium">
                  {getOriginTree(selectedMember)?.name}
                </p>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <Button onClick={handleViewMemberDetails} variant="outline">
                View Member Details
              </Button>
              <Button onClick={handleViewOriginFamily} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View Origin Family Tree
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Member View Dialog */}
      <MemberFormDialog
        open={memberDialogOpen}
        onClose={() => setMemberDialogOpen(false)}
        onSave={() => {}}
        member={selectedMember}
        isNew={false}
        readOnly={true}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Tree Link?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the combined view "{linkedTree.name}". 
              The original family trees will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLink}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
