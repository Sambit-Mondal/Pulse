// ============================================================================
// Mongoose Event Model
// Schema with GeoJSON location field and 2dsphere + text indexes
// ============================================================================

import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { EventDocument, GeoJSONPoint, EventCause, EventType, Priority, EventStatus } from '../../types';

export interface IEventDocument extends Document {
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
  location: GeoJSONPoint;
  embedding: number[];
}

const GeoJSONPointSchema = new Schema<GeoJSONPoint>(
  {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  { _id: false }
);

const EventSchema = new Schema<IEventDocument>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true, enum: ['planned', 'unplanned'] },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, default: '' },
    eventCause: {
      type: String,
      required: true,
      enum: [
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
      ],
    },
    requiresRoadClosure: { type: Boolean, default: false },
    priority: { type: String, required: true, enum: ['high', 'low'] },
    corridor: { type: String, default: '' },
    policeStation: { type: String, default: '' },
    zone: { type: String, default: '' },
    junction: { type: String, default: '' },
    status: { type: String, required: true, enum: ['closed', 'resolved', 'active'] },
    description: { type: String, default: '' },
    vehicleType: { type: String, default: '' },
    startDatetime: { type: Date, required: true },
    timeToResolveHours: { type: Number, required: true, default: 0 },
    location: { type: GeoJSONPointSchema, required: true },
    embedding: { type: [Number], default: [] },
  },
  {
    timestamps: true,
    collection: 'events',
  }
);

// Geospatial index for $geoNear queries
EventSchema.index({ location: '2dsphere' });

// Text index for cause + priority search
EventSchema.index({ eventCause: 'text', corridor: 'text', policeStation: 'text' });

// Compound index for filtering
EventSchema.index({ eventType: 1, priority: 1, status: 1 });

// Prevent model recompilation in Next.js dev hot-reload
const EventModel: Model<IEventDocument> =
  mongoose.models.Event as Model<IEventDocument> || mongoose.model<IEventDocument>('Event', EventSchema);

export { EventSchema };
export type { EventDocument };
export default EventModel;
