import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Amadeus API endpoints
const AMADEUS_AUTH_URL = 'https://test.api.amadeus.com/v1/security/oauth2/token';
const AMADEUS_FLIGHT_URL = 'https://test.api.amadeus.com/v2/shopping/flight-offers';

async function getAmadeusToken(): Promise<string> {
  const apiKey = Deno.env.get('AMADEUS_API_KEY');
  const apiSecret = Deno.env.get('AMADEUS_API_SECRET');

  if (!apiKey || !apiSecret) {
    throw new Error('Amadeus API credentials not configured');
  }

  const response = await fetch(AMADEUS_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: apiKey,
      client_secret: apiSecret,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Amadeus auth error:', errorText);
    throw new Error('Failed to authenticate with Amadeus');
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { origin, destination, departureDate, returnDate, adults, cabinClass } = await req.json();

    console.log('Searching flights:', { origin, destination, departureDate, returnDate, adults });

    // Get Amadeus access token
    const accessToken = await getAmadeusToken();

    // Build search parameters
    const params = new URLSearchParams({
      originLocationCode: origin.toUpperCase(),
      destinationLocationCode: destination.toUpperCase(),
      departureDate: departureDate,
      adults: String(adults || 1),
      max: '10',
      currencyCode: 'USD',
    });

    if (returnDate) {
      params.append('returnDate', returnDate);
    }

    if (cabinClass) {
      params.append('travelClass', cabinClass);
    }

    const flightResponse = await fetch(`${AMADEUS_FLIGHT_URL}?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!flightResponse.ok) {
      const errorText = await flightResponse.text();
      console.error('Amadeus flight search error:', errorText);
      throw new Error(`Flight search failed: ${flightResponse.status}`);
    }

    const flightData = await flightResponse.json();
    console.log(`Found ${flightData.data?.length || 0} flight offers`);

    // Transform the Amadeus response to a cleaner format
    const flights = (flightData.data || []).map((offer: any) => {
      const outbound = offer.itineraries[0];
      const returnFlight = offer.itineraries[1];
      const firstSegment = outbound.segments[0];
      const lastOutboundSegment = outbound.segments[outbound.segments.length - 1];

      return {
        id: offer.id,
        price: {
          total: parseFloat(offer.price.total),
          currency: offer.price.currency,
        },
        outbound: {
          departure: {
            airport: firstSegment.departure.iataCode,
            time: firstSegment.departure.at,
          },
          arrival: {
            airport: lastOutboundSegment.arrival.iataCode,
            time: lastOutboundSegment.arrival.at,
          },
          duration: outbound.duration,
          stops: outbound.segments.length - 1,
          carrier: firstSegment.carrierCode,
          flightNumber: `${firstSegment.carrierCode}${firstSegment.number}`,
        },
        return: returnFlight ? {
          departure: {
            airport: returnFlight.segments[0].departure.iataCode,
            time: returnFlight.segments[0].departure.at,
          },
          arrival: {
            airport: returnFlight.segments[returnFlight.segments.length - 1].arrival.iataCode,
            time: returnFlight.segments[returnFlight.segments.length - 1].arrival.at,
          },
          duration: returnFlight.duration,
          stops: returnFlight.segments.length - 1,
          carrier: returnFlight.segments[0].carrierCode,
          flightNumber: `${returnFlight.segments[0].carrierCode}${returnFlight.segments[0].number}`,
        } : null,
        cabinClass: offer.travelerPricings[0]?.fareDetailsBySegment[0]?.cabin || 'ECONOMY',
        bookingClass: offer.travelerPricings[0]?.fareDetailsBySegment[0]?.class,
        seatsAvailable: offer.numberOfBookableSeats,
      };
    });

    // Get airline dictionaries for carrier names
    const carriers = flightData.dictionaries?.carriers || {};

    return new Response(JSON.stringify({ 
      flights,
      carriers,
      meta: {
        count: flights.length,
        currency: 'USD',
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in search-flights:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      flights: [],
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
