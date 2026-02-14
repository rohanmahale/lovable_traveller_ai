import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { originCountry, destinationCountry } = await req.json();

    if (!originCountry || !destinationCountry) {
      return new Response(
        JSON.stringify({ error: "Origin and destination countries are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a visa and travel requirements expert. Provide accurate, concise visa requirement information. Respond ONLY with valid JSON, no markdown.`,
          },
          {
            role: "user",
            content: `What are the visa requirements for a citizen of "${originCountry}" traveling to "${destinationCountry}"? Respond in this JSON format:
{
  "visaRequired": true/false,
  "visaType": "e.g. Tourist Visa, eVisa, Visa on Arrival, Visa-Free",
  "maxStay": "e.g. 90 days, 30 days",
  "processingTime": "e.g. 3-5 business days",
  "requirements": ["valid passport with 6+ months validity", "return ticket", ...],
  "notes": ["any important notes or tips"],
  "estimatedCost": "e.g. $50 USD or Free"
}`,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI Gateway error:", errText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response, stripping any markdown
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const visaInfo = JSON.parse(cleaned);

    return new Response(JSON.stringify({ visaInfo }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message, visaInfo: null }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
