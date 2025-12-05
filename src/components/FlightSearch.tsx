import { useState } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Clock, ArrowRight, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flight } from '@/types/travel';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FlightSearchProps {
  destination: string;
  departureDate: string;
  returnDate?: string;
  onSelectFlight: (flight: Flight) => void;
}

// Airline logos mapping
const airlineLogos: Record<string, string> = {
  'AA': 'https://www.gstatic.com/flights/airline_logos/70px/AA.png',
  'UA': 'https://www.gstatic.com/flights/airline_logos/70px/UA.png',
  'DL': 'https://www.gstatic.com/flights/airline_logos/70px/DL.png',
  'BA': 'https://www.gstatic.com/flights/airline_logos/70px/BA.png',
  'AF': 'https://www.gstatic.com/flights/airline_logos/70px/AF.png',
  'LH': 'https://www.gstatic.com/flights/airline_logos/70px/LH.png',
  'EK': 'https://www.gstatic.com/flights/airline_logos/70px/EK.png',
  'QR': 'https://www.gstatic.com/flights/airline_logos/70px/QR.png',
};

export function FlightSearch({ destination, departureDate, returnDate, onSelectFlight }: FlightSearchProps) {
  const [origin, setOrigin] = useState('');
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [carriers, setCarriers] = useState<Record<string, string>>({});

  const searchFlights = async () => {
    if (!origin.trim()) {
      toast({
        title: "Origin required",
        description: "Please enter your departure city",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase.functions.invoke('search-flights', {
        body: {
          origin: origin.toUpperCase(),
          destination: destination.substring(0, 3).toUpperCase(), // Extract IATA code
          departureDate,
          returnDate,
          adults: 1,
        },
      });

      if (error) throw error;

      setFlights(data.flights || []);
      setCarriers(data.carriers || {});

      if (data.flights?.length === 0) {
        toast({
          title: "No flights found",
          description: "Try different dates or airports",
        });
      }
    } catch (error) {
      console.error('Error searching flights:', error);
      toast({
        title: "Search failed",
        description: "Unable to search flights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (duration: string) => {
    // PT2H30M -> 2h 30m
    const match = duration.match(/PT(\d+H)?(\d+M)?/);
    if (!match) return duration;
    const hours = match[1] ? match[1].replace('H', 'h ') : '';
    const minutes = match[2] ? match[2].replace('M', 'm') : '';
    return `${hours}${minutes}`.trim();
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card className="border-none shadow-card">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="origin" className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-primary" />
                From (Airport Code)
              </Label>
              <Input
                id="origin"
                placeholder="JFK, LAX, SFO..."
                value={origin}
                onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                className="h-12 uppercase"
                maxLength={3}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label className="text-muted-foreground">To</Label>
              <Input
                value={destination}
                disabled
                className="h-12 bg-muted"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={searchFlights}
                disabled={isLoading}
                variant="hero"
                size="lg"
                className="h-12 px-8"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <div className="relative">
              <motion.div
                animate={{ x: [0, 100, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Plane className="w-12 h-12 text-primary" />
              </motion.div>
            </div>
            <p className="mt-4 text-muted-foreground">Searching for the best flights...</p>
          </motion.div>
        ) : flights.length > 0 ? (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {flights.map((flight, index) => (
              <FlightCard
                key={flight.id}
                flight={flight}
                carriers={carriers}
                airlineLogos={airlineLogos}
                formatTime={formatTime}
                formatDuration={formatDuration}
                onSelect={() => onSelectFlight(flight)}
                index={index}
              />
            ))}
          </motion.div>
        ) : hasSearched ? (
          <motion.div
            key="no-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Plane className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No flights found</p>
            <p className="text-muted-foreground">Try different dates or airports</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

interface FlightCardProps {
  flight: Flight;
  carriers: Record<string, string>;
  airlineLogos: Record<string, string>;
  formatTime: (dateTime: string) => string;
  formatDuration: (duration: string) => string;
  onSelect: () => void;
  index: number;
}

function FlightCard({ flight, carriers, airlineLogos, formatTime, formatDuration, onSelect, index }: FlightCardProps) {
  const carrierCode = flight.outbound.carrier;
  const carrierName = carriers[carrierCode] || carrierCode;
  const logo = airlineLogos[carrierCode];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow cursor-pointer group">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Airline Info */}
            <div className="flex items-center gap-4 min-w-[140px]">
              {logo ? (
                <img src={logo} alt={carrierName} className="w-10 h-10 object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plane className="w-5 h-5 text-primary" />
                </div>
              )}
              <div>
                <p className="font-semibold">{carrierName}</p>
                <p className="text-xs text-muted-foreground">{flight.outbound.flightNumber}</p>
              </div>
            </div>

            {/* Flight Times */}
            <div className="flex items-center gap-6 flex-1 justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold">{formatTime(flight.outbound.departure.time)}</p>
                <p className="text-sm text-muted-foreground">{flight.outbound.departure.airport}</p>
              </div>

              <div className="flex flex-col items-center gap-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(flight.outbound.duration)}
                </p>
                <div className="w-24 md:w-32 h-[2px] bg-gradient-to-r from-primary to-accent relative">
                  <ArrowRight className="w-4 h-4 text-accent absolute -right-2 -top-[7px]" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {flight.outbound.stops === 0 ? 'Direct' : `${flight.outbound.stops} stop${flight.outbound.stops > 1 ? 's' : ''}`}
                </p>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold">{formatTime(flight.outbound.arrival.time)}</p>
                <p className="text-sm text-muted-foreground">{flight.outbound.arrival.airport}</p>
              </div>
            </div>

            {/* Price & Select */}
            <div className="flex flex-col items-center md:items-end gap-2">
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  ${flight.price.total.toFixed(0)}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {flight.cabinClass}
                </Badge>
              </div>
              <Button 
                variant="coral" 
                size="sm" 
                onClick={onSelect}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Select Flight
              </Button>
            </div>
          </div>

          {/* Return Flight */}
          {flight.return && (
            <div className="mt-4 pt-4 border-t border-dashed">
              <p className="text-xs text-muted-foreground mb-2">Return Flight</p>
              <div className="flex items-center gap-6 justify-center">
                <div className="text-center">
                  <p className="font-semibold">{formatTime(flight.return.departure.time)}</p>
                  <p className="text-xs text-muted-foreground">{flight.return.departure.airport}</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <p className="text-xs text-muted-foreground">{formatDuration(flight.return.duration)}</p>
                  <div className="w-16 h-[1px] bg-muted-foreground/30" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">{formatTime(flight.return.arrival.time)}</p>
                  <p className="text-xs text-muted-foreground">{flight.return.arrival.airport}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
