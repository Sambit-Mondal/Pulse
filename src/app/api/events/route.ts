// ============================================================================
// GET /api/events — Fetch historical event pins with filtering & pagination
// ============================================================================

import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import EventModel from '@/lib/db/models/event';
import type { EventsResponse, EventsQueryParams } from '@/lib/types';

export async function GET(request: NextRequest): Promise<NextResponse<EventsResponse>> {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const params: EventsQueryParams = {
      limit: Math.min(Number(searchParams.get('limit')) || 500, 5000),
      offset: Number(searchParams.get('offset')) || 0,
      eventType: (searchParams.get('eventType') as EventsQueryParams['eventType']) || undefined,
      eventCause: (searchParams.get('eventCause') as EventsQueryParams['eventCause']) || undefined,
      priority: (searchParams.get('priority') as EventsQueryParams['priority']) || undefined,
      status: (searchParams.get('status') as EventsQueryParams['status']) || undefined,
    };

    // Build filter
    const filter: Record<string, string> = {};
    if (params.eventType) filter.eventType = params.eventType;
    if (params.eventCause) filter.eventCause = params.eventCause;
    if (params.priority) filter.priority = params.priority;
    if (params.status) filter.status = params.status;

    // Execute query
    const [events, total] = await Promise.all([
      EventModel.find(filter)
        .select({
          embedding: 0,       // Exclude large embedding array from response
          __v: 0,
          createdAt: 0,
          updatedAt: 0,
        })
        .sort({ startDatetime: -1 })
        .skip(params.offset ?? 0)
        .limit(params.limit ?? 500)
        .lean(),
      EventModel.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: events,
      total,
      limit: params.limit ?? 500,
      offset: params.offset ?? 0,
    });
  } catch (error: unknown) {
    console.error('[API /events] Error:', error);

    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      {
        success: false,
        data: [],
        total: 0,
        limit: 0,
        offset: 0,
      },
      { status: 500, statusText: message }
    );
  }
}
