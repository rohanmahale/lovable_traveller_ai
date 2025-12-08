import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, Globe, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Auth() {
  const navigate = useNavigate();

  const handleEnter = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-20 w-64 h-64 rounded-full bg-primary/5"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-accent/5"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <Card className="border-none shadow-xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <motion.div
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <Plane className="w-10 h-10 text-primary-foreground" />
              </motion.div>
              <h1 className="text-3xl font-bold mb-2">Voyager AI</h1>
              <p className="text-muted-foreground">Your intelligent travel concierge</p>
            </div>

            <div className="space-y-4">
              <Button variant="hero" size="xl" className="w-full" onClick={handleEnter}>
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 text-center text-sm text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                <span>AI Itineraries</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Plane className="w-5 h-5 text-accent" />
                <span>Real Flights</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>Smart Planning</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}