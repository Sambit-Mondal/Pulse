'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import StatsBar from './StatsBar';
import MapView from '../map/MapView';
import CopilotPanel from '../copilot/CopilotPanel';
import type { ProcessedEvent, DashboardStats } from '@/lib/types';

// ---------------------------------------------------------------------------
// Dashboard Layout — 70/30 split: Map | Copilot Panel
// ---------------------------------------------------------------------------
export default function DashboardLayout() {
  const [events, setEvents] = useState<ProcessedEvent[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ProcessedEvent | null>(null);
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);

  // Fetch events on mount
  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/events?limit=2000');
        const data = await response.json();
        if (data.success) {
          setEvents(data.data);
          computeStats(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setIsLoadingEvents(false);
      }
    }
    fetchEvents();
  }, []);

  // Compute dashboard stats from event data
  const computeStats = useCallback((eventData: ProcessedEvent[]) => {
    if (eventData.length === 0) {
      setStats(null);
      return;
    }

    const activeEvents = eventData.filter((e) => e.status === 'active').length;
    const resolutionTimes = eventData
      .map((e) => e.timeToResolveHours)
      .filter((t) => t > 0);
    const avgResolution =
      resolutionTimes.length > 0
        ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
        : 0;

    // Find top cause
    const causeCounts: Record<string, number> = {};
    eventData.forEach((e) => {
      causeCounts[e.eventCause] = (causeCounts[e.eventCause] || 0) + 1;
    });
    const topCause = Object.entries(causeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const highPriorityCount = eventData.filter((e) => e.priority === 'high').length;
    const roadClosureCount = eventData.filter((e) => e.requiresRoadClosure).length;

    setStats({
      totalEvents: eventData.length,
      activeEvents,
      avgResolutionHours: avgResolution,
      topCause,
      highPriorityCount,
      roadClosureCount,
    });
  }, []);

  const handleEventSelect = useCallback((event: ProcessedEvent) => {
    setSelectedEvent(event);
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setClickedCoords({ lat, lng });
  }, []);

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden">
      {/* Header */}
      <Header />

      {/* Stats Bar */}
      <StatsBar stats={stats} />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Map (70% on desktop, full on mobile) */}
        <div className={`flex-1 relative transition-all duration-300 ${panelOpen ? 'lg:w-[70%]' : 'w-full'}`}>
          {isLoadingEvents ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-900">
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-300">Loading event data...</p>
                  <p className="text-[11px] text-slate-500 mt-1">Fetching from database</p>
                </div>
              </div>
            </div>
          ) : (
            <MapView
              events={events}
              onEventSelect={handleEventSelect}
              onMapClick={handleMapClick}
              selectedEvent={selectedEvent}
            />
          )}

          {/* Mobile toggle button for panel */}
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="lg:hidden absolute bottom-4 right-4 z-20 w-12 h-12 rounded-full bg-cyan-600 text-white shadow-lg shadow-cyan-500/30 flex items-center justify-center hover:bg-cyan-500 active:scale-95 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {panelOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              )}
            </svg>
          </button>
        </div>

        {/* Copilot Panel (30% on desktop, overlay on mobile) */}
        <div
          className={`
            fixed lg:static inset-y-0 right-0 z-30
            w-full sm:w-95 lg:w-[30%] lg:min-w-85 lg:max-w-115
            transition-transform duration-300 ease-in-out
            ${panelOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:hidden'}
          `}
        >
          <CopilotPanel clickedCoords={clickedCoords} />
        </div>

        {/* Mobile overlay backdrop */}
        {panelOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setPanelOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
