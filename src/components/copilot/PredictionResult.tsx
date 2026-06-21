'use client';

import React from 'react';
import type { PredictionResult } from '@/lib/types';
import PredictionCard, { ConfidenceMeter, RiskBadge } from './PredictionCard';

// ---------------------------------------------------------------------------
// Prediction Result Component — Full prediction display
// ---------------------------------------------------------------------------
interface PredictionResultProps {
  prediction: PredictionResult;
}

export default function PredictionResultDisplay({ prediction }: PredictionResultProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Risk Level Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Impact Analysis
        </h3>
        <RiskBadge level={prediction.riskLevel} />
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-4">
        <PredictionCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Est. Delay"
          value={`${prediction.forecastedDelayHours.toFixed(1)}h`}
          subtitle="forecasted"
          color="#f59e0b"
          delay={100}
        />
        <PredictionCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
          title="Manpower"
          value={prediction.recommendedManpower}
          subtitle="personnel"
          color="#06b6d4"
          delay={200}
        />
        <PredictionCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          }
          title="Similar Events"
          value={prediction.similarEventsCount}
          subtitle="in 2km radius"
          color="#8b5cf6"
          delay={300}
        />
        <PredictionCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Clearance"
          value={prediction.estimatedClearanceTime}
          color="#22c55e"
          delay={400}
        />
      </div>

      {/* Confidence Meter */}
      <ConfidenceMeter score={prediction.confidenceScore} />

      {/* Diversion Strategy */}
      <div className="glass-card p-4 animate-slide-up" style={{ animationDelay: '500ms', animationFillMode: 'backwards' }}>
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Diversion Strategy
          </h4>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          {prediction.diversionStrategy}
        </p>
      </div>

      {/* Nearby Resources */}
      {prediction.nearbyResources.length > 0 && (
        <div className="glass-card p-4 animate-slide-up" style={{ animationDelay: '600ms', animationFillMode: 'backwards' }}>
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Nearby Resources
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {prediction.nearbyResources.map((resource, idx) => (
              <span
                key={idx}
                className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              >
                {resource}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
