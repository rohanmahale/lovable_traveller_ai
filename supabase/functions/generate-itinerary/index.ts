import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { destination, startDate, endDate, budget, travelers, interests } = await req.json();

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const tripDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const systemPrompt = `You are an expert travel concierge who creates detailed, personalized travel itineraries. 
Your itineraries are practical, well-researched, and include local hidden gems.
Always respond with valid JSON matching the exact structure requested.`;

    const userPrompt = `Create a detailed ${tripDays}-day travel itinerary for ${destination}.

Trip Details:
- Dates: ${startDate} to ${endDate}
- Budget: $${budget} total
- Travelers: ${travelers} people
- Interests: ${interests || 'general sightseeing, local cuisine, culture'}

Return a JSON object with this exact structure:
{
  "destination": "${destination}",
  "summary": "A 2-3 sentence overview of the trip",
  "estimatedBudget": {
    "accommodation": number,
    "food": number,
    "activities": number,
    "transport": number,
    "total": number
  },
  "tips": ["tip1", "tip2", "tip3"],
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "title": "Day theme/title",
      "activities": [
        {
          "time": "09:00",
          "title": "Activity name",
          "description": "Brief description",
          "location": "Address or area",
          "duration": "2 hours",
          "estimatedCost": 25,
          "tips": "Optional tip"
        }
      ],
      "meals": [
        {
          "type": "breakfast|lunch|dinner",
          "restaurant": "Name",
          "cuisine": "Type of food",
          "priceRange": "$-$$$$",
          "recommendation": "What to order"
        }
      ]
    }
  ]
}

Make the itinerary realistic, with proper timing between activities. Include a mix of popular attractions and local favorites.`;

    console.log('Calling OpenAI for itinerary generation...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const itineraryContent = data.choices[0].message.content;

    console.log('Itinerary generated successfully');

    let itinerary;
    try {
      itinerary = JSON.parse(itineraryContent);
    } catch (e) {
      console.error('Failed to parse itinerary JSON:', e);
      throw new Error('Failed to parse generated itinerary');
    }

    return new Response(JSON.stringify({ itinerary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in generate-itinerary:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
