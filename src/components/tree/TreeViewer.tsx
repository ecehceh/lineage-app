import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
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

const NODE_WIDTH = 180;
const NODE_HEIGHT = 160;
const HORIZONTAL_GAP = 40;
const VERTICAL_GAP = 80;
const SPOUSE_GAP = 20;

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());

  // Build tree structure from flat data
  const buildTreeStructure = useCallback((): TreeNodeData | null => {
    if (members.length === 0) return null;

    // Find root member
    const rootMember = members.find(m => m.is_root) || members[0];
    if (!rootMember) return null;

    // Create lookup maps
    const memberMap = new Map(members.map(m => [m.id, m]));
    const childrenMap = new Map<string, string[]>();
    const processedSpouses = new Set<string>();
    
    relationships.forEach(rel => {
      const children = childrenMap.get(rel.parent_id) || [];
      if (!children.includes(rel.child_id)) {
        children.push(rel.child_id);
        childrenMap.set(rel.parent_id, children);
      }
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
        sr => (sr.member1_id === memberId || sr.member2_id === memberId) && 
              !processedSpouses.has(sr.id)
      );
      
      let spouse: FamilyMember | undefined;
      if (spouseRel) {
        processedSpouses.add(spouseRel.id);
        const spouseId = spouseRel.member1_id === memberId ? spouseRel.member2_id : spouseRel.member1_id;
        spouse = memberMap.get(spouseId);
        
        // Add spouse's children too
        const spouseChildIds = childrenMap.get(spouseId) || [];
        spouseChildIds.forEach(childId => {
          if (!childIds.includes(childId)) {
            const childNode = buildNode(childId, level + 1);
            if (childNode) children.push(childNode);
          }
        });
      }

      return {
        ...member,
        children: children.length > 0 ? children : undefined,
        spouse,
        level,
      };
    };

    return buildNode(rootMember.id);
  }, [members, relationships, spouseRelationships]);

  const treeRoot = useMemo(() => buildTreeStructure(), [buildTreeStructure]);

  // Calculate positions for all nodes
  const calculatePositions = useCallback((root: TreeNodeData | null): Map<string, { x: number; y: number }> => {
    const positions = new Map<string, { x: number; y: number }>();
    if (!root) return positions;

    const calculateSubtreeWidth = (node: TreeNodeData): number => {
      const nodeWidth = node.spouse ? NODE_WIDTH * 2 + SPOUSE_GAP : NODE_WIDTH;
      if (!node.children || node.children.length === 0) {
        return nodeWidth;
      }
      const childrenWidth = node.children.reduce((sum, child) => sum + calculateSubtreeWidth(child), 0) + 
                           (node.children.length - 1) * HORIZONTAL_GAP;
      return Math.max(nodeWidth, childrenWidth);
    };

    const assignPositions = (node: TreeNodeData, x: number, y: number) => {
      const nodeWidth = node.spouse ? NODE_WIDTH * 2 + SPOUSE_GAP : NODE_WIDTH;
      const subtreeWidth = calculateSubtreeWidth(node);
      const nodeX = x + (subtreeWidth - nodeWidth) / 2;
      
      positions.set(node.id, { x: nodeX, y });
      if (node.spouse) {
        positions.set(node.spouse.id, { x: nodeX + NODE_WIDTH + SPOUSE_GAP, y });
      }

      if (node.children && node.children.length > 0) {
        let childX = x;
        node.children.forEach(child => {
          const childWidth = calculateSubtreeWidth(child);
          assignPositions(child, childX, y + NODE_HEIGHT + VERTICAL_GAP);
          childX += childWidth + HORIZONTAL_GAP;
        });
      }
    };

    const totalWidth = calculateSubtreeWidth(root);
    assignPositions(root, 0, 0);
    
    return positions;
  }, []);

  useEffect(() => {
    if (treeRoot) {
      setPositions(calculatePositions(treeRoot));
    }
  }, [treeRoot, calculatePositions]);

  // Generate SVG paths for connections
  const generatePaths = useCallback((node: TreeNodeData): string[] => {
    const paths: string[] = [];
    const nodePos = positions.get(node.id);
    if (!nodePos) return paths;

    const nodeCenter = nodePos.x + NODE_WIDTH / 2;
    const nodeBottom = nodePos.y + NODE_HEIGHT;

    // Spouse connection
    if (node.spouse) {
      const spousePos = positions.get(node.spouse.id);
      if (spousePos) {
        const spouseCenter = spousePos.x + NODE_WIDTH / 2;
        const midY = nodePos.y + NODE_HEIGHT / 2;
        paths.push(`M ${nodePos.x + NODE_WIDTH} ${midY} L ${spousePos.x} ${midY}`);
      }
    }

    // Children connections
    if (node.children && node.children.length > 0) {
      const parentCenterX = node.spouse 
        ? nodeCenter + (NODE_WIDTH + SPOUSE_GAP) / 2 
        : nodeCenter;
      const connectorY = nodeBottom + VERTICAL_GAP / 2;

      // Vertical line down from parent
      paths.push(`M ${parentCenterX} ${nodeBottom} L ${parentCenterX} ${connectorY}`);

      // Horizontal line across children
      const childPositions = node.children
        .map(child => positions.get(child.id))
        .filter((p): p is { x: number; y: number } => p !== undefined);

      if (childPositions.length > 1) {
        const leftMost = Math.min(...childPositions.map(p => p.x + NODE_WIDTH / 2));
        const rightMost = Math.max(...childPositions.map(p => p.x + NODE_WIDTH / 2));
        paths.push(`M ${leftMost} ${connectorY} L ${rightMost} ${connectorY}`);
      }

      // Vertical lines down to each child
      childPositions.forEach(childPos => {
        const childCenterX = childPos.x + NODE_WIDTH / 2;
        paths.push(`M ${childCenterX} ${connectorY} L ${childCenterX} ${childPos.y}`);
      });

      // Recursively get paths for children
      node.children.forEach(child => {
        paths.push(...generatePaths(child));
      });
    }

    return paths;
  }, [positions]);

  const allPaths = useMemo(() => {
    if (!treeRoot) return [];
    return generatePaths(treeRoot);
  }, [treeRoot, generatePaths]);

  // Calculate total dimensions
  const dimensions = useMemo(() => {
    let maxX = 0;
    let maxY = 0;
    positions.forEach(pos => {
      maxX = Math.max(maxX, pos.x + NODE_WIDTH + 50);
      maxY = Math.max(maxY, pos.y + NODE_HEIGHT + 50);
    });
    return { width: Math.max(maxX, 800), height: Math.max(maxY, 500) };
  }, [positions]);

  // Render a single member card at position
  const renderMemberAtPosition = (member: FamilyMember) => {
    const pos = positions.get(member.id);
    if (!pos) return null;

    return (
      <div
        key={member.id}
        className="absolute"
        style={{
          left: pos.x,
          top: pos.y,
          width: NODE_WIDTH,
        }}
      >
        <FamilyMemberCard
          member={member}
          isSelected={selectedMemberId === member.id}
          canEdit={canEdit}
          onClick={() => onMemberClick?.(member)}
          onEdit={() => onMemberEdit?.(member)}
        />
        {canEdit && (
          <Button
            variant="outline"
            size="icon"
            className="absolute -right-10 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-card shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              onAddMember?.(member.id);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    );
  };

  // Flatten all members including spouses
  const allMembers = useMemo(() => {
    const memberSet = new Set<FamilyMember>();
    const collectMembers = (node: TreeNodeData) => {
      memberSet.add(node);
      if (node.spouse) memberSet.add(node.spouse);
      node.children?.forEach(collectMembers);
    };
    if (treeRoot) collectMembers(treeRoot);
    return Array.from(memberSet);
  }, [treeRoot]);

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
          onClick={() => setZoom(z => Math.max(z - 0.1, 0.3))}
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
        ref={containerRef}
        className="w-full h-full overflow-auto p-4 sm:p-8"
        style={{ minHeight: '500px' }}
      >
        {treeRoot ? (
          <motion.div
            className="relative"
            style={{ 
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              width: dimensions.width,
              height: dimensions.height,
            }}
          >
            {/* SVG for connection lines */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={dimensions.width}
              height={dimensions.height}
            >
              {allPaths.map((path, index) => (
                <path
                  key={index}
                  d={path}
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ))}
            </svg>

            {/* Member cards */}
            {allMembers.map(member => renderMemberAtPosition(member))}
          </motion.div>
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
      </div>
    </div>
  );
}
