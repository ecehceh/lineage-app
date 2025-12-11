import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { 
  TreeDeciduous, 
  Users, 
  Lock, 
  Globe, 
  Image, 
  FileText,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import heroBackground from '@/assets/hero-background.jpg';

const features = [
  {
    icon: TreeDeciduous,
    title: 'Visual Family Trees',
    description: 'Build beautiful, interactive family trees with an intuitive drag-and-drop interface.',
  },
  {
    icon: Users,
    title: 'Detailed Profiles',
    description: 'Add photos, dates, biographies, and stories for each family member.',
  },
  {
    icon: Lock,
    title: 'Privacy Controls',
    description: 'Keep your family history private or share it with the world.',
  },
  {
    icon: Globe,
    title: 'Share & Discover',
    description: 'Explore public family trees and connect with others researching similar lineages.',
  },
  {
    icon: Image,
    title: 'Photo Galleries',
    description: 'Upload and organize family photos across generations.',
  },
  {
    icon: FileText,
    title: 'Rich Stories',
    description: 'Write detailed biographies and preserve family stories for future generations.',
  },
];

const benefits = [
  'Preserve your family heritage for future generations',
  'Connect with relatives and discover your roots',
  'Create a visual map of your ancestry',
  'Store family photos and documents securely',
  'Share selective parts of your tree publicly',
];

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={heroBackground}
            alt="Family heritage"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background" />
        </div>

        {/* Content */}
        <div className="relative container mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 text-accent mb-6">
              <TreeDeciduous className="h-4 w-4" />
              <span className="text-sm font-medium">Preserve Your Legacy</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold mb-6 leading-tight">
              Build Your Family's
              <br />
              <span className="text-gradient-gold">Story</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Create beautiful family trees, preserve precious memories, and connect 
              with your heritage. Your family's history deserves to be remembered.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                variant="gold"
                size="xl"
                onClick={() => navigate(user ? '/dashboard' : '/auth?mode=signup')}
              >
                {user ? 'Go to Dashboard' : 'Start Your Tree'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="xl"
                onClick={() => navigate('/explore')}
              >
                Explore Public Trees
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-accent"
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-serif font-bold mb-4">
              Everything You Need to Preserve Your Heritage
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help you build, manage, and share 
              your family history with ease.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card-heritage text-center"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-accent/20 text-accent mb-4">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-serif font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-serif font-bold mb-6">
                Why Families Choose Lineage
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of families who trust Lineage to preserve their most 
                precious memories and connect generations.
              </p>
              
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="h-5 w-5 text-forest flex-shrink-0" />
                    <span>{benefit}</span>
                  </motion.li>
                ))}
              </ul>

              <Button
                variant="gold"
                size="lg"
                className="mt-8"
                onClick={() => navigate(user ? '/dashboard' : '/auth?mode=signup')}
              >
                Get Started Free
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square bg-gradient-to-br from-accent/20 to-wood/20 rounded-3xl overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <TreeDeciduous className="h-48 w-48 text-accent/30" />
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gold/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-wood/20 rounded-full blur-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-wood to-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <TreeDeciduous className="h-16 w-16 mx-auto mb-6 text-gold" />
            <h2 className="text-4xl font-serif font-bold mb-4">
              Start Preserving Your Family History Today
            </h2>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Every family has a story worth telling. Create your free account 
              and begin building your family tree in minutes.
            </p>
            <Button
              variant="gold"
              size="xl"
              onClick={() => navigate(user ? '/dashboard' : '/auth?mode=signup')}
            >
              Create Your Free Tree
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
