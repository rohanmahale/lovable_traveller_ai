import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { CreditCard, Shield, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Flight } from '@/types/travel';

// Get Stripe publishable key from env
const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
console.log('Stripe key present:', !!STRIPE_KEY);

const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

interface PaymentFormProps {
  flight: Flight;
  tripId: string;
  onSuccess: (bookingId: string) => void;
  onBack: () => void;
}

export function PaymentForm({ flight, tripId, onSuccess, onBack }: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('create-payment-intent', {
          body: {
            amount: flight.price.total,
            currency: flight.price.currency.toLowerCase(),
            metadata: {
              tripId,
              flightId: flight.id,
            },
          },
        });

        if (error) throw error;

        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        toast({
          title: "Payment Error",
          description: "Unable to initialize payment. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [flight, tripId]);

  if (!stripePromise) {
    return (
      <Card className="border-none shadow-card">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Payment system is not configured. Please add your Stripe publishable key.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !clientSecret) {
    return (
      <Card className="border-none shadow-card">
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Setting up secure payment...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Elements 
      stripe={stripePromise} 
      options={{ 
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#e5484d',
            borderRadius: '8px',
          },
        },
      }}
    >
      <CheckoutForm 
        flight={flight} 
        tripId={tripId}
        paymentIntentId={paymentIntentId!}
        onSuccess={onSuccess}
        onBack={onBack}
      />
    </Elements>
  );
}

interface CheckoutFormProps {
  flight: Flight;
  tripId: string;
  paymentIntentId: string;
  onSuccess: (bookingId: string) => void;
  onBack: () => void;
}

function CheckoutForm({ flight, tripId, paymentIntentId, onSuccess, onBack }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/trips`,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Create booking record
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .insert({
            trip_id: tripId,
            provider_name: flight.outbound.carrier,
            amount_cents: Math.round(flight.price.total * 100),
            currency: flight.price.currency.toLowerCase(),
            flight_data_json: JSON.parse(JSON.stringify(flight)),
            payment_status: 'completed',
            stripe_payment_intent_id: paymentIntentId,
          })
          .select()
          .single();

        if (bookingError) {
          console.error('Error creating booking:', bookingError);
          toast({
            title: "Booking Error",
            description: "Payment successful but booking failed. Please contact support.",
            variant: "destructive",
          });
        } else {
          setIsComplete(true);
          setTimeout(() => {
            onSuccess(booking.id);
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
        >
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
        <p className="text-muted-foreground">Your flight has been booked. Redirecting...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to flights
      </Button>

      {/* Order Summary */}
      <Card className="border-none shadow-card bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">{flight.outbound.flightNumber}</p>
              <p className="text-sm text-muted-foreground">
                {flight.outbound.departure.airport} → {flight.outbound.arrival.airport}
              </p>
              <p className="text-xs text-muted-foreground capitalize">{flight.cabinClass.toLowerCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                ${flight.price.total.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground uppercase">{flight.price.currency}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card className="border-none shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="w-5 h-5 text-primary" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement 
              options={{
                layout: 'tabs',
              }}
            />

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>Your payment is secured with 256-bit SSL encryption</span>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="xl"
              className="w-full"
              disabled={!stripe || isProcessing}
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </span>
              ) : (
                `Pay $${flight.price.total.toFixed(2)}`
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
