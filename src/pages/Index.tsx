import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Plane, Sparkles, RefreshCw } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { TripPlannerForm } from '@/components/TripPlannerForm';
import { LoadingAnimation } from '@/components/LoadingAnimation';
import { ItineraryDisplay } from '@/components/ItineraryDisplay';
import { FlightSearch } from '@/components/FlightSearch';
import { PaymentForm } from '@/components/PaymentForm';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { TripFormData, Itinerary, Flight, Trip } from '@/types/travel';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [tripOrigin, setTripOrigin] = useState<string>('');
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [lastFormData, setLastFormData] = useState<TripFormData | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [activeTab, setActiveTab] = useState('plan');

  const handleGenerateItinerary = async (formData: TripFormData, isRegenerate = false) => {
    if (!formData.startDate || !formData.endDate) return;
    
    setLastFormData(formData);
    setIsGenerating(true);
    // Only clear itinerary on new generation, not regeneration (to keep showing current while loading)
    if (!isRegenerate) {
      setItinerary(null);
    }

    const totalStart = performance.now();
    console.log('[FRONTEND TIMING] Starting itinerary generation...');

    try {
      // Create trip record first
      const userId = user!.id;
      
      const dbInsertStart = performance.now();
      console.log('[FRONTEND TIMING] Creating trip record...');
      
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert([{
          user_id: userId,
          destination: formData.destination,
          start_date: format(formData.startDate, 'yyyy-MM-dd'),
          end_date: format(formData.endDate, 'yyyy-MM-dd'),
          budget: parseInt(formData.budget) || null,
          travelers: parseInt(formData.travelers) || 1,
          status: 'draft',
        }])
        .select()
        .single();

      console.log('[FRONTEND TIMING] Trip record created:', (performance.now() - dbInsertStart).toFixed(0), 'ms');

      if (tripError) throw tripError;

      // Generate itinerary
      const edgeFnStart = performance.now();
      console.log('[FRONTEND TIMING] Calling generate-itinerary edge function...');
      
      const requestBody = {
        destination: formData.destination,
        startDate: format(formData.startDate, 'yyyy-MM-dd'),
        endDate: format(formData.endDate, 'yyyy-MM-dd'),
        budget: parseInt(formData.budget) || 2000,
        travelers: parseInt(formData.travelers) || 1,
        interests: formData.interests,
      };
      
      console.log('[FRONTEND REQUEST] Sending to edge function:', JSON.stringify(requestBody, null, 2));
      console.log('[FRONTEND REQUEST] Timestamp:', new Date().toISOString());
      
      const { data, error } = await supabase.functions.invoke('generate-itinerary', {
        body: requestBody,
      });

      console.log('[FRONTEND TIMING] Edge function returned:', (performance.now() - edgeFnStart).toFixed(0), 'ms');
      console.log('[AI RESPONSE] Timestamp:', new Date().toISOString());
      console.log('[AI RESPONSE] Itinerary data:', JSON.stringify(data, null, 2));

      if (error) throw error;

      // Update trip with itinerary
      const dbUpdateStart = performance.now();
      console.log('[FRONTEND TIMING] Updating trip with itinerary...');
      
      await supabase
        .from('trips')
        .update({ 
          itinerary_json: data.itinerary,
          status: 'planned',
        })
        .eq('id', trip.id);

      console.log('[FRONTEND TIMING] Trip updated:', (performance.now() - dbUpdateStart).toFixed(0), 'ms');
      console.log('[FRONTEND TIMING] Total time:', (performance.now() - totalStart).toFixed(0), 'ms');

      setCurrentTrip({ ...trip, itinerary_json: data.itinerary } as Trip);
      setTripOrigin(formData.origin);
      setItinerary(data.itinerary);
      setActiveTab('itinerary');

      toast({
        title: "Itinerary Created!",
        description: `Your ${formData.destination} adventure awaits.`,
      });
    } catch (error) {
      console.error('[FRONTEND TIMING] Error after', (performance.now() - totalStart).toFixed(0), 'ms:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to create itinerary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectFlight = (flight: Flight) => {
    setSelectedFlight(flight);
    setActiveTab('payment');
  };

  const handlePaymentSuccess = (bookingId: string) => {
    toast({
      title: "Booking Confirmed!",
      description: "Your flight has been booked successfully.",
    });
    navigate('/trips');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Plan Your <span className="gradient-text">Dream Trip</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              AI-powered itineraries, real flights, seamless booking
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 h-12">
              <TabsTrigger value="plan" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Plan</span>
              </TabsTrigger>
              <TabsTrigger value="itinerary" disabled={!itinerary}>
                Itinerary
              </TabsTrigger>
              <TabsTrigger value="flights" disabled={!itinerary}>
                Flights
              </TabsTrigger>
              <TabsTrigger value="payment" disabled={!selectedFlight}>
                Payment
              </TabsTrigger>
            </TabsList>

            <TabsContent value="plan" className="space-y-6">
              {isGenerating ? (
                <LoadingAnimation />
              ) : (
                <TripPlannerForm onSubmit={handleGenerateItinerary} isLoading={isGenerating} />
              )}
            </TabsContent>

            <TabsContent value="itinerary">
              {itinerary && (
                <div className="space-y-6">
                  <div className="relative">
                    {isGenerating && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                        <div className="flex flex-col items-center gap-3">
                          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                          <p className="text-sm font-medium text-muted-foreground">Generating new itinerary...</p>
                        </div>
                      </div>
                    )}
                    <ItineraryDisplay itinerary={itinerary} />
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="lg" disabled={isGenerating}>
                          <RefreshCw className={`w-5 h-5 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                          Generate New Itinerary
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Generate New Itinerary?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will replace your current itinerary with a new AI-generated one using the same trip details. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => lastFormData && handleGenerateItinerary(lastFormData, true)}
                          >
                            Generate New
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="hero" size="lg" onClick={() => setActiveTab('flights')}>
                      <Plane className="w-5 h-5 mr-2" />
                      Search Flights
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="flights">
              {currentTrip && (
                <FlightSearch
                  origin={tripOrigin}
                  destination={currentTrip.destination}
                  departureDate={currentTrip.start_date}
                  returnDate={currentTrip.end_date}
                  onSelectFlight={handleSelectFlight}
                />
              )}
            </TabsContent>

            <TabsContent value="payment">
              {selectedFlight && currentTrip && (
                <PaymentForm
                  flight={selectedFlight}
                  tripId={currentTrip.id}
                  onSuccess={handlePaymentSuccess}
                  onBack={() => {
                    setSelectedFlight(null);
                    setActiveTab('flights');
                  }}
                />
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
