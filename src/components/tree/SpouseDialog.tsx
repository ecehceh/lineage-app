import { useState, useEffect } from 'react';
import { FamilyMember, SpouseRelationship } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import { Heart, Loader2, Trash2 } from 'lucide-react';

interface SpouseDialogProps {
  open: boolean;
  onClose: () => void;
  members: FamilyMember[];
  existingRelationships: SpouseRelationship[];
  onSave: (member1Id: string, member2Id: string, marriageDate?: string) => Promise<void>;
  onDelete?: (relationshipId: string) => Promise<void>;
}

export function SpouseDialog({
  open,
  onClose,
  members,
  existingRelationships,
  onSave,
  onDelete,
}: SpouseDialogProps) {
  const [member1Id, setMember1Id] = useState('');
  const [member2Id, setMember2Id] = useState('');
  const [marriageDate, setMarriageDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setMember1Id('');
      setMember2Id('');
      setMarriageDate('');
    }
  }, [open]);

  // Get members that are already in a spouse relationship
  const getMembersWithSpouse = () => {
    const membersInRelationship = new Set<string>();
    existingRelationships.forEach(rel => {
      membersInRelationship.add(rel.member1_id);
      membersInRelationship.add(rel.member2_id);
    });
    return membersInRelationship;
  };

  // Available members for selection (not already married)
  const membersWithSpouse = getMembersWithSpouse();
  const availableMembers = members.filter(m => !membersWithSpouse.has(m.id));

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member ? `${member.first_name} ${member.last_name || ''}`.trim() : 'Unknown';
  };

  const handleSubmit = async () => {
    if (!member1Id || !member2Id || member1Id === member2Id) return;

    setSaving(true);
    try {
      await onSave(member1Id, member2Id, marriageDate || undefined);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (relationshipId: string) => {
    if (!onDelete) return;
    
    setDeleting(relationshipId);
    try {
      await onDelete(relationshipId);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <Heart className="h-5 w-5 text-accent" />
            Manage Spouse Relationships
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Existing Relationships */}
          {existingRelationships.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Existing Relationships</Label>
              <div className="space-y-2">
                {existingRelationships.map(rel => (
                  <div
                    key={rel.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-accent" />
                      <span className="text-sm">
                        {getMemberName(rel.member1_id)} & {getMemberName(rel.member2_id)}
                      </span>
                      {rel.marriage_date && (
                        <span className="text-xs text-muted-foreground">
                          ({new Date(rel.marriage_date).getFullYear()})
                        </span>
                      )}
                    </div>
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(rel.id)}
                        disabled={deleting === rel.id}
                      >
                        {deleting === rel.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Relationship */}
          {availableMembers.length >= 2 ? (
            <div className="space-y-4">
              <Label className="text-sm font-medium">Add New Relationship</Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">First Person</Label>
                  <Select value={member1Id} onValueChange={setMember1Id}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMembers
                        .filter(m => m.id !== member2Id)
                        .map(member => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.first_name} {member.last_name || ''}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Second Person</Label>
                  <Select value={member2Id} onValueChange={setMember2Id}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMembers
                        .filter(m => m.id !== member1Id)
                        .map(member => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.first_name} {member.last_name || ''}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Marriage Date (Optional)</Label>
                <Input
                  type="date"
                  value={marriageDate}
                  onChange={(e) => setMarriageDate(e.target.value)}
                />
              </div>
            </div>
          ) : availableMembers.length < 2 && members.length >= 2 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              All members are already in a relationship. Remove an existing relationship to add a new one.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Add at least 2 members to the tree to create spouse relationships.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {availableMembers.length >= 2 && (
            <Button
              variant="gold"
              onClick={handleSubmit}
              disabled={!member1Id || !member2Id || member1Id === member2Id || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Heart className="mr-2 h-4 w-4" />
                  Add Relationship
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
