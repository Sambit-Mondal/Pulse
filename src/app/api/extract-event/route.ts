import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { EVENT_CAUSES } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'GROQ_API_KEY is not set' }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    const systemPrompt = `You are a traffic incident data extraction assistant for Bengaluru Traffic Police.
Your job is to read a natural language report of a traffic incident and extract specific structured parameters.

Extract the following into a JSON object:
1. "eventCause" (string): One of the following EXACT values: [${EVENT_CAUSES.join(', ')}]. Infer the closest match.
2. "priority" (string): Either "high" or "low". Infer based on severity (e.g., massive, severe, VIP = high).
3. "requiresRoadClosure" (boolean): true or false. Infer if the incident sounds like it blocks the entire road or requires a detour.
4. "locationQuery" (string): The name of the specific place, junction, or road mentioned in Bengaluru (e.g., "Silk Board", "Koramangala 80ft Road"). If no location is found, return null.

RESPOND ONLY WITH VALID JSON. Do not include markdown formatting.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const responseContent = chatCompletion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('Empty response from Groq');
    }

    let parsed;
    try {
      parsed = JSON.parse(responseContent);
    } catch (e) {
      throw new Error('Failed to parse Groq response as JSON');
    }

    let latitude = null;
    let longitude = null;

    // If a location query was extracted, try to geocode it using Nominatim
    if (parsed.locationQuery) {
      try {
        const query = encodeURIComponent(`${parsed.locationQuery}, Bengaluru`);
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
          headers: { 'User-Agent': 'Pulse-Traffic-App' },
        });
        const geoData = await geoRes.json();
        
        if (geoData && geoData.length > 0) {
          latitude = parseFloat(geoData[0].lat);
          longitude = parseFloat(geoData[0].lon);
        }
      } catch (err) {
        console.error('[Geocoding] Error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...parsed,
        latitude,
        longitude,
      },
    });
  } catch (error: any) {
    console.error('[API /extract-event] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
