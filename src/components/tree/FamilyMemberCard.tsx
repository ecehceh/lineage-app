import { motion } from 'framer-motion';
import { FamilyMember } from '@/lib/types';
import { User, Calendar, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FamilyMemberCardProps {
  member: FamilyMember;
  isSelected?: boolean;
  canEdit?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
}

export function FamilyMemberCard({
  member,
  isSelected = false,
  canEdit = false,
  onClick,
  onEdit,
}: FamilyMemberCardProps) {
  const fullName = `${member.first_name}${member.last_name ? ' ' + member.last_name : ''}`;
  
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const birthYear = member.birth_date ? new Date(member.birth_date).getFullYear() : null;
  const deathYear = member.death_date ? new Date(member.death_date).getFullYear() : null;
  const lifespan = birthYear ? `${birthYear}${deathYear ? ` - ${deathYear}` : ' - Present'}` : null;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        'tree-node cursor-pointer min-w-[160px] max-w-[200px]',
        isSelected && 'tree-node-selected'
      )}
      onClick={onClick}
    >
      {/* Edit Button */}
      {canEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
          }}
          className="absolute -top-2 -right-2 p-1.5 rounded-full bg-accent text-accent-foreground shadow-soft hover:scale-110 transition-transform"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Photo or Avatar */}
      <div className="flex justify-center mb-3">
        {member.photo_url ? (
          <img
            src={member.photo_url}
            alt={fullName}
            className="w-16 h-16 rounded-full object-cover border-2 border-accent/30"
          />
        ) : (
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center border-2',
            member.gender === 'male' 
              ? 'bg-blue-100 border-blue-300 text-blue-600' 
              : member.gender === 'female'
              ? 'bg-pink-100 border-pink-300 text-pink-600'
              : 'bg-secondary border-border text-muted-foreground'
          )}>
            <User className="h-8 w-8" />
          </div>
        )}
      </div>

      {/* Name */}
      <h4 className="font-serif font-semibold text-center text-sm leading-tight truncate px-1">
        {fullName}
      </h4>

      {/* Lifespan */}
      {lifespan && (
        <p className="text-xs text-muted-foreground text-center mt-1 flex items-center justify-center gap-1">
          <Calendar className="h-3 w-3" />
          {lifespan}
        </p>
      )}

      {/* Bio Preview */}
      {member.bio && (
        <p className="text-xs text-muted-foreground text-center mt-2 line-clamp-2 px-1">
          {member.bio}
        </p>
      )}
    </motion.div>
  );
}
