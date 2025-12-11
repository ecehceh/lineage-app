import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FamilyMember, Relationship, SpouseRelationship, TreeNodeData } from '@/lib/types';
import { FamilyMemberCard } from './FamilyMemberCard';
import { Plus, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TreeViewerProps {
  members: FamilyMember[];
  relationships: Relationship[];
  spouseRelationships: SpouseRelationship[];
  canEdit?: boolean;
  onMemberClick?: (member: FamilyMember) => void;
  onMemberEdit?: (member: FamilyMember) => void;
  onAddMember?: (parentId?: string) => void;
  selectedMemberId?: string | null;
}

export function TreeViewer({
  members,
  relationships,
  spouseRelationships,
  canEdit = false,
  onMemberClick,
  onMemberEdit,
  onAddMember,
  selectedMemberId,
}: TreeViewerProps) {
  const [zoom, setZoom] = useState(1);

  // Build tree structure from flat data
  const buildTreeStructure = useCallback((): TreeNodeData | null => {
    if (members.length === 0) return null;

    // Find root member
    const rootMember = members.find(m => m.is_root) || members[0];
    if (!rootMember) return null;

    // Create lookup maps
    const memberMap = new Map(members.map(m => [m.id, m]));
    const childrenMap = new Map<string, string[]>();
    
    relationships.forEach(rel => {
      const children = childrenMap.get(rel.parent_id) || [];
      children.push(rel.child_id);
      childrenMap.set(rel.parent_id, children);
    });

    // Build tree recursively
    const buildNode = (memberId: string, level: number = 0): TreeNodeData | null => {
      const member = memberMap.get(memberId);
      if (!member) return null;

      const childIds = childrenMap.get(memberId) || [];
      const children = childIds
        .map(id => buildNode(id, level + 1))
        .filter((n): n is TreeNodeData => n !== null);

      // Find spouse
      const spouseRel = spouseRelationships.find(
        sr => sr.member1_id === memberId || sr.member2_id === memberId
      );
      const spouseId = spouseRel 
        ? (spouseRel.member1_id === memberId ? spouseRel.member2_id : spouseRel.member1_id)
        : null;
      const spouse = spouseId ? memberMap.get(spouseId) : null;

      return {
        ...member,
        children: children.length > 0 ? children : undefined,
        spouse: spouse || undefined,
        level,
      };
    };

    return buildNode(rootMember.id);
  }, [members, relationships, spouseRelationships]);

  const treeRoot = useMemo(() => buildTreeStructure(), [buildTreeStructure]);

  // Render tree node recursively
  const renderTreeNode = (node: TreeNodeData, isFirst: boolean = true) => {
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Node with optional spouse */}
        <div className="flex items-center gap-2">
          <FamilyMemberCard
            member={node}
            isSelected={selectedMemberId === node.id}
            canEdit={canEdit}
            onClick={() => onMemberClick?.(node)}
            onEdit={() => onMemberEdit?.(node)}
          />
          {node.spouse && (
            <>
              <div className="w-8 h-0.5 bg-accent" />
              <FamilyMemberCard
                member={node.spouse}
                isSelected={selectedMemberId === node.spouse.id}
                canEdit={canEdit}
                onClick={() => onMemberClick?.(node.spouse!)}
                onEdit={() => onMemberEdit?.(node.spouse!)}
              />
            </>
          )}
          {canEdit && (
            <Button
              variant="outline"
              size="icon"
              className="ml-2 h-8 w-8 rounded-full"
              onClick={() => onAddMember?.(node.id)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Connector to children */}
        {hasChildren && (
          <>
            <div className="w-0.5 h-6 bg-border" />
            <div className="flex items-start">
              {node.children!.length > 1 && (
                <div 
                  className="h-0.5 bg-border absolute"
                  style={{
                    width: `${(node.children!.length - 1) * 220}px`,
                  }}
                />
              )}
            </div>
          </>
        )}

        {/* Children */}
        {hasChildren && (
          <div className="flex gap-8 pt-6 relative">
            {node.children!.map((child, index) => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="w-0.5 h-6 bg-border -mt-6" />
                {renderTreeNode(child, false)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full bg-parchment/30 rounded-xl border border-border overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setZoom(z => Math.min(z + 0.1, 2))}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setZoom(1)}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Tree Content */}
      <div 
        className="w-full h-full overflow-auto p-8"
        style={{ minHeight: '500px' }}
      >
        <motion.div
          className="inline-flex justify-center min-w-full"
          style={{ 
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
          }}
        >
          {treeRoot ? (
            renderTreeNode(treeRoot)
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-muted-foreground mb-4">
                No family members yet. Start building your tree!
              </p>
              {canEdit && (
                <Button variant="gold" onClick={() => onAddMember?.()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Member
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
