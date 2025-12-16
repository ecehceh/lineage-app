import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FamilyTree, FamilyMember, LinkedTree } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Link2 } from 'lucide-react';
import { toast } from 'sonner';

interface LinkTreeDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

export function LinkTreeDialog({ open, onClose, userId, onSuccess }: LinkTreeDialogProps) {
  const [trees, setTrees] = useState<FamilyTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [linkName, setLinkName] = useState('');
  const [tree1Id, setTree1Id] = useState('');
  const [tree2Id, setTree2Id] = useState('');
  const [member1Id, setMember1Id] = useState('');
  const [member2Id, setMember2Id] = useState('');

  const [tree1Members, setTree1Members] = useState<FamilyMember[]>([]);
  const [tree2Members, setTree2Members] = useState<FamilyMember[]>([]);

  useEffect(() => {
    if (open) {
      fetchTrees();
    }
  }, [open, userId]);

  useEffect(() => {
    if (tree1Id) {
      fetchMembers(tree1Id, setTree1Members);
      setMember1Id('');
    }
  }, [tree1Id]);

  useEffect(() => {
    if (tree2Id) {
      fetchMembers(tree2Id, setTree2Members);
      setMember2Id('');
    }
  }, [tree2Id]);

  const fetchTrees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('family_trees')
        .select('*')
        .eq('owner_id', userId)
        .order('name');

      if (error) throw error;
      setTrees((data as FamilyTree[]) || []);
    } catch (error) {
      console.error('Error fetching trees:', error);
      toast.error('Failed to load trees');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (treeId: string, setMembers: (members: FamilyMember[]) => void) => {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('tree_id', treeId)
        .order('first_name');

      if (error) throw error;
      setMembers((data as FamilyMember[]) || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handleSubmit = async () => {
    if (!linkName.trim() || !tree1Id || !tree2Id || !member1Id || !member2Id) {
      toast.error('Please fill in all fields');
      return;
    }

    if (tree1Id === tree2Id) {
      toast.error('Please select two different trees');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('linked_trees')
        .insert({
          name: linkName.trim(),
          tree1_id: tree1Id,
          tree2_id: tree2Id,
          link_member1_id: member1Id,
          link_member2_id: member2Id,
          owner_id: userId,
        });

      if (error) throw error;

      // Also create a spouse relationship between the linked members
      await supabase.from('spouse_relationships').insert({
        tree_id: tree1Id,
        member1_id: member1Id,
        member2_id: member2Id,
        relationship_type: 'married',
      });

      toast.success('Family trees linked successfully!');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error linking trees:', error);
      toast.error('Failed to link trees');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setLinkName('');
    setTree1Id('');
    setTree2Id('');
    setMember1Id('');
    setMember2Id('');
    setTree1Members([]);
    setTree2Members([]);
    onClose();
  };

  const tree1 = trees.find(t => t.id === tree1Id);
  const tree2 = trees.find(t => t.id === tree2Id);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <Link2 className="h-5 w-5 text-accent" />
            Link Two Family Trees
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : trees.length < 2 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              You need at least 2 family trees to link them together.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Combined View Name *</Label>
              <Input
                placeholder="e.g., Smith-Jones Family"
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
              />
            </div>

            {/* Tree 1 Selection */}
            <div className="p-4 rounded-lg bg-secondary/50 space-y-3">
              <h4 className="font-medium text-sm">First Family Tree</h4>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Select Tree</Label>
                <Select value={tree1Id} onValueChange={setTree1Id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tree" />
                  </SelectTrigger>
                  <SelectContent>
                    {trees.filter(t => t.id !== tree2Id).map(tree => (
                      <SelectItem key={tree.id} value={tree.id}>
                        {tree.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {tree1Id && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Member to link (e.g., the bride/groom)
                  </Label>
                  <Select value={member1Id} onValueChange={setMember1Id}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a member" />
                    </SelectTrigger>
                    <SelectContent>
                      {tree1Members.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.first_name} {member.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Tree 2 Selection */}
            <div className="p-4 rounded-lg bg-secondary/50 space-y-3">
              <h4 className="font-medium text-sm">Second Family Tree</h4>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Select Tree</Label>
                <Select value={tree2Id} onValueChange={setTree2Id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tree" />
                  </SelectTrigger>
                  <SelectContent>
                    {trees.filter(t => t.id !== tree1Id).map(tree => (
                      <SelectItem key={tree.id} value={tree.id}>
                        {tree.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {tree2Id && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Member to link (e.g., the bride/groom)
                  </Label>
                  <Select value={member2Id} onValueChange={setMember2Id}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a member" />
                    </SelectTrigger>
                    <SelectContent>
                      {tree2Members.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.first_name} {member.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {tree1 && tree2 && member1Id && member2Id && (
              <p className="text-xs text-muted-foreground text-center">
                This will create a combined view showing both "{tree1.name}" and "{tree2.name}" 
                connected through the selected members.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="gold"
            onClick={handleSubmit}
            disabled={!linkName.trim() || !tree1Id || !tree2Id || !member1Id || !member2Id || saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Linking...
              </>
            ) : (
              <>
                <Link2 className="mr-2 h-4 w-4" />
                Link Trees
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
