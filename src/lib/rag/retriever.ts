// ============================================================================
// RAG Retriever
// Finds historically similar events using geospatial + embedding similarity
// ============================================================================

import { connectToDatabase } from '../db/connection';
import EventModel from '../db/models/event';
import { generateEmbedding, cosineSimilarity } from '../pipeline/vectorizer';
import type { ProcessedEvent, SimilarEvent, EventDocument } from '../types';

// ---------------------------------------------------------------------------
// Haversine distance between two coordinates (km)
// ---------------------------------------------------------------------------
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ---------------------------------------------------------------------------
// Retrieve similar events within radius using $geoNear + embedding similarity
// ---------------------------------------------------------------------------
export async function findSimilarEvents(
  newEvent: ProcessedEvent,
  radiusKm: number = 2,
  topK: number = 15
): Promise<SimilarEvent[]> {
  await connectToDatabase();

  // Generate embedding for the incoming event
  const queryEmbedding = generateEmbedding(newEvent);

  // If Vector Search is enabled in Atlas, use native $vectorSearch
  if (process.env.USE_VECTOR_SEARCH === 'true') {
    try {
      const vectorResults = await EventModel.aggregate([
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: 100,
            limit: topK,
          },
        },
        {
          $addFields: {
            similarityScore: { $meta: 'vectorSearchScore' },
          },
        },
      ]);

      if (vectorResults.length > 0) {
        return vectorResults.map((event) => {
          const distance = haversineDistance(
            newEvent.latitude,
            newEvent.longitude,
            event.latitude,
            event.longitude
          );
          return {
            event: event as EventDocument,
            distance: Math.round(distance * 100) / 100,
            similarityScore: Math.round(event.similarityScore * 1000) / 1000,
          };
        });
      }
    } catch (error) {
      console.warn('[Retriever] Native $vectorSearch failed, falling back to $geoNear. Did you create the index in Atlas?', error);
    }
  }

  // Stage 1: Geospatial query — find all events within the radius
  const radiusMeters = radiusKm * 1000;

  const geoResults = await EventModel.aggregate<EventDocument>([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [newEvent.longitude, newEvent.latitude],
        },
        distanceField: 'distanceMeters',
        maxDistance: radiusMeters,
        spherical: true,
      },
    },
    {
      $limit: 200, // Cap to prevent memory issues
    },
  ]);

  if (geoResults.length === 0) {
    // Fallback: find events with same cause across the city
    const fallbackResults = await EventModel.find({
      eventCause: newEvent.eventCause,
    })
      .limit(50)
      .lean<EventDocument[]>();

    return rankBySimilarity(fallbackResults, queryEmbedding, newEvent);
  }

  return rankBySimilarity(geoResults, queryEmbedding, newEvent, topK);
}

// ---------------------------------------------------------------------------
// Rank events by cosine similarity of their embeddings
// ---------------------------------------------------------------------------
function rankBySimilarity(
  events: EventDocument[],
  queryEmbedding: number[],
  queryEvent: ProcessedEvent,
  topK: number = 15
): SimilarEvent[] {
  const scored: SimilarEvent[] = events
    .filter((event) => event.embedding && event.embedding.length > 0)
    .map((event) => {
      const similarity = cosineSimilarity(queryEmbedding, event.embedding);
      const distance = haversineDistance(
        queryEvent.latitude,
        queryEvent.longitude,
        event.latitude,
        event.longitude
      );

      return {
        event,
        distance: Math.round(distance * 100) / 100,
        similarityScore: Math.round(similarity * 1000) / 1000,
      };
    });

  // Sort by similarity (descending), then by distance (ascending)
  scored.sort((a, b) => {
    const simDiff = b.similarityScore - a.similarityScore;
    if (Math.abs(simDiff) > 0.01) return simDiff;
    return a.distance - b.distance;
  });

  return scored.slice(0, topK);
}

export default { findSimilarEvents };
