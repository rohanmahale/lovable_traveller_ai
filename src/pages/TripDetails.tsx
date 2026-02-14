import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Plane, ArrowLeft, Calendar, Users, DollarSign, MapPin,
  Clock, Shield, Loader2, AlertCircle, CheckCircle2
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { ItineraryDisplay } from '@/components/ItineraryDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Trip, Booking, Itinerary, Flight } from '@/types/travel';

interface VisaInfo {
  visaRequired: boolean;
  visaType: string;
  maxStay: string;
  processingTime: string;
  requirements: string[];
  notes: string[];
  estimatedCost: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  planned: 'bg-blue-100 text-blue-800',
  booked: 'bg-green-100 text-green-800',
  completed: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
};

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-purple-100 text-purple-800',
};

export default function TripDetails() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [visaInfo, setVisaInfo] = useState<VisaInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visaLoading, setVisaLoading] = useState(false);
  const [visaError, setVisaError] = useState<string | null>(null);
  const [originCountry, setOriginCountry] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user || !id) return;

    const fetchData = async () => {
      setIsLoading(true);
      const [tripRes, bookingsRes] = await Promise.all([
        supabase.from('trips').select('*').eq('id', id).single(),
        supabase.from('bookings').select('*').eq('trip_id', id).order('created_at', { ascending: false }),
      ]);

      if (tripRes.error) {
        console.error('Error fetching trip:', tripRes.error);
        navigate('/trips');
        return;
      }

      setTrip(tripRes.data as unknown as Trip);
      setBookings((bookingsRes.data as unknown as Booking[]) || []);
      setIsLoading(false);
    };

    fetchData();
  }, [user, id, navigate]);

  // Fetch visa info when origin country is provided
  const fetchVisaInfo = async (origin: string) => {
    if (!trip || !origin.trim()) return;
    setVisaLoading(true);
    setVisaError(null);

    try {
      const { data, error } = await supabase.functions.invoke('get-visa-requirements', {
        body: { originCountry: origin, destinationCountry: trip.destination },
      });

      if (error) throw error;
      setVisaInfo(data.visaInfo);
    } catch (err: any) {
      console.error('Visa info error:', err);
      setVisaError('Could not fetch visa requirements. Please try again.');
    } finally {
      setVisaLoading(false);
    }
  };

  if (authLoading || isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
          <Plane className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!trip) return null;

  const itinerary = trip.itinerary_json as Itinerary | null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button & header */}
          <div className="mb-6">
            <Link to="/trips">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Trips
              </Button>
            </Link>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-bold">{trip.destination}</h1>
                  <Badge className={statusColors[trip.status] || statusColors.draft}>
                    {trip.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(trip.start_date), 'MMM d')} – {format(new Date(trip.end_date), 'MMM d, yyyy')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {trip.travelers} traveler{trip.travelers > 1 ? 's' : ''}
                  </span>
                  {trip.budget && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />${trip.budget}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue={itinerary ? 'itinerary' : 'overview'} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-12">
              <TabsTrigger value="itinerary" disabled={!itinerary}>Itinerary</TabsTrigger>
              <TabsTrigger value="flights">Flights & Booking</TabsTrigger>
              <TabsTrigger value="visa">Visa Info</TabsTrigger>
            </TabsList>

            {/* Itinerary Tab */}
            <TabsContent value="itinerary">
              {itinerary ? (
                <ItineraryDisplay itinerary={itinerary} />
              ) : (
                <Card className="border-none shadow-card">
                  <CardContent className="p-12 text-center">
                    <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No itinerary yet</h2>
                    <p className="text-muted-foreground">This trip doesn't have an itinerary generated.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Flights & Booking Tab */}
            <TabsContent value="flights">
              {bookings.length === 0 ? (
                <Card className="border-none shadow-card">
                  <CardContent className="p-12 text-center">
                    <Plane className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No bookings yet</h2>
                    <p className="text-muted-foreground">No flights have been booked for this trip.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => {
                    const flight = booking.flight_data_json as Flight | null;
                    return (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card className="border-none shadow-card">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Plane className="w-5 h-5 text-primary" />
                                {booking.provider_name}
                              </CardTitle>
                              <Badge className={paymentStatusColors[booking.payment_status || 'pending']}>
                                {booking.payment_status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Amount</span>
                              <span className="text-xl font-bold text-primary">
                                ${(booking.amount_cents / 100).toFixed(2)} {booking.currency?.toUpperCase()}
                              </span>
                            </div>

                            {flight && (
                              <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="text-center">
                                    <p className="text-lg font-bold">{flight.outbound.departure.airport}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(flight.outbound.departure.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                    </p>
                                  </div>
                                  <div className="flex-1 mx-4 flex flex-col items-center gap-1">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {flight.outbound.duration}
                                    </p>
                                    <div className="w-full h-[2px] bg-gradient-to-r from-primary to-accent" />
                                    <p className="text-xs text-muted-foreground">
                                      {flight.outbound.stops === 0 ? 'Direct' : `${flight.outbound.stops} stop(s)`}
                                    </p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-lg font-bold">{flight.outbound.arrival.airport}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(flight.outbound.arrival.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-3 text-xs text-muted-foreground">
                                  <span>Flight: {flight.outbound.flightNumber}</span>
                                  <span>Carrier: {flight.outbound.carrier}</span>
                                  <span>Class: {flight.cabinClass}</span>
                                </div>
                              </div>
                            )}

                            <p className="text-xs text-muted-foreground">
                              Booked on {format(new Date(booking.created_at), 'MMM d, yyyy \'at\' h:mm a')}
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Visa Tab */}
            <TabsContent value="visa">
              <Card className="border-none shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Visa Requirements for {trip.destination}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Origin input */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="Enter your country of origin (e.g. United States, India)"
                      value={originCountry}
                      onChange={(e) => setOriginCountry(e.target.value)}
                      className="flex-1 h-12 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button
                      variant="hero"
                      className="h-12"
                      onClick={() => fetchVisaInfo(originCountry)}
                      disabled={visaLoading || !originCountry.trim()}
                    >
                      {visaLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                      Check Visa
                    </Button>
                  </div>

                  {visaError && (
                    <div className="flex items-center gap-2 p-4 bg-destructive/10 rounded-xl text-destructive text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {visaError}
                    </div>
                  )}

                  {visaInfo && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      {/* Summary */}
                      <div className={`p-4 rounded-xl flex items-center gap-3 ${visaInfo.visaRequired ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'}`}>
                        {visaInfo.visaRequired ? (
                          <AlertCircle className="w-5 h-5 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold">
                            {visaInfo.visaRequired ? 'Visa Required' : 'Visa-Free Entry'}
                          </p>
                          <p className="text-sm opacity-80">{visaInfo.visaType} • Max stay: {visaInfo.maxStay}</p>
                        </div>
                      </div>

                      {/* Details grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted rounded-xl">
                          <p className="text-sm text-muted-foreground">Processing Time</p>
                          <p className="font-semibold">{visaInfo.processingTime}</p>
                        </div>
                        <div className="p-4 bg-muted rounded-xl">
                          <p className="text-sm text-muted-foreground">Estimated Cost</p>
                          <p className="font-semibold">{visaInfo.estimatedCost}</p>
                        </div>
                      </div>

                      {/* Requirements */}
                      {visaInfo.requirements?.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Requirements</h4>
                          <ul className="space-y-2">
                            {visaInfo.requirements.map((req, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm p-2 bg-muted/50 rounded-lg">
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Notes */}
                      {visaInfo.notes?.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Important Notes</h4>
                          <ul className="space-y-2">
                            {visaInfo.notes.map((note, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm p-2 bg-accent/10 rounded-lg">
                                <AlertCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                                {note}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {!visaInfo && !visaLoading && !visaError && (
                    <p className="text-center text-muted-foreground py-6">
                      Enter your country of origin above to check visa requirements.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
