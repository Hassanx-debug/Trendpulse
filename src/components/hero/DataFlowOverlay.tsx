/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

export default function DataFlowOverlay() {
  const [logs, setLogs] = useState<string[]>([]);

  const sysMsgs = [
    'CONNECTING TO PROTOCOL GATEWAYS...',
    'ESTABLISHED AT-PROTO (BLUESKY FIREHOSE) ON IP 104.18.25.121',
    'ESTABLISHED REDDIT RSS SOCKET CHANNEL',
    'ESTABLISHED HN FIREBASE GRAPH CHANNEL',
    'SCANNING CORE NODES...',
    'INGESTING POST: "Solid-state battery line open in Germany..." (r/technology)',
    'COMPARING TO HN THREAD: ID 3882910... SIMILARITY 84%',
    'CROSS-CHANNEL CORRELATION: DETECTED IN 2 DISTINCT PLATFORMS',
    'APPLYING VELOCITY BIAS FORMULA...',
    'ENGAGEMENT COEFFICIENT: 9.84 | RECENCY SPEED: 3.0X',
    'VELOCITY SCORE ACCELERATING: V=112.5 (BREAKING SIGNAL ALERT)',
    'BROADCASTING TO TELEMETRY SYSTEM CLIENTS...',
    'CLEANING STALE NODES (>24H AGE)...',
    'DATABASE RE-INDEX COMPLETED (SQL STATEMENTS VERIFIED)',
    'INGESTING GOOGLE NEWS HIGHLIGHTS...',
    'DETECTED CORRELATED COVERAGE IN REUTERS GLOBAL SYNDICATE'
  ];

  useEffect(() => {
    // Populate baseline logs
    setLogs(sysMsgs.slice(0, 5));

    let idx = 5;
    const interval = setInterval(() => {
      setLogs((prev) => {
        const next = [...prev, sysMsgs[idx]];
        if (next.length > 7) next.shift(); // maintain small size
        return next;
      });

      idx = (idx + 1) % sysMsgs.length;
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute bottom-6 left-6 z-10 hidden md:flex flex-col gap-2 max-w-sm select-none font-mono text-[10px] text-brand-cyan/40 bg-black/40 border border-white/5 p-4 rounded-lg backdrop-blur-sm pointer-events-none">
      <div className="flex items-center gap-1.5 text-[9px] text-brand-cyan uppercase tracking-widest font-bold">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan animate-pulse" />
        Processing Telemetry
      </div>
      <div className="space-y-1 h-36 overflow-hidden flex flex-col justify-end">
        {logs.map((log, i) => (
          <div key={i} className="truncate tracking-wider animate-pulse">
            &gt; {log}
          </div>
        ))}
      </div>
    </div>
  );
}
