'use client';

import React from 'react';
import type { ProcessedEvent } from '@/lib/types';

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

// ---------------------------------------------------------------------------
// Event Marker Component
// ---------------------------------------------------------------------------
interface EventMarkerProps {
  event: ProcessedEvent;
  isSelected: boolean;
}

export default function EventMarker({ event, isSelected }: EventMarkerProps) {
  const color = getEventColor(event.eventCause);
  const isActive = event.status === 'active';
  const size = event.priority === 'high' ? 14 : 10;

  return (
    <div
      className="relative cursor-pointer"
      style={{ width: size * 2, height: size * 2 }}
      title={`${event.eventCause.replace(/_/g, ' ')} — ${event.priority} priority`}
    >
      {/* Pulse ring for active events */}
      {isActive && (
        <div
          className="absolute inset-0 rounded-full opacity-60"
          style={{
            backgroundColor: color,
            animation: 'pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
          }}
        />
      )}

      {/* Selection ring */}
      {isSelected && (
        <div
          className="absolute rounded-full"
          style={{
            inset: -4,
            border: `2px solid ${color}`,
            animation: 'pulse-dot 1.5s ease-in-out infinite',
          }}
        />
      )}

      {/* Main dot */}
      <div
        className="absolute inset-0 rounded-full transition-transform duration-200 hover:scale-125"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 ${isSelected ? 12 : 6}px ${color}80`,
          border: `2px solid ${isSelected ? '#ffffff' : `${color}cc`}`,
        }}
      />

      {/* Road closure indicator (small X) */}
      {event.requiresRoadClosure && (
        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 rounded-full flex items-center justify-center border border-red-400">
          <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      )}
    </div>
  );
}
