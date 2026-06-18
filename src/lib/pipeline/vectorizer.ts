// ============================================================================
// Feature-Engineered Vectorizer
// Generates deterministic numerical embeddings from structured event data.
// No external API calls needed — pure computation.
// ============================================================================

import type { ProcessedEvent, EventCause, VectorizerConfig } from '../types';
import { EVENT_CAUSES } from '../types';

// ---------------------------------------------------------------------------
// Default config — Bengaluru bounding box
// ---------------------------------------------------------------------------
const DEFAULT_CONFIG: VectorizerConfig = {
  latMin: 12.7,
  latMax: 13.4,
  lngMin: 77.3,
  lngMax: 77.9,
  maxTimeToResolve: 720, // 30 days in hours (cap extreme outliers)
};

// ---------------------------------------------------------------------------
// Normalize a value to [0, 1] range
// ---------------------------------------------------------------------------
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

// ---------------------------------------------------------------------------
// One-hot encode event cause
// Returns array of length EVENT_CAUSES.length (10)
// ---------------------------------------------------------------------------
function oneHotEventCause(cause: EventCause): number[] {
  return EVENT_CAUSES.map((c) => (c === cause ? 1.0 : 0.0));
}

// ---------------------------------------------------------------------------
// Encode priority as numeric
// ---------------------------------------------------------------------------
function encodePriority(priority: string): number {
  return priority === 'high' ? 1.0 : 0.0;
}

// ---------------------------------------------------------------------------
// Encode road closure as numeric
// ---------------------------------------------------------------------------
function encodeRoadClosure(requiresClosure: boolean): number {
  return requiresClosure ? 1.0 : 0.0;
}

// ---------------------------------------------------------------------------
// Generate embedding vector for a single event
// Vector structure: [lat_norm, lng_norm, ...cause_onehot(10), priority, road_closure, time_to_resolve_norm]
// Total dimensions: 2 + 10 + 1 + 1 + 1 = 15
// ---------------------------------------------------------------------------
export function generateEmbedding(
  event: ProcessedEvent,
  config: VectorizerConfig = DEFAULT_CONFIG
): number[] {
  const latNorm = normalize(event.latitude, config.latMin, config.latMax);
  const lngNorm = normalize(event.longitude, config.lngMin, config.lngMax);
  const causeOneHot = oneHotEventCause(event.eventCause);
  const priorityEncoded = encodePriority(event.priority);
  const roadClosureEncoded = encodeRoadClosure(event.requiresRoadClosure);
  const timeNorm = normalize(
    Math.min(event.timeToResolveHours, config.maxTimeToResolve),
    0,
    config.maxTimeToResolve
  );

  return [
    latNorm,
    lngNorm,
    ...causeOneHot,
    priorityEncoded,
    roadClosureEncoded,
    timeNorm,
  ];
}

// ---------------------------------------------------------------------------
// Batch vectorize an array of events
// ---------------------------------------------------------------------------
export function batchVectorize(
  events: ProcessedEvent[],
  config: VectorizerConfig = DEFAULT_CONFIG
): number[][] {
  console.log(`[Vectorizer] Generating embeddings for ${events.length} events...`);
  const embeddings = events.map((event) => generateEmbedding(event, config));
  console.log(`[Vectorizer] Generated ${embeddings.length} embeddings (${embeddings[0]?.length ?? 0} dimensions each)`);
  return embeddings;
}

// ---------------------------------------------------------------------------
// Cosine similarity between two vectors
// ---------------------------------------------------------------------------
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

export default { generateEmbedding, batchVectorize, cosineSimilarity };
