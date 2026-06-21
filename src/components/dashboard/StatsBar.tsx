'use client';

import React, { useEffect, useState } from 'react';
import type { DashboardStats } from '@/lib/types';

// ---------------------------------------------------------------------------
// Stat Card Component
// ---------------------------------------------------------------------------
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  suffix?: string;
  color: string;
  delay: number;
}

function StatCard({ icon, label, value, suffix, color, delay }: StatCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`glass-card flex items-center gap-4 px-5 py-4 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div
        className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
      >
        <div style={{ color }}>{icon}</div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wider text-slate-500 truncate">{label}</p>
        <p className="text-lg font-semibold text-slate-100 leading-tight font-mono">
          {value}
          {suffix && <span className="text-xs text-slate-500 ml-1">{suffix}</span>}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stats Bar Component
// ---------------------------------------------------------------------------
interface StatsBarProps {
  stats: DashboardStats | null;
}

export default function StatsBar({ stats }: StatsBarProps) {
  const displayStats = stats || {
    totalEvents: 0,
    activeEvents: 0,
    avgResolutionHours: 0,
    topCause: 'loading...',
    highPriorityCount: 0,
    roadClosureCount: 0,
  };

  return (
    <div
      id="stats-bar"
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 px-4 md:px-6 py-4"
    >
      <StatCard
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
        }
        label="Total Events"
        value={displayStats.totalEvents.toLocaleString()}
        color="#06b6d4"
        delay={0}
      />
      <StatCard
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        }
        label="Active"
        value={displayStats.activeEvents}
        color="#f59e0b"
        delay={80}
      />
      <StatCard
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        label="Avg Resolution"
        value={displayStats.avgResolutionHours.toFixed(1)}
        suffix="hrs"
        color="#8b5cf6"
        delay={160}
      />
      <StatCard
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
        }
        label="Top Cause"
        value={displayStats.topCause.replace(/_/g, ' ')}
        color="#ec4899"
        delay={240}
      />
      <StatCard
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
          </svg>
        }
        label="High Priority"
        value={displayStats.highPriorityCount.toLocaleString()}
        color="#ef4444"
        delay={320}
      />
      <StatCard
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        }
        label="Road Closures"
        value={displayStats.roadClosureCount}
        color="#f97316"
        delay={400}
      />
    </div>
  );
}
