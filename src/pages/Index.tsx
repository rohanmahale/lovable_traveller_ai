import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Plane, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { TripPlannerForm } from '@/components/TripPlannerForm';
import { LoadingAnimation } from '@/components/LoadingAnimation';
import { ItineraryDisplay } from '@/components/ItineraryDisplay';
import { FlightSearch } from '@/components/FlightSearch';
import { PaymentForm } from '@/components/PaymentForm';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { TripFormData, Itinerary, Flight, Trip } from '@/types/travel';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [activeTab, setActiveTab] = useState('plan');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
          <Plane className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleGenerateItinerary = async (formData: TripFormData) => {
    if (!formData.startDate || !formData.endDate) return;
    
    setIsGenerating(true);
    setItinerary(null);

    try {
      // Create trip record first
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert([{
          user_id: user.id,
          destination: formData.destination,
          start_date: format(formData.startDate, 'yyyy-MM-dd'),
          end_date: format(formData.endDate, 'yyyy-MM-dd'),
          budget: parseInt(formData.budget) || null,
          travelers: parseInt(formData.travelers) || 1,
          status: 'draft',
        }])
        .select()
        .single();

      if (tripError) throw tripError;

      // Generate itinerary
      const { data, error } = await supabase.functions.invoke('generate-itinerary', {
        body: {
          destination: formData.destination,
          startDate: format(formData.startDate, 'yyyy-MM-dd'),
          endDate: format(formData.endDate, 'yyyy-MM-dd'),
          budget: parseInt(formData.budget) || 2000,
          travelers: parseInt(formData.travelers) || 1,
          interests: formData.interests,
        },
      });

      if (error) throw error;

      // Update trip with itinerary
      await supabase
        .from('trips')
        .update({ 
          itinerary_json: data.itinerary,
          status: 'planned',
        })
        .eq('id', trip.id);

      setCurrentTrip({ ...trip, itinerary_json: data.itinerary } as Trip);
      setItinerary(data.itinerary);
      setActiveTab('itinerary');

      toast({
        title: "Itinerary Created!",
        description: `Your ${formData.destination} adventure awaits.`,
      });
    } catch (error) {
      console.error('Error generating itinerary:', error);
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
                  <ItineraryDisplay itinerary={itinerary} />
                  <div className="text-center">
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
