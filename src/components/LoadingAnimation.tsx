import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Hotel, MapPin, Utensils, Camera, Sparkles } from 'lucide-react';

const loadingSteps = [
  { icon: MapPin, text: "Finding the best destinations...", color: "text-primary" },
  { icon: Hotel, text: "Scouting amazing hotels...", color: "text-accent" },
  { icon: Utensils, text: "Discovering local cuisine...", color: "text-primary" },
  { icon: Camera, text: "Mapping photo-worthy spots...", color: "text-accent" },
  { icon: Plane, text: "Checking travel routes...", color: "text-primary" },
  { icon: Sparkles, text: "Crafting your perfect itinerary...", color: "text-accent" },
];

export function LoadingAnimation() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % loadingSteps.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = loadingSteps[currentStep].icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative">
        {/* Animated rings */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/10"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ width: 120, height: 120, left: -10, top: -10 }}
        />
        <motion.div
          className="absolute inset-0 rounded-full bg-accent/10"
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
          style={{ width: 120, height: 120, left: -10, top: -10 }}
        />

        {/* Icon container */}
        <motion.div
          className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.5, ease: "backOut" }}
            >
              <CurrentIcon className={`w-10 h-10 ${loadingSteps[currentStep].color}`} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Loading text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="mt-8 text-lg font-medium text-foreground"
        >
          {loadingSteps[currentStep].text}
        </motion.p>
      </AnimatePresence>

      {/* Progress dots */}
      <div className="flex gap-2 mt-6">
        {loadingSteps.map((_, index) => (
          <motion.div
            key={index}
            className={`w-2 h-2 rounded-full ${
              index === currentStep ? 'bg-primary' : 'bg-muted'
            }`}
            animate={{
              scale: index === currentStep ? 1.2 : 1,
            }}
            transition={{ duration: 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}
