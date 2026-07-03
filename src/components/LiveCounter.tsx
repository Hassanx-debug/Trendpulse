/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, ShieldAlert } from 'lucide-react';
import { Story } from '../types';

interface LiveCounterProps {
  stories: Story[];
}

export default function LiveCounter({ stories }: LiveCounterProps) {
  const [count, setCount] = useState(0);
  const [highlight, setHighlight] = useState(false);

  // Calculate stories detected in the last 15 minutes
  useEffect(() => {
    const now = new Date().getTime();
    const fifteenMins = 15 * 60 * 1000;
    const newStories = stories.filter(s => {
      const age = now - new Date(s.first_seen_at).getTime();
      return age <= fifteenMins;
    });

    const newCount = newStories.length;
    
    if (newCount !== count && count > 0) {
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 1200);
      return () => clearTimeout(timer);
    }
    
    setCount(newCount);
  }, [stories, count]);

  return (
    <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-lg select-none">
      <div className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-cyan opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-cyan"></span>
      </div>
      
      <div className="flex items-center gap-1.5 font-mono text-[11px] text-gray-400">
        <Activity className="h-3.5 w-3.5 text-gray-500" />
        <span className="hidden sm:inline">Active telemetry:</span>
        
        <AnimatePresence mode="popLayout">
          <motion.span
            key={count}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            className={`font-bold font-mono transition-colors duration-300 ${
              highlight ? 'text-brand-trending scale-110 shadow-sm' : 'text-brand-cyan'
            }`}
          >
            {count}
          </motion.span>
        </AnimatePresence>
        
        <span>signals detected (15m)</span>
      </div>
    </div>
  );
}
