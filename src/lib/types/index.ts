// ============================================================================
// Pulse — TypeScript Interfaces & Type Definitions
// All types for event data, API contracts, and internal models
// ============================================================================

// ---------------------------------------------------------------------------
// Raw CSV Row (as parsed from dataset.csv)
// ---------------------------------------------------------------------------
export interface RawEventRow {
  id: string;
  event_type: string;
  latitude: string;
  longitude: string;
  endlatitude: string;
  endlongitude: string;
  address: string;
  end_address: string;
  event_cause: string;
  requires_road_closure: string;
  start_datetime: string;
  end_datetime: string;
  status: string;
  authenticated: string;
  modified_datetime: string;
  map_file: string;
  direction: string;
  description: string;
  veh_type: string;
  veh_no: string;
  corridor: string;
  priority: string;
  cargo_material: string;
  reason_breakdown: string;
  age_of_truck: string;
  created_date: string;
  route_path: string;
  client_id: string;
  created_by_id: string;
  last_modified_by_id: string;
  assigned_to_police_id: string;
  citizen_accident_id: string;
  comment: string;
  police_station: string;
  meta_data: string;
  kgid: string;
  resolved_at_address: string;
  resolved_at_latitude: string;
  resolved_at_longitude: string;
  closed_by_id: string;
  closed_datetime: string;
  resolved_by_id: string;
  resolved_datetime: string;
  gba_identifier: string;
  zone: string;
  junction: string;
}

// ---------------------------------------------------------------------------
// Processed Event (after cleansing & imputation)
// ---------------------------------------------------------------------------
export interface ProcessedEvent {
  eventId: string;
  eventType: EventType;
  latitude: number;
  longitude: number;
  address: string;
  eventCause: EventCause;
  requiresRoadClosure: boolean;
  priority: Priority;
  corridor: string;
  policeStation: string;
  zone: string;
  junction: string;
  status: EventStatus;
  description: string;
  vehicleType: string;
  startDatetime: Date;
  timeToResolveHours: number;
}

// ---------------------------------------------------------------------------
// MongoDB Document Shape (extends ProcessedEvent with embedding + GeoJSON)
// ---------------------------------------------------------------------------
export interface EventDocument extends ProcessedEvent {
  location: GeoJSONPoint;
  embedding: number[];
}

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

// ---------------------------------------------------------------------------
// Enum-like Constants
// ---------------------------------------------------------------------------
export type EventType = 'planned' | 'unplanned';

export type EventCause =
  | 'vehicle_breakdown'
  | 'accident'
  | 'tree_fall'
  | 'water_logging'
  | 'pot_holes'
  | 'congestion'
  | 'construction'
  | 'public_event'
  | 'road_conditions'
  | 'others';

export type Priority = 'high' | 'low';

export type EventStatus = 'closed' | 'resolved' | 'active';

export const EVENT_CAUSES: EventCause[] = [
  'vehicle_breakdown',
  'accident',
  'tree_fall',
  'water_logging',
  'pot_holes',
  'congestion',
  'construction',
  'public_event',
  'road_conditions',
  'others',
];

// ---------------------------------------------------------------------------
// API Request / Response Contracts
// ---------------------------------------------------------------------------
export interface PredictImpactRequest {
  latitude: number;
  longitude: number;
  eventType: EventType;
  eventCause: EventCause;
  priority: Priority;
  requiresRoadClosure: boolean;
  description?: string;
}

export interface PredictImpactResponse {
  success: boolean;
  prediction: PredictionResult | null;
  error?: string;
}

export interface PredictionResult {
  forecastedDelayHours: number;
  recommendedManpower: number;
  diversionStrategy: string;
  confidenceScore: number;
  similarEventsCount: number;
  riskLevel: RiskLevel;
  estimatedClearanceTime: string;
  nearbyResources: string[];
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// ---------------------------------------------------------------------------
// Events API Query Parameters
// ---------------------------------------------------------------------------
export interface EventsQueryParams {
  limit?: number;
  offset?: number;
  eventType?: EventType;
  eventCause?: EventCause;
  priority?: Priority;
  status?: EventStatus;
}

// ---------------------------------------------------------------------------
// Events API Response
// ---------------------------------------------------------------------------
export interface EventsResponse {
  success: boolean;
  data: ProcessedEvent[];
  total: number;
  limit: number;
  offset: number;
}

// ---------------------------------------------------------------------------
// Retriever Result (internal)
// ---------------------------------------------------------------------------
export interface SimilarEvent {
  event: EventDocument;
  distance: number; // distance in km
  similarityScore: number;
}

// ---------------------------------------------------------------------------
// Vectorizer Config
// ---------------------------------------------------------------------------
export interface VectorizerConfig {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
  maxTimeToResolve: number;
}

// ---------------------------------------------------------------------------
// Stats for Dashboard
// ---------------------------------------------------------------------------
export interface DashboardStats {
  totalEvents: number;
  activeEvents: number;
  avgResolutionHours: number;
  topCause: string;
  highPriorityCount: number;
  roadClosureCount: number;
}
