'use client';

import React, { useState, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Animated Heartbeat Logo
// ---------------------------------------------------------------------------
function PulseLogo() {
  return (
    <div className="flex items-center gap-3">
      {/* Heartbeat icon */}
      <div className="relative w-10 h-10 flex items-center justify-center">
        <div className="absolute inset-0 rounded-lg bg-linear-to-br from-cyan-500/20 to-cyan-400/5 animate-glow" />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-6 h-6 text-cyan-400 animate-heartbeat relative z-10"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      </div>

      {/* Brand text */}
      <div className="flex flex-col">
        <h1 className="text-xl font-bold tracking-wider gradient-text leading-none">
          PULSE
        </h1>
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">
          Congestion Copilot
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live Clock
// ---------------------------------------------------------------------------
function LiveClock() {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    function updateTime() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
      setDate(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      );
    }
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-end">
      <span className="text-sm font-mono text-cyan-400 tracking-wider">{time}</span>
      <span className="text-[10px] text-slate-500 tracking-wide">{date}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status Indicator
// ---------------------------------------------------------------------------
function StatusIndicator({ label, status }: { label: string; status: 'online' | 'offline' | 'syncing' }) {
  const colors = {
    online: 'bg-emerald-400',
    offline: 'bg-red-400',
    syncing: 'bg-amber-400',
  };

  return (
    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/30">
      <div className={`w-2 h-2 rounded-full ${colors[status]} ${status === 'syncing' ? 'animate-pulse' : ''}`} />
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header Component
// ---------------------------------------------------------------------------
export default function Header() {
  return (
    <header
      id="dashboard-header"
      className="flex items-center justify-between px-10 md:px-10 py-10 w-full h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/30"
    >
      {/* Subtle scan line */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-linear-to-r from-transparent via-cyan-500/30 to-transparent" />

      {/* Left: Logo */}
      <PulseLogo />

      {/* Center: Status badges */}
      <div className="hidden lg:flex items-center gap-3">
        <StatusIndicator label="AI Engine" status="online" />
        <StatusIndicator label="Data Feed" status="online" />
        <StatusIndicator label="Map Tiles" status="online" />
      </div>

      {/* Right: Clock + Badge */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
          <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <span className="text-xs font-medium text-cyan-400">Flipkart Gridlock 2.0</span>
        </div>
        <LiveClock />
      </div>
    </header>
  );
}
