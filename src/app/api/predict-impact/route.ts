// ============================================================================
// POST /api/predict-impact — Core RAG engine endpoint
// Accepts event details, retrieves similar events, generates prediction
// ============================================================================

import { NextResponse } from 'next/server';
import { findSimilarEvents } from '@/lib/rag/retriever';
import { analyzeEvent } from '@/lib/rag/agent';
import type { PredictImpactRequest, PredictImpactResponse, ProcessedEvent } from '@/lib/types';

// ---------------------------------------------------------------------------
// Validate the incoming request body
// ---------------------------------------------------------------------------
function validateRequest(body: unknown): { valid: boolean; error?: string; data?: PredictImpactRequest } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is required' };
  }

  const b = body as Record<string, unknown>;

  // Required fields
  if (typeof b.latitude !== 'number' || b.latitude < -90 || b.latitude > 90) {
    return { valid: false, error: 'Valid latitude (-90 to 90) is required' };
  }
  if (typeof b.longitude !== 'number' || b.longitude < -180 || b.longitude > 180) {
    return { valid: false, error: 'Valid longitude (-180 to 180) is required' };
  }

  const validCauses = [
    'vehicle_breakdown', 'accident', 'tree_fall', 'water_logging',
    'pot_holes', 'congestion', 'construction', 'public_event',
    'road_conditions', 'others',
  ];
  if (!validCauses.includes(String(b.eventCause))) {
    return { valid: false, error: `eventCause must be one of: ${validCauses.join(', ')}` };
  }

  const validTypes = ['planned', 'unplanned'];
  if (!validTypes.includes(String(b.eventType))) {
    return { valid: false, error: `eventType must be one of: ${validTypes.join(', ')}` };
  }

  const validPriorities = ['high', 'low'];
  if (!validPriorities.includes(String(b.priority))) {
    return { valid: false, error: `priority must be one of: ${validPriorities.join(', ')}` };
  }

  return {
    valid: true,
    data: {
      latitude: Number(b.latitude),
      longitude: Number(b.longitude),
      eventType: String(b.eventType) as PredictImpactRequest['eventType'],
      eventCause: String(b.eventCause) as PredictImpactRequest['eventCause'],
      priority: String(b.priority) as PredictImpactRequest['priority'],
      requiresRoadClosure: Boolean(b.requiresRoadClosure),
      description: typeof b.description === 'string' ? b.description : undefined,
    },
  };
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------
export async function POST(request: Request): Promise<NextResponse<PredictImpactResponse>> {
  try {
    const body: unknown = await request.json();

    // Validate
    const validation = validateRequest(body);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        { success: false, prediction: null, error: validation.error },
        { status: 400 }
      );
    }

    const reqData = validation.data;

    // Build a ProcessedEvent from the request for the retriever
    const newEvent: ProcessedEvent = {
      eventId: `NEW-${Date.now()}`,
      eventType: reqData.eventType,
      latitude: reqData.latitude,
      longitude: reqData.longitude,
      address: '',
      eventCause: reqData.eventCause,
      requiresRoadClosure: reqData.requiresRoadClosure,
      priority: reqData.priority,
      corridor: '',
      policeStation: '',
      zone: '',
      junction: '',
      status: 'active',
      description: reqData.description ?? '',
      vehicleType: '',
      startDatetime: new Date(),
      timeToResolveHours: 0,
    };

    // Step 1: Retrieve similar events within 2km radius
    console.log('[Predict] Searching for similar events...');
    const similarEvents = await findSimilarEvents(newEvent, 2, 15);
    console.log(`[Predict] Found ${similarEvents.length} similar events`);

    // Step 2: Analyze with Groq agent
    console.log('[Predict] Running agent analysis...');
    const prediction = await analyzeEvent(newEvent, similarEvents);
    console.log('[Predict] Analysis complete');

    // Step 3: Visual Diversion Routing via OSRM
    try {
      console.log('[Predict] Calculating visual diversion route...');
      // Create a 500m offset roughly for start and end points of a detour
      const offset = 0.0045; // roughly 500m in degrees
      const startLng = reqData.longitude - offset;
      const startLat = reqData.latitude + offset;
      const endLng = reqData.longitude + offset;
      const endLat = reqData.latitude - offset;

      // OSRM routing API
      const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
      const osrmRes = await fetch(osrmUrl);
      if (osrmRes.ok) {
        const osrmData = await osrmRes.json();
        if (osrmData.routes && osrmData.routes.length > 0) {
          prediction.diversionRouteGeoJSON = osrmData.routes[0].geometry;
        }
      }
    } catch (err) {
      console.error('[Predict] Failed to calculate visual route:', err);
    }

    return NextResponse.json({
      success: true,
      prediction: {
        ...prediction,
        eventLocation: {
          latitude: reqData.latitude,
          longitude: reqData.longitude,
        }
      },
    });
  } catch (error: unknown) {
    console.error('[API /predict-impact] Error:', error);

    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, prediction: null, error: message },
      { status: 500 }
    );
  }
}
