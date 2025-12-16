import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FamilyTree, LinkedTree } from '@/lib/types';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { TreeCard } from '@/components/cards/TreeCard';
import { LinkTreeDialog } from '@/components/tree/LinkTreeDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, TreeDeciduous, Search, Loader2, Link2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [trees, setTrees] = useState<FamilyTree[]>([]);
  const [linkedTrees, setLinkedTrees] = useState<LinkedTree[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTreeData, setNewTreeData] = useState({
    name: '',
    description: '',
    is_public: false,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    await Promise.all([fetchTrees(), fetchLinkedTrees()]);
    setLoading(false);
  };

  const fetchTrees = async () => {
    if (!user) return;

    try {
      const { data: treesData, error: treesError } = await supabase
        .from('family_trees')
        .select('*')
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false });

      if (treesError) throw treesError;

      setTrees((treesData as FamilyTree[]) || []);

      // Fetch member counts
      if (treesData && treesData.length > 0) {
        const counts: Record<string, number> = {};
        for (const tree of treesData) {
          const { count } = await supabase
            .from('family_members')
            .select('*', { count: 'exact', head: true })
            .eq('tree_id', tree.id);
          counts[tree.id] = count || 0;
        }
        setMemberCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching trees:', error);
      toast.error('Failed to load your family trees');
    }
  };

  const fetchLinkedTrees = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('linked_trees')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinkedTrees((data as LinkedTree[]) || []);
    } catch (error) {
      console.error('Error fetching linked trees:', error);
    }
  };

  const handleCreateTree = async () => {
    if (!user || !newTreeData.name.trim()) return;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('family_trees')
        .insert({
          owner_id: user.id,
          name: newTreeData.name.trim(),
          description: newTreeData.description.trim() || null,
          is_public: newTreeData.is_public,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Family tree created!');
      setCreateDialogOpen(false);
      setNewTreeData({ name: '', description: '', is_public: false });
      navigate(`/tree/${data.id}`);
    } catch (error) {
      console.error('Error creating tree:', error);
      toast.error('Failed to create family tree');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteLinkedTree = async (linkedTreeId: string) => {
    try {
      const { error } = await supabase
        .from('linked_trees')
        .delete()
        .eq('id', linkedTreeId);

      if (error) throw error;

      toast.success('Link removed');
      fetchLinkedTrees();
    } catch (error) {
      console.error('Error deleting linked tree:', error);
      toast.error('Failed to remove link');
    }
  };

  const filteredTrees = trees.filter(tree =>
    tree.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tree.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTreeNamesForLink = (link: LinkedTree) => {
    const tree1 = trees.find(t => t.id === link.tree1_id);
    const tree2 = trees.find(t => t.id === link.tree2_id);
    return `${tree1?.name || 'Unknown'} + ${tree2?.name || 'Unknown'}`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
          >
            <div>
              <h1 className="text-3xl font-serif font-bold mb-2">My Family Trees</h1>
              <p className="text-muted-foreground">
                Create and manage your family history
              </p>
            </div>
            <div className="flex gap-2">
              {trees.length >= 2 && (
                <Button variant="outline" onClick={() => setLinkDialogOpen(true)}>
                  <Link2 className="mr-2 h-5 w-5" />
                  Link Trees
                </Button>
              )}
              <Button variant="gold" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-5 w-5" />
                Create New Tree
              </Button>
            </div>
          </motion.div>

          {/* Linked Trees Section */}
          {linkedTrees.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mb-8"
            >
              <h2 className="text-lg font-serif font-semibold mb-4 flex items-center gap-2">
                <Link2 className="h-5 w-5 text-accent" />
                Combined Family Views
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {linkedTrees.map((link) => (
                  <Card
                    key={link.id}
                    className="group cursor-pointer hover:shadow-elegant transition-shadow"
                    onClick={() => navigate(`/linked/${link.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-serif font-semibold mb-1">{link.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {getTreeNamesForLink(link)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLinkedTree(link.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative max-w-md mb-8"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search your trees..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </motion.div>

          {/* Trees Grid */}
          {filteredTrees.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrees.map((tree, index) => (
                <TreeCard
                  key={tree.id}
                  tree={tree}
                  memberCount={memberCounts[tree.id] || 0}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <TreeDeciduous className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-serif font-semibold mb-2">
                {searchQuery ? 'No trees found' : 'No family trees yet'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Start preserving your family history by creating your first tree'}
              </p>
              {!searchQuery && (
                <Button variant="gold" onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-5 w-5" />
                  Create Your First Tree
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </main>

      <Footer />

      {/* Create Tree Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Create New Family Tree</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tree-name">Tree Name *</Label>
              <Input
                id="tree-name"
                placeholder="e.g., Smith Family Tree"
                value={newTreeData.name}
                onChange={(e) => setNewTreeData({ ...newTreeData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tree-description">Description</Label>
              <Textarea
                id="tree-description"
                placeholder="A brief description of your family tree..."
                rows={3}
                value={newTreeData.description}
                onChange={(e) => setNewTreeData({ ...newTreeData, description: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is-public" className="block mb-1">Make tree public</Label>
                <p className="text-xs text-muted-foreground">
                  Public trees can be viewed by anyone
                </p>
              </div>
              <Switch
                id="is-public"
                checked={newTreeData.is_public}
                onCheckedChange={(checked) => setNewTreeData({ ...newTreeData, is_public: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gold"
              onClick={handleCreateTree}
              disabled={!newTreeData.name.trim() || creating}
            >
              {creating ? 'Creating...' : 'Create Tree'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Trees Dialog */}
      {user && (
        <LinkTreeDialog
          open={linkDialogOpen}
          onClose={() => setLinkDialogOpen(false)}
          userId={user.id}
          onSuccess={fetchLinkedTrees}
        />
      )}
    </div>
  );
}
