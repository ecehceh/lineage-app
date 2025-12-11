import { motion } from 'framer-motion';
import { FamilyTree } from '@/lib/types';
import { TreeDeciduous, Lock, Globe, Calendar, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TreeCardProps {
  tree: FamilyTree;
  memberCount?: number;
  index?: number;
}

export function TreeCard({ tree, memberCount = 0, index = 0 }: TreeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Link
        to={`/tree/${tree.id}`}
        className="block card-heritage group hover:shadow-elevated transition-all duration-300"
      >
        {/* Cover Image or Placeholder */}
        <div className="h-40 -mx-6 -mt-6 mb-4 rounded-t-xl overflow-hidden bg-gradient-to-br from-wood/20 to-accent/10 flex items-center justify-center">
          {tree.cover_image_url ? (
            <img
              src={tree.cover_image_url}
              alt={tree.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <TreeDeciduous className="h-16 w-16 text-accent/50" />
          )}
        </div>

        {/* Content */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-serif font-semibold text-lg group-hover:text-accent transition-colors line-clamp-1">
              {tree.name}
            </h3>
            {tree.is_public ? (
              <Globe className="h-4 w-4 text-forest flex-shrink-0" />
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
          </div>

          {tree.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {tree.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {memberCount} members
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(tree.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
