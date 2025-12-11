import { useState, useEffect } from 'react';
import { FamilyMember } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Trash2 } from 'lucide-react';

interface MemberFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<FamilyMember>) => void;
  onDelete?: () => void;
  member?: FamilyMember | null;
  isNew?: boolean;
}

export function MemberFormDialog({
  open,
  onClose,
  onSave,
  onDelete,
  member,
  isNew = false,
}: MemberFormDialogProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    death_date: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    bio: '',
    photo_url: '',
  });

  useEffect(() => {
    if (member) {
      setFormData({
        first_name: member.first_name || '',
        last_name: member.last_name || '',
        birth_date: member.birth_date || '',
        death_date: member.death_date || '',
        gender: member.gender || '',
        bio: member.bio || '',
        photo_url: member.photo_url || '',
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        birth_date: '',
        death_date: '',
        gender: '',
        bio: '',
        photo_url: '',
      });
    }
  }, [member, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      gender: formData.gender || null,
      birth_date: formData.birth_date || null,
      death_date: formData.death_date || null,
      photo_url: formData.photo_url || null,
      bio: formData.bio || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {isNew ? 'Add Family Member' : 'Edit Family Member'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Preview */}
          <div className="flex justify-center">
            {formData.photo_url ? (
              <img
                src={formData.photo_url}
                alt="Preview"
                className="w-24 h-24 rounded-full object-cover border-2 border-accent/30"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center border-2 border-border">
                <User className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Photo URL */}
          <div className="space-y-2">
            <Label htmlFor="photo_url">Photo URL</Label>
            <Input
              id="photo_url"
              placeholder="https://example.com/photo.jpg"
              value={formData.photo_url}
              onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
            />
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => setFormData({ ...formData, gender: value as 'male' | 'female' | 'other' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birth_date">Birth Date</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="death_date">Death Date</Label>
              <Input
                id="death_date"
                type="date"
                value={formData.death_date}
                onChange={(e) => setFormData({ ...formData, death_date: e.target.value })}
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Biography</Label>
            <Textarea
              id="bio"
              placeholder="Share stories, memories, or information about this person..."
              rows={4}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />
          </div>

          <DialogFooter className="gap-2">
            {!isNew && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                className="mr-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="gold">
              {isNew ? 'Add Member' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
