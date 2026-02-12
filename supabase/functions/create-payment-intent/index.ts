import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Input validation
    const amount = Number(body.amount);
    const currency = typeof body.currency === 'string' ? body.currency.toLowerCase().slice(0, 3) : 'usd';
    const metadata = body.metadata && typeof body.metadata === 'object' ? body.metadata : {};

    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
      return new Response(JSON.stringify({ error: 'Invalid amount. Must be between $0.01 and $100,000.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!/^[a-z]{3}$/.test(currency)) {
      return new Response(JSON.stringify({ error: 'Invalid currency code.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    if (!STRIPE_SECRET_KEY) {
      throw new Error('Stripe API key not configured');
    }

    // Amount should be in cents
    const amountInCents = Math.round(amount * 100);

    console.log('Creating payment intent:', { amountInCents, currency });

    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: String(amountInCents),
        currency: currency || 'usd',
        'automatic_payment_methods[enabled]': 'true',
        ...(metadata && { 'metadata[trip_id]': metadata.tripId || '' }),
        ...(metadata && { 'metadata[booking_id]': metadata.bookingId || '' }),
        ...(metadata && { 'metadata[flight_id]': metadata.flightId || '' }),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stripe API error:', errorText);
      throw new Error(`Stripe error: ${response.status}`);
    }

    const paymentIntent = await response.json();

    console.log('Payment intent created:', paymentIntent.id);

    return new Response(JSON.stringify({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in create-payment-intent:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
