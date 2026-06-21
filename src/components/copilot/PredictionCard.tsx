'use client';

import React from 'react';
import type { PredictionResult, RiskLevel } from '@/lib/types';

// ---------------------------------------------------------------------------
// Risk level config
// ---------------------------------------------------------------------------
const riskConfig: Record<RiskLevel, { color: string; bgColor: string; label: string }> = {
  low: { color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.1)', label: 'LOW' },
  medium: { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)', label: 'MEDIUM' },
  high: { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', label: 'HIGH' },
  critical: { color: '#dc2626', bgColor: 'rgba(220, 38, 38, 0.15)', label: 'CRITICAL' },
};

// ---------------------------------------------------------------------------
// Prediction Card Component
// ---------------------------------------------------------------------------
interface PredictionCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
  delay?: number;
}

export default function PredictionCard({ icon, title, value, subtitle, color, delay = 0 }: PredictionCardProps) {
  return (
    <div
      className="glass-card p-5 animate-slide-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
      <div className="flex items-start gap-4">
        <div
          className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">{title}</p>
          <p className="text-xl font-bold text-slate-100 font-mono leading-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confidence Meter
// ---------------------------------------------------------------------------
export function ConfidenceMeter({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  const getColor = () => {
    if (percentage >= 70) return '#22c55e';
    if (percentage >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="glass-card p-5 animate-slide-up" style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wider text-slate-500">Confidence</span>
        <span className="text-sm font-mono font-bold" style={{ color: getColor() }}>
          {percentage}%
        </span>
      </div>
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: getColor(),
            boxShadow: `0 0 8px ${getColor()}60`,
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Risk Badge
// ---------------------------------------------------------------------------
export function RiskBadge({ level }: { level: RiskLevel }) {
  const config = riskConfig[level];

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border animate-slide-up"
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
        borderColor: `${config.color}30`,
        animationDelay: '200ms',
        animationFillMode: 'backwards',
      }}
    >
      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: config.color }} />
      {config.label} RISK
    </div>
  );
}
