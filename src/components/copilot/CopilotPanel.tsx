'use client';

import React, { useState } from 'react';
import EventForm from './EventForm';
import PredictionResultDisplay from './PredictionResult';
import type { PredictImpactRequest, PredictionResult } from '@/lib/types';

// ---------------------------------------------------------------------------
// Copilot Side Panel
// ---------------------------------------------------------------------------
interface CopilotPanelProps {
  clickedCoords: { lat: number; lng: number } | null;
  onPrediction?: (prediction: PredictionResult | null) => void;
}

type TabId = 'new-event' | 'analysis';

export default function CopilotPanel({ clickedCoords, onPrediction }: CopilotPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('new-event');
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: PredictImpactRequest) => {
    setIsLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const response = await fetch('/api/predict-impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Prediction failed');
      }

      setPrediction(result.prediction);
      if (onPrediction) onPrediction(result.prediction);
      setActiveTab('analysis');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    {
      id: 'new-event',
      label: 'New Event',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      ),
    },
    {
      id: 'analysis',
      label: 'Analysis',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
      ),
    },
  ];

  return (
    <div
      id="copilot-panel"
      className="flex flex-col h-full bg-slate-900/50 backdrop-blur-xl border-l border-slate-700/30"
    >
      {/* Panel Header */}
      <div className="shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/10 flex items-center justify-center border border-cyan-500/20">
            <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">AI Copilot</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">RAG-Powered Analysis</p>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-2 p-1.5 rounded-lg bg-slate-800/50 border border-slate-700/30">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              suppressHydrationWarning
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-700/80 text-cyan-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'analysis' && prediction && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {activeTab === 'new-event' && (
          <EventForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            clickedCoords={clickedCoords}
          />
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-4">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 animate-spin" />
                  <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-purple-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-300">Analyzing impact...</p>
                  <p className="text-[11px] text-slate-500 mt-1">Querying historical events & running AI analysis</p>
                </div>
              </div>
            )}

            {error && (
              <div className="glass-card p-4 border-red-500/20 animate-slide-up">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <span className="text-sm font-medium text-red-400">Analysis Error</span>
                </div>
                <p className="text-xs text-slate-400">{error}</p>
                <button
                  onClick={() => setActiveTab('new-event')}
                  className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  ← Back to form
                </button>
              </div>
            )}

            {prediction && !isLoading && (
              <PredictionResultDisplay prediction={prediction} />
            )}

            {!prediction && !isLoading && !error && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/30 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-400">No analysis yet</p>
                <p className="text-[11px] text-slate-600 mt-1">Submit an event to see AI predictions</p>
                <button
                  onClick={() => setActiveTab('new-event')}
                  className="mt-4 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  ← Go to Event Form
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Panel Footer */}
      <div className="shrink-0 px-6 py-4 border-t border-slate-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-slate-500">Groq llama-3.3-70b</span>
          </div>
          <span className="text-[10px] text-slate-600">Powered by RAG</span>
        </div>
      </div>
    </div>
  );
}
