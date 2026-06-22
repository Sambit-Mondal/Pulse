'use client';

import React, { useCallback, useRef, useEffect, useState } from 'react';
import Map, { Marker, Popup, NavigationControl, Source, Layer, type MapRef, type ViewStateChangeEvent } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { ProcessedEvent } from '@/lib/types';
import EventMarker from './EventMarker';

// ---------------------------------------------------------------------------
// Bengaluru center coordinates
// ---------------------------------------------------------------------------
const BENGALURU_CENTER = {
  latitude: 12.9716,
  longitude: 77.5946,
  zoom: 12,
};

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// ---------------------------------------------------------------------------
// Map View Component
// ---------------------------------------------------------------------------
interface MapViewProps {
  events: ProcessedEvent[];
  onEventSelect: (event: ProcessedEvent) => void;
  onMapClick: (lat: number, lng: number) => void;
  selectedEvent: ProcessedEvent | null;
  activePrediction?: any;
}

export default function MapView({ events, onEventSelect, onMapClick, selectedEvent, activePrediction }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const [popupEvent, setPopupEvent] = useState<ProcessedEvent | null>(null);
  const [viewState, setViewState] = useState(BENGALURU_CENTER);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Limit visible markers based on zoom level for performance
  const visibleEvents = React.useMemo(() => {
    if (viewState.zoom < 10) return events.slice(0, 200);
    if (viewState.zoom < 12) return events.slice(0, 500);
    return events.slice(0, 2000);
  }, [events, viewState.zoom]);

  const handleMapClick = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      onMapClick(e.lngLat.lat, e.lngLat.lng);
    },
    [onMapClick]
  );

  const handleMarkerClick = useCallback(
    (event: ProcessedEvent) => {
      setPopupEvent(event);
      onEventSelect(event);
    },
    [onEventSelect]
  );

  // Fly to selected event
  useEffect(() => {
    if (selectedEvent && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedEvent.longitude, selectedEvent.latitude],
        zoom: 15,
        duration: 1000,
      });
    }
  }, [selectedEvent]);

  // Fly to predicted route or event location
  useEffect(() => {
    if (activePrediction && mapRef.current) {
      if (activePrediction.diversionRouteGeoJSON) {
        const coords = activePrediction.diversionRouteGeoJSON.coordinates;
        if (coords && coords.length > 0) {
          let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
          coords.forEach(([lng, lat]: [number, number]) => {
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
          });
          
          const centerLng = (minLng + maxLng) / 2;
          const centerLat = (minLat + maxLat) / 2;

          mapRef.current.flyTo({
            center: [centerLng, centerLat],
            zoom: 14.5,
            duration: 1500,
          });
          return;
        }
      }
      
      if (activePrediction.eventLocation) {
        mapRef.current.flyTo({
          center: [activePrediction.eventLocation.longitude, activePrediction.eventLocation.latitude],
          zoom: 15,
          duration: 1500,
        });
      }
    }
  }, [activePrediction]);

  const handleViewStateChange = useCallback((e: ViewStateChangeEvent) => {
    setViewState(e.viewState);
  }, []);

  return (
    <div id="map-container" className="relative w-full h-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={handleViewStateChange}
        onClick={handleMapClick}
        onLoad={() => setMapLoaded(true)}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        reuseMaps
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {/* Event markers */}
        {mapLoaded &&
          visibleEvents.map((event) => (
            <Marker
              key={event.eventId}
              latitude={event.latitude}
              longitude={event.longitude}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(event);
              }}
            >
              <EventMarker
                event={event}
                isSelected={selectedEvent?.eventId === event.eventId}
              />
            </Marker>
          ))}

        {/* Popup for selected event */}
        {popupEvent && (
          <Popup
            latitude={popupEvent.latitude}
            longitude={popupEvent.longitude}
            offset={15}
            closeOnClick={false}
            onClose={() => setPopupEvent(null)}
            className="event-popup"
          >
            <div className="min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: getEventColor(popupEvent.eventCause) }}
                />
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
                  {popupEvent.eventCause.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug mb-2 line-clamp-2">
                {popupEvent.address || 'Location on map'}
              </p>
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${popupEvent.priority === 'high'
                      ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    }`}
                >
                  {popupEvent.priority.toUpperCase()}
                </span>
                <span className="text-[10px] text-slate-500">
                  {popupEvent.timeToResolveHours > 0
                    ? `${popupEvent.timeToResolveHours.toFixed(1)}h`
                    : 'Active'}
                </span>
              </div>
            </div>
          </Popup>
        )}

        {/* Visual Diversion Route */}
        {activePrediction?.diversionRouteGeoJSON && (
          <Source type="geojson" data={activePrediction.diversionRouteGeoJSON}>
            {/* Outer glow layer */}
            <Layer
              id="diversion-route-glow"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                'line-color': '#06b6d4', // cyan-500
                'line-width': 14,
                'line-opacity': 0.4,
                'line-blur': 6
              }}
            />
            {/* Solid cyan body */}
            <Layer
              id="diversion-route"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                'line-color': '#22d3ee', // cyan-400
                'line-width': 6,
                'line-opacity': 1,
              }}
            />
            {/* Inner glowing core */}
            <Layer
              id="diversion-route-inner"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                'line-color': '#ffffff',
                'line-width': 2,
                'line-opacity': 1,
              }}
            />
          </Source>
        )}
      </Map>

      {/* Map overlay: Event count badge */}
      <div className="absolute top-3 left-3 glass-card px-3 py-2 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-xs text-slate-300 font-medium">
          {visibleEvents.length.toLocaleString()} events visible
        </span>
      </div>

      {/* Map overlay: Bengaluru label */}
      <div className="absolute bottom-8 left-3 text-[10px] text-slate-600 font-medium uppercase tracking-widest">
        Bengaluru Metropolitan Area
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Event color mapping
// ---------------------------------------------------------------------------
function getEventColor(cause: string): string {
  const colors: Record<string, string> = {
    accident: '#ef4444',
    vehicle_breakdown: '#f97316',
    tree_fall: '#22c55e',
    water_logging: '#3b82f6',
    pot_holes: '#a855f7',
    congestion: '#eab308',
    construction: '#6b7280',
    public_event: '#ec4899',
    road_conditions: '#14b8a6',
    others: '#8b5cf6',
  };
  return colors[cause] || '#8b5cf6';
}
