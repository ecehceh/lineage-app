import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { FamilyTree } from '@/lib/types';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { TreeCard } from '@/components/cards/TreeCard';
import { Input } from '@/components/ui/input';
import { TreeDeciduous, Search, Loader2 } from 'lucide-react';

export default function Explore() {
  const [trees, setTrees] = useState<FamilyTree[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPublicTrees();
  }, []);

  const fetchPublicTrees = async () => {
    try {
      const { data: treesData, error } = await supabase
        .from('family_trees')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

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
      console.error('Error fetching public trees:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrees = trees.filter(tree =>
    tree.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tree.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-serif font-bold mb-4">
              Explore Family Trees
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover public family trees shared by our community. 
              Get inspired to build your own family history.
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative max-w-md mx-auto mb-12"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search public trees..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </motion.div>

          {/* Trees Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : filteredTrees.length > 0 ? (
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
                {searchQuery ? 'No trees found' : 'No public trees yet'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Be the first to share your family tree with the community'}
              </p>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
