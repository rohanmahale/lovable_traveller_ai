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
    const startTime = Date.now();
    console.log('[TIMING] Request received at:', new Date().toISOString());

    const { destination, startDate, endDate, budget, travelers, interests } = await req.json();
    console.log('[TIMING] Body parsed:', Date.now() - startTime, 'ms');
    console.log('[INPUT] destination:', destination, 'dates:', startDate, '-', endDate, 'travelers:', travelers);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    console.log('[TIMING] API key validated:', Date.now() - startTime, 'ms');

    const tripDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    console.log('[INPUT] Trip duration:', tripDays, 'days');
    
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

    console.log('[TIMING] Prompts prepared:', Date.now() - startTime, 'ms');
    console.log('[TIMING] Starting OpenAI API call...');
    const openaiStartTime = Date.now();

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
        max_tokens: 8000,
        response_format: { type: "json_object" }
      }),
    });

    console.log('[TIMING] OpenAI API responded:', Date.now() - openaiStartTime, 'ms (API call only)');
    console.log('[TIMING] Total so far:', Date.now() - startTime, 'ms');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const parseStartTime = Date.now();
    const data = await response.json();
    console.log('[TIMING] Response JSON parsed:', Date.now() - parseStartTime, 'ms');

    const itineraryContent = data.choices[0].message.content;
    const finishReason = data.choices[0].finish_reason;

    console.log('[TIMING] finish_reason:', finishReason);
    console.log('[TIMING] Content length:', itineraryContent?.length || 0, 'characters');
    console.log('[TIMING] Usage:', JSON.stringify(data.usage));

    // Check if response was truncated
    if (finishReason === 'length') {
      console.error('Response was truncated due to token limit');
      throw new Error('Itinerary too long - try a shorter trip duration');
    }

    let itinerary;
    try {
      // Clean the content - remove any markdown code blocks if present
      let cleanedContent = itineraryContent.trim();
      
      // Remove markdown code blocks if wrapped
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.slice(7);
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.slice(3);
      }
      if (cleanedContent.endsWith('```')) {
        cleanedContent = cleanedContent.slice(0, -3);
      }
      cleanedContent = cleanedContent.trim();

      const jsonParseStart = Date.now();
      itinerary = JSON.parse(cleanedContent);
      console.log('[TIMING] JSON.parse:', Date.now() - jsonParseStart, 'ms');
    } catch (e) {
      console.error('Failed to parse itinerary JSON:', e);
      console.error('Raw content (first 500 chars):', itineraryContent?.substring(0, 500));
      console.error('Raw content (last 500 chars):', itineraryContent?.substring(itineraryContent.length - 500));
      throw new Error('Failed to parse generated itinerary');
    }

    console.log('[TIMING] Total request time:', Date.now() - startTime, 'ms');
    console.log('[SUCCESS] Itinerary generated with', itinerary.days?.length || 0, 'days');

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
