// ============================================================================
// CSV Preprocessing Pipeline
// Loads dataset.csv, cleanses, imputes, and returns typed ProcessedEvent[]
// ============================================================================

import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import type { RawEventRow, ProcessedEvent, EventCause, EventType, Priority, EventStatus } from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const VALID_EVENT_CAUSES: Set<string> = new Set([
  'vehicle_breakdown', 'accident', 'tree_fall', 'water_logging',
  'pot_holes', 'congestion', 'construction', 'public_event',
  'road_conditions', 'others',
]);

const VALID_PRIORITIES: Set<string> = new Set(['high', 'low']);
const VALID_STATUSES: Set<string> = new Set(['closed', 'resolved', 'active']);
const VALID_EVENT_TYPES: Set<string> = new Set(['planned', 'unplanned']);

// ---------------------------------------------------------------------------
// Helper: Parse a datetime string, returning null if invalid
// ---------------------------------------------------------------------------
function parseDateTime(value: string | undefined | null): Date | null {
  if (!value || value === 'NULL' || value === 'null' || value.trim() === '') {
    return null;
  }
  const date = new Date(value.trim());
  return isNaN(date.getTime()) ? null : date;
}

// ---------------------------------------------------------------------------
// Helper: Calculate time to resolve (hours)
// Fallback chain: closed_datetime → resolved_datetime → modified_datetime
// ---------------------------------------------------------------------------
function calculateTimeToResolve(row: RawEventRow): number {
  const startDate = parseDateTime(row.start_datetime);
  if (!startDate) return 0;

  const closedDate = parseDateTime(row.closed_datetime);
  const resolvedDate = parseDateTime(row.resolved_datetime);
  const modifiedDate = parseDateTime(row.modified_datetime);

  const endDate = closedDate ?? resolvedDate ?? modifiedDate;
  if (!endDate) return 0;

  const deltaMs = endDate.getTime() - startDate.getTime();
  if (deltaMs < 0) return 0;

  // Convert milliseconds to hours, rounded to 2 decimal places
  return Math.round((deltaMs / (1000 * 60 * 60)) * 100) / 100;
}

// ---------------------------------------------------------------------------
// Helper: Validate latitude/longitude
// ---------------------------------------------------------------------------
function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat !== 0 &&
    lng !== 0 &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

// ---------------------------------------------------------------------------
// Helper: Normalize string fields
// ---------------------------------------------------------------------------
function normalizeString(value: string | undefined | null): string {
  if (!value || value === 'NULL' || value === 'null') return '';
  return value.trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// Helper: Parse requires_road_closure, defaulting NaN/NULL to false
// ---------------------------------------------------------------------------
function parseRoadClosure(value: string | undefined | null): boolean {
  if (!value || value === 'NULL' || value === 'null' || value.trim() === '') {
    return false;
  }
  return value.trim().toUpperCase() === 'TRUE';
}

// ---------------------------------------------------------------------------
// Main: Load and preprocess the dataset
// ---------------------------------------------------------------------------
export function preprocessDataset(csvPath?: string): ProcessedEvent[] {
  const resolvedPath = csvPath ?? path.resolve(process.cwd(), 'dataset', 'dataset.csv');

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`[Preprocessor] Dataset not found at: ${resolvedPath}`);
  }

  console.log(`[Preprocessor] Loading dataset from: ${resolvedPath}`);
  const rawCsv = fs.readFileSync(resolvedPath, 'utf-8');

  const rows: RawEventRow[] = parse(rawCsv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  console.log(`[Preprocessor] Parsed ${rows.length} raw rows`);

  const processed: ProcessedEvent[] = [];
  let skippedCoords = 0;
  let skippedCause = 0;

  for (const row of rows) {
    // Parse coordinates
    const lat = parseFloat(row.latitude);
    const lng = parseFloat(row.longitude);

    // Filter out rows missing valid lat/lng
    if (!isValidCoordinate(lat, lng)) {
      skippedCoords++;
      continue;
    }

    // Normalize string fields
    const eventCause = normalizeString(row.event_cause) as EventCause;
    const eventType = normalizeString(row.event_type) as EventType;
    const priority = normalizeString(row.priority) as Priority;
    const status = normalizeString(row.status) as EventStatus;

    // Validate event cause
    if (!VALID_EVENT_CAUSES.has(eventCause)) {
      skippedCause++;
      continue;
    }

    // Default invalid types/priorities/statuses
    const finalEventType: EventType = VALID_EVENT_TYPES.has(eventType) ? eventType : 'unplanned';
    const finalPriority: Priority = VALID_PRIORITIES.has(priority) ? priority : 'low';
    const finalStatus: EventStatus = VALID_STATUSES.has(status) ? status : 'active';

    // Calculate time to resolve
    const timeToResolveHours = calculateTimeToResolve(row);

    // Parse start datetime
    const startDatetime = parseDateTime(row.start_datetime);
    if (!startDatetime) continue;

    // Build processed event
    const event: ProcessedEvent = {
      eventId: row.id?.trim() || `EVT-${processed.length}`,
      eventType: finalEventType,
      latitude: lat,
      longitude: lng,
      address: row.address?.trim() || '',
      eventCause,
      requiresRoadClosure: parseRoadClosure(row.requires_road_closure),
      priority: finalPriority,
      corridor: row.corridor?.trim() || '',
      policeStation: row.police_station?.trim() || '',
      zone: row.zone?.trim() || '',
      junction: row.junction?.trim() || '',
      status: finalStatus,
      description: row.description?.trim() || '',
      vehicleType: row.veh_type?.trim() || '',
      startDatetime,
      timeToResolveHours,
    };

    processed.push(event);
  }

  console.log(`[Preprocessor] Processing complete:`);
  console.log(`  ✓ Valid events: ${processed.length}`);
  console.log(`  ✗ Skipped (invalid coords): ${skippedCoords}`);
  console.log(`  ✗ Skipped (invalid cause): ${skippedCause}`);

  return processed;
}

export default preprocessDataset;
