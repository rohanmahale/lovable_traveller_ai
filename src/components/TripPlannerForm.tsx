import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, MapPin, Users, Wallet, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { TripFormData } from '@/types/travel';

const POPULAR_DESTINATIONS = [
  "Paris, France",
  "Tokyo, Japan",
  "New York, USA",
  "London, UK",
  "Rome, Italy",
  "Barcelona, Spain",
  "Dubai, UAE",
  "Bangkok, Thailand",
  "Sydney, Australia",
  "Amsterdam, Netherlands",
  "Bali, Indonesia",
  "Singapore",
  "Istanbul, Turkey",
  "Lisbon, Portugal",
  "Prague, Czech Republic",
  "Vienna, Austria",
  "Seoul, South Korea",
  "Cape Town, South Africa",
  "Rio de Janeiro, Brazil",
  "Santorini, Greece",
];

interface TripPlannerFormProps {
  onSubmit: (data: TripFormData) => void;
  isLoading: boolean;
}

export function TripPlannerForm({ onSubmit, isLoading }: TripPlannerFormProps) {
  const [formData, setFormData] = useState<TripFormData>({
    destination: '',
    startDate: undefined,
    endDate: undefined,
    budget: '',
    travelers: '2',
    interests: '',
  });
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);

  const filteredDestinations = useMemo(() => {
    if (!formData.destination) return POPULAR_DESTINATIONS.slice(0, 6);
    return POPULAR_DESTINATIONS.filter(dest =>
      dest.toLowerCase().includes(formData.destination.toLowerCase())
    ).slice(0, 6);
  }, [formData.destination]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleDestinationSelect = (destination: string) => {
    setFormData({ ...formData, destination });
    setShowDestinationDropdown(false);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Destination */}
      <div className="space-y-2 relative">
        <Label htmlFor="destination" className="text-sm font-medium flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Where do you want to go?
        </Label>
        <Input
          id="destination"
          placeholder="Paris, France"
          value={formData.destination}
          onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
          onFocus={() => setShowDestinationDropdown(true)}
          onBlur={() => setTimeout(() => setShowDestinationDropdown(false), 200)}
          className="h-12 text-base"
          autoComplete="off"
          required
        />
        <AnimatePresence>
          {showDestinationDropdown && filteredDestinations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
            >
              {filteredDestinations.map((dest) => (
                <button
                  key={dest}
                  type="button"
                  onClick={() => handleDestinationSelect(dest)}
                  className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-2 text-sm"
                >
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {dest}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary" />
            Start Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-12 justify-start text-left font-normal",
                  !formData.startDate && "text-muted-foreground"
                )}
              >
                {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.startDate}
                onSelect={(date) => setFormData({ ...formData, startDate: date })}
                disabled={(date) => date < new Date()}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-12 justify-start text-left font-normal",
                  !formData.endDate && "text-muted-foreground"
                )}
              >
                {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.endDate}
                onSelect={(date) => setFormData({ ...formData, endDate: date })}
                disabled={(date) => date < (formData.startDate || new Date())}
                defaultMonth={formData.startDate || new Date()}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Budget and Travelers */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budget" className="text-sm font-medium flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            Budget (USD)
          </Label>
          <Input
            id="budget"
            type="number"
            placeholder="2000"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            className="h-12"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="travelers" className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Travelers
          </Label>
          <Input
            id="travelers"
            type="number"
            min="1"
            max="10"
            value={formData.travelers}
            onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
            className="h-12"
            required
          />
        </div>
      </div>

      {/* Interests */}
      <div className="space-y-2">
        <Label htmlFor="interests" className="text-sm font-medium">
          What are you interested in? (optional)
        </Label>
        <Textarea
          id="interests"
          placeholder="Art museums, local food, hiking, nightlife..."
          value={formData.interests}
          onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
          className="resize-none"
          rows={3}
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="hero"
        size="xl"
        className="w-full"
        disabled={isLoading || !formData.destination || !formData.startDate || !formData.endDate}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-5 h-5" />
            </motion.div>
            Creating your itinerary...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Generate AI Itinerary
          </span>
        )}
      </Button>
    </motion.form>
  );
}
