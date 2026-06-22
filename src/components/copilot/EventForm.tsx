'use client';

import React, { useState } from 'react';
import type { EventCause, EventType, Priority, PredictImpactRequest } from '@/lib/types';

// ---------------------------------------------------------------------------
// Event Form Component
// ---------------------------------------------------------------------------
interface EventFormProps {
  onSubmit: (data: PredictImpactRequest) => void;
  isLoading: boolean;
  clickedCoords: { lat: number; lng: number } | null;
}

const EVENT_CAUSE_OPTIONS: { value: EventCause; label: string }[] = [
  { value: 'vehicle_breakdown', label: 'Vehicle Breakdown' },
  { value: 'accident', label: 'Accident' },
  { value: 'tree_fall', label: 'Tree Fall' },
  { value: 'water_logging', label: 'Water Logging' },
  { value: 'pot_holes', label: 'Pot Holes' },
  { value: 'congestion', label: 'Congestion' },
  { value: 'construction', label: 'Construction' },
  { value: 'public_event', label: 'Public Event' },
  { value: 'road_conditions', label: 'Road Conditions' },
  { value: 'others', label: 'Others' },
];

export default function EventForm({ onSubmit, isLoading, clickedCoords }: EventFormProps) {
  const [latitude, setLatitude] = useState<string>(clickedCoords?.lat?.toFixed(6) || '12.9716');
  const [longitude, setLongitude] = useState<string>(clickedCoords?.lng?.toFixed(6) || '77.5946');
  const [eventType, setEventType] = useState<EventType>('unplanned');
  const [eventCause, setEventCause] = useState<EventCause>('vehicle_breakdown');
  const [priority, setPriority] = useState<Priority>('high');
  const [requiresRoadClosure, setRequiresRoadClosure] = useState(false);
  const [description, setDescription] = useState('');

  const [chatInput, setChatInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState('');

  // Update coords when map is clicked
  React.useEffect(() => {
    if (clickedCoords) {
      setLatitude(clickedCoords.lat.toFixed(6));
      setLongitude(clickedCoords.lng.toFixed(6));
    }
  }, [clickedCoords]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      eventType,
      eventCause,
      priority,
      requiresRoadClosure,
      description: description || undefined,
    });
  };

  const handleExtract = async () => {
    if (!chatInput.trim()) return;
    setIsExtracting(true);
    setExtractionError('');
    try {
      const res = await fetch('/api/extract-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatInput }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      if (data.data.eventCause) setEventCause(data.data.eventCause);
      if (data.data.priority) setPriority(data.data.priority);
      if (typeof data.data.requiresRoadClosure === 'boolean') {
        setRequiresRoadClosure(data.data.requiresRoadClosure);
      }
      
      if (data.data.latitude && data.data.longitude) {
        setLatitude(data.data.latitude.toFixed(6));
        setLongitude(data.data.longitude.toFixed(6));
      } else if (data.data.locationQuery) {
        setExtractionError(`Could not find coordinates for "${data.data.locationQuery}". Please click the map.`);
      } else {
        setExtractionError('Could not extract a location. Please click the map.');
      }
      
      setChatInput('');
    } catch (err: any) {
      setExtractionError(err.message || 'Failed to extract data.');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <form id="event-form" onSubmit={handleSubmit} className="space-y-6">
      {/* AI Extraction Input */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/5 border border-cyan-500/20">
        <label className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          Conversational Input
        </label>
        <div className="flex gap-2">
          <input
            suppressHydrationWarning
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleExtract();
              }
            }}
            placeholder="e.g. Severe water logging near Silk Board..."
            className="flex-1 px-3 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
          <button
            suppressHydrationWarning
            type="button"
            onClick={handleExtract}
            disabled={isExtracting || !chatInput.trim()}
            className="px-4 py-2.5 rounded-lg bg-cyan-500/20 text-cyan-300 font-medium text-sm hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isExtracting ? '...' : 'Extract'}
          </button>
        </div>
        {extractionError && (
          <p className="mt-3 text-xs text-amber-400 flex items-center gap-1.5 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {extractionError}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-slate-700/50"></div>
        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Or Manual Entry</span>
        <div className="flex-1 h-px bg-slate-700/50"></div>
      </div>

      {/* Coordinate picker notice */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
        <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
        <span className="text-[11px] text-cyan-300">Click on the map to set coordinates</span>
      </div>

      {/* Coordinates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="latitude" className="block text-[11px] uppercase tracking-wider text-slate-500 mb-2">
            Latitude
          </label>
          <input
            suppressHydrationWarning
            id="latitude"
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-slate-200 font-mono focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors"
            required
          />
        </div>
        <div>
          <label htmlFor="longitude" className="block text-[11px] uppercase tracking-wider text-slate-500 mb-2">
            Longitude
          </label>
          <input
            suppressHydrationWarning
            id="longitude"
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-slate-200 font-mono focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors"
            required
          />
        </div>
      </div>

      {/* Event Type Toggle */}
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-slate-500 mb-2">
          Event Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['unplanned', 'planned'] as EventType[]).map((type) => (
            <button
              suppressHydrationWarning
              key={type}
              type="button"
              onClick={() => setEventType(type)}
              className={`px-4 py-3 rounded-lg text-xs font-medium uppercase tracking-wider transition-all ${eventType === type
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-800/30 text-slate-500 border border-slate-700/30 hover:text-slate-300 hover:border-slate-600/50'
                }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Event Cause */}
      <div>
        <label htmlFor="eventCause" className="block text-[11px] uppercase tracking-wider text-slate-500 mb-2">
          Event Cause
        </label>
        <select
          suppressHydrationWarning
          id="eventCause"
          value={eventCause}
          onChange={(e) => setEventCause(e.target.value as EventCause)}
          className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors appearance-none cursor-pointer"
        >
          {EVENT_CAUSE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-800">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Priority Toggle */}
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-slate-500 mb-2">
          Priority
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            suppressHydrationWarning
            type="button"
            onClick={() => setPriority('high')}
            className={`px-4 py-3 rounded-lg text-xs font-medium uppercase tracking-wider transition-all ${priority === 'high'
              ? 'bg-red-500/15 text-red-400 border border-red-500/30'
              : 'bg-slate-800/30 text-slate-500 border border-slate-700/30 hover:text-slate-300 hover:border-slate-600/50'
              }`}
          >
            ● High
          </button>
          <button
            suppressHydrationWarning
            type="button"
            onClick={() => setPriority('low')}
            className={`px-4 py-3 rounded-lg text-xs font-medium uppercase tracking-wider transition-all ${priority === 'low'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-800/30 text-slate-500 border border-slate-700/30 hover:text-slate-300 hover:border-slate-600/50'
              }`}
          >
            ● Low
          </button>
        </div>
      </div>

      {/* Road Closure Toggle */}
      <div className="flex items-center justify-between px-4 py-3.5 rounded-lg bg-slate-800/30 border border-slate-700/30">
        <label htmlFor="roadClosure" className="text-xs text-slate-400 cursor-pointer">
          Requires Road Closure
        </label>
        <button
          suppressHydrationWarning
          id="roadClosure"
          type="button"
          role="switch"
          aria-checked={requiresRoadClosure}
          onClick={() => setRequiresRoadClosure(!requiresRoadClosure)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${requiresRoadClosure ? 'bg-red-500' : 'bg-slate-600'
            }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${requiresRoadClosure ? 'translate-x-4' : 'translate-x-0.5'
              }`}
          />
        </button>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-[11px] uppercase tracking-wider text-slate-500 mb-2">
          Description <span className="text-slate-600">(optional)</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Describe the event..."
          className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors resize-none"
        />
      </div>

      {/* Submit Button */}
      <button
        suppressHydrationWarning
        id="predict-button"
        type="submit"
        disabled={isLoading}
        className={`w-full py-4 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all ${isLoading
          ? 'bg-slate-700 text-slate-400 cursor-wait'
          : 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white hover:from-cyan-500 hover:to-cyan-400 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 active:scale-[0.98]'
          }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Analyzing...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            Predict Impact
          </span>
        )}
      </button>
    </form>
  );
}
