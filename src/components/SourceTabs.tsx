/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Globe, 
  MessageSquare, 
  Twitter, 
  Zap, 
  MessageCircle, 
  Layers, 
  Flame 
} from 'lucide-react';
import { SourceType } from '../types';

interface SourceTabsProps {
  activeTab: string;
  onChange: (tab: string) => void;
}

export default function SourceTabs({ activeTab, onChange }: SourceTabsProps) {
  const tabs = [
    { id: 'all', label: 'All Signal Channels', icon: Globe },
    { id: 'reddit', label: 'Reddit r/news', icon: MessageSquare, color: 'hover:text-amber-500' },
    { id: 'hackernews', label: 'Hacker News', icon: Zap, color: 'hover:text-brand-purple' },
    { id: 'twitter', label: 'Twitter', icon: Twitter, color: 'hover:text-sky-400' },
    { id: 'bluesky', label: 'Bluesky', icon: MessageCircle, color: 'hover:text-brand-cyan' },
    { id: 'googlenews', label: 'Google News', icon: Globe, color: 'hover:text-brand-accent' },
    { id: 'gemini', label: 'Gemini Grounding', icon: Flame, color: 'hover:text-emerald-400' },
    { id: 'cross_platform', label: 'Cross-Platform Alerts', icon: Layers, color: 'hover:text-brand-trending' },
  ];

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2 select-none border-b border-brand-border/40 mb-6">
      <div className="flex items-center gap-1.5 md:gap-2 px-1 min-w-max">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-heading font-semibold text-xs tracking-tight cursor-pointer transition-all ${
                isActive 
                  ? 'bg-brand-accent/15 border-brand-accent/30 text-white shadow-[0_0_12px_rgba(59,168,255,0.12)]' 
                  : `bg-white/[0.02] border-white/5 text-gray-400 hover:bg-white/5 hover:border-white/10 ${tab.color || 'hover:text-white'}`
              }`}
            >
              <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-brand-accent animate-pulse' : 'text-gray-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
