/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, Flame, ArrowRight } from 'lucide-react';
import { Story } from '../types';

interface BreakingStripProps {
  stories: Story[];
  onSelectStory: (story: Story) => void;
}

export default function BreakingStrip({ stories, onSelectStory }: BreakingStripProps) {
  // Filter for breaking stories
  // Ideally <15m old, but fallback to any breaking stories to keep strip full
  const breaking = stories.filter(s => s.is_breaking);
  
  if (breaking.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full bg-black/60 border-y border-brand-border h-11 flex items-center overflow-hidden z-20 backdrop-blur-md">
      {/* Absolute Badge */}
      <div className="absolute left-0 top-0 bottom-0 bg-brand-bg/90 px-4 border-r border-brand-border flex items-center gap-2 z-30 shrink-0 select-none">
        <div className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-breaking opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-breaking"></span>
        </div>
        <span className="font-heading font-extrabold text-[11px] uppercase tracking-[0.2em] text-brand-breaking flex items-center gap-1">
          <Flame className="h-3 w-3" />
          Breaking
        </span>
      </div>

      {/* Scrolling Content Container */}
      <div className="flex-1 overflow-hidden h-full flex items-center pl-32">
        <div className="flex gap-8 animate-[marquee_45s_linear_infinite] hover:[animation-play-state:paused] whitespace-nowrap cursor-pointer">
          {/* Duplicate list to create seamless infinite scroll loop */}
          {[...breaking, ...breaking, ...breaking].map((story, index) => {
            const ageMinutes = Math.max(1, Math.floor((new Date().getTime() - new Date(story.first_seen_at).getTime()) / (1000 * 60)));
            const isFresh = ageMinutes <= 15;
            
            return (
              <div 
                key={`${story.id}-${index}`}
                onClick={() => onSelectStory(story)}
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 px-3 py-1 rounded-full text-xs transition-all text-gray-300 hover:text-white"
              >
                {isFresh && (
                  <span className="bg-brand-breaking/20 text-brand-breaking text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.2 rounded uppercase animate-pulse">
                    NEW
                  </span>
                )}
                <span className="text-[10px] font-mono font-bold text-brand-cyan tracking-wider uppercase">
                  {story.source_type}
                </span>
                <span className="text-gray-400 font-mono text-[10px]">
                  V:{story.velocity_score}
                </span>
                <span className="font-sans font-medium truncate max-w-[280px] sm:max-w-[400px]">
                  {story.title}
                </span>
                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-brand-cyan shrink-0" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Tail shadow */}
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-brand-bg to-transparent pointer-events-none z-20" />
    </div>
  );
}
