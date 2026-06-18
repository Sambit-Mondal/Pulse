// ============================================================================
// Groq Agentic Prompt Layer
// Orchestrates the RAG pipeline using Groq llama-3.3-70b-versatile
// ============================================================================

import Groq from 'groq-sdk';
import type { SimilarEvent, PredictionResult, ProcessedEvent } from '../types';

// ---------------------------------------------------------------------------
// Initialize Groq client
// ---------------------------------------------------------------------------
function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('[Agent] GROQ_API_KEY environment variable is required');
  }
  return new Groq({ apiKey });
}

// ---------------------------------------------------------------------------
// Build the system prompt for the traffic analyst agent
// ---------------------------------------------------------------------------
function buildSystemPrompt(): string {
  return `You are PULSE, an expert AI traffic operations analyst for the Bengaluru Traffic Police.
Your job is to analyze historical traffic incident data and predict the impact of new events.

Given a new traffic event and a set of historically similar events found nearby, you must produce a JSON response with:

1. "forecastedDelayHours" (number): Estimated hours this event will cause traffic delays, based on the average resolution time of similar historical events. Weight recent events more heavily.

2. "recommendedManpower" (number): Number of traffic police personnel to deploy. Base calculation:
   - Low priority, no road closure: 2-4 personnel
   - Low priority, road closure: 4-6 personnel
   - High priority, no road closure: 4-8 personnel
   - High priority, road closure: 8-15 personnel
   Adjust based on the event type, time of day, and historical patterns.

3. "diversionStrategy" (string): Detailed, actionable text recommending specific barricading points and traffic diversion routes. Reference actual road names and junctions from the historical data when available.

4. "confidenceScore" (number, 0-1): How confident you are in these predictions based on the quality and quantity of similar events. More similar events = higher confidence.

5. "riskLevel" (string, one of: "low", "medium", "high", "critical"): Overall risk assessment.

6. "estimatedClearanceTime" (string): Human-readable estimated time to clear the event (e.g., "2-3 hours").

7. "nearbyResources" (array of strings): Recommended nearby police stations or zones that should be alerted.

RESPOND ONLY WITH VALID JSON. No markdown, no explanation, no code blocks. Just the raw JSON object.`;
}

// ---------------------------------------------------------------------------
// Build the user prompt with context from retrieved events
// ---------------------------------------------------------------------------
function buildUserPrompt(
  newEvent: ProcessedEvent,
  similarEvents: SimilarEvent[]
): string {
  const eventContext = `NEW EVENT DETAILS:
- Type: ${newEvent.eventType}
- Cause: ${newEvent.eventCause}
- Priority: ${newEvent.priority}
- Location: ${newEvent.latitude}, ${newEvent.longitude}
- Address: ${newEvent.address || 'Not specified'}
- Road Closure Required: ${newEvent.requiresRoadClosure}
- Description: ${newEvent.description || 'None provided'}`;

  let historicalContext = '\nHISTORICAL SIMILAR EVENTS (sorted by relevance):\n';

  if (similarEvents.length === 0) {
    historicalContext += 'No similar events found in the database. Use general traffic management best practices.\n';
  } else {
    similarEvents.forEach((se, idx) => {
      historicalContext += `\n${idx + 1}. Event ${se.event.eventId}:
   - Cause: ${se.event.eventCause}
   - Priority: ${se.event.priority}
   - Distance: ${se.distance} km away
   - Similarity Score: ${se.similarityScore}
   - Resolution Time: ${se.event.timeToResolveHours} hours
   - Road Closure: ${se.event.requiresRoadClosure}
   - Address: ${se.event.address}
   - Police Station: ${se.event.policeStation}
   - Corridor: ${se.event.corridor}
   - Zone: ${se.event.zone}
   - Junction: ${se.event.junction}`;
    });
  }

  return `${eventContext}\n${historicalContext}\n\nAnalyze this data and provide your prediction as JSON.`;
}

// ---------------------------------------------------------------------------
// Parse the agent's JSON response with error recovery
// ---------------------------------------------------------------------------
function parseAgentResponse(content: string): PredictionResult {
  // Strip any markdown code block wrapping the LLM might add
  let cleaned = content.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    return {
      forecastedDelayHours: Number(parsed.forecastedDelayHours) || 2,
      recommendedManpower: Number(parsed.recommendedManpower) || 4,
      diversionStrategy: String(parsed.diversionStrategy || 'Deploy traffic personnel to manage flow at the affected junction. Set up barricades and divert traffic through alternative routes.'),
      confidenceScore: Math.min(1, Math.max(0, Number(parsed.confidenceScore) || 0.5)),
      similarEventsCount: 0, // Will be set by the caller
      riskLevel: (['low', 'medium', 'high', 'critical'].includes(String(parsed.riskLevel))
        ? String(parsed.riskLevel)
        : 'medium') as PredictionResult['riskLevel'],
      estimatedClearanceTime: String(parsed.estimatedClearanceTime || '2-4 hours'),
      nearbyResources: Array.isArray(parsed.nearbyResources)
        ? parsed.nearbyResources.map(String)
        : [],
    };
  } catch {
    // If JSON parsing fails, return defaults
    console.error('[Agent] Failed to parse response, using defaults');
    return {
      forecastedDelayHours: 2,
      recommendedManpower: 4,
      diversionStrategy: 'Deploy traffic personnel to manage flow. Set up barricades at the affected junction.',
      confidenceScore: 0.3,
      similarEventsCount: 0,
      riskLevel: 'medium',
      estimatedClearanceTime: '2-4 hours',
      nearbyResources: [],
    };
  }
}

// ---------------------------------------------------------------------------
// Main: Analyze event and generate prediction
// ---------------------------------------------------------------------------
export async function analyzeEvent(
  newEvent: ProcessedEvent,
  similarEvents: SimilarEvent[]
): Promise<PredictionResult> {
  const groq = getGroqClient();

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(newEvent, similarEvents);

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1024,
      top_p: 0.9,
    });

    const responseContent = chatCompletion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('Empty response from Groq');
    }

    const prediction = parseAgentResponse(responseContent);
    prediction.similarEventsCount = similarEvents.length;

    return prediction;
  } catch (error) {
    console.error('[Agent] Groq API error:', error);

    // Fallback: compute prediction from historical data directly
    return computeFallbackPrediction(newEvent, similarEvents);
  }
}

// ---------------------------------------------------------------------------
// Fallback prediction when Groq API is unavailable
// ---------------------------------------------------------------------------
function computeFallbackPrediction(
  newEvent: ProcessedEvent,
  similarEvents: SimilarEvent[]
): PredictionResult {
  // Calculate average resolution time from similar events
  const resolutionTimes = similarEvents
    .map((se) => se.event.timeToResolveHours)
    .filter((t) => t > 0);

  const avgResolution =
    resolutionTimes.length > 0
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      : 3;

  // Calculate manpower based on priority and road closure
  let manpower = 4;
  if (newEvent.priority === 'high') manpower += 4;
  if (newEvent.requiresRoadClosure) manpower += 4;

  // Determine risk level
  let riskLevel: PredictionResult['riskLevel'] = 'medium';
  if (newEvent.priority === 'high' && newEvent.requiresRoadClosure) riskLevel = 'critical';
  else if (newEvent.priority === 'high') riskLevel = 'high';
  else if (newEvent.requiresRoadClosure) riskLevel = 'medium';
  else riskLevel = 'low';

  // Get nearby police stations
  const nearbyStations = [
    ...new Set(
      similarEvents
        .map((se) => se.event.policeStation)
        .filter((ps) => ps && ps.length > 0)
    ),
  ].slice(0, 5);

  return {
    forecastedDelayHours: Math.round(avgResolution * 100) / 100,
    recommendedManpower: manpower,
    diversionStrategy: `Deploy ${manpower} personnel at the incident location. Set up barricades at nearby junctions. Coordinate with ${nearbyStations.join(', ') || 'nearest police station'} for additional support.`,
    confidenceScore: Math.min(0.8, similarEvents.length * 0.05),
    similarEventsCount: similarEvents.length,
    riskLevel,
    estimatedClearanceTime: `${Math.floor(avgResolution)}-${Math.ceil(avgResolution * 1.5)} hours`,
    nearbyResources: nearbyStations,
  };
}

export default { analyzeEvent };
