/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowUpRight, 
  MessageSquare, 
  TrendingUp, 
  Zap, 
  Globe, 
  MessageCircle, 
  Twitter, 
  Layers 
} from 'lucide-react';
import { Story } from '../types';

interface StoryCardProps {
  key?: React.Key;
  story: Story;
  onClick: () => void;
}

/**
 * Smart image-matching function that maps categories and key terms to gorgeous, high-contrast,
 * professional-grade Unsplash photography for a beautiful graphical feed.
 */
export function getStoryImageUrl(story: Story): string {
  if (story.thumbnail_url && story.thumbnail_url.startsWith('http')) {
    return story.thumbnail_url;
  }

  const titleLower = story.title.toLowerCase();
  const descLower = (story.description || '').toLowerCase();
  const textToSearch = `${titleLower} ${descLower} ${(story.keywords || []).join(' ')}`.toLowerCase();

  if (textToSearch.includes('exoplanet') || textToSearch.includes('astronomer') || textToSearch.includes('telescope') || textToSearch.includes('space') || textToSearch.includes('galaxy') || textToSearch.includes('planet') || textToSearch.includes('nasa') || textToSearch.includes('star') || textToSearch.includes('jupiter') || textToSearch.includes('mars')) {
    return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80'; // space planet
  }
  if (textToSearch.includes('ai') || textToSearch.includes('openai') || textToSearch.includes('orion') || textToSearch.includes('intelligence') || textToSearch.includes('agentic') || textToSearch.includes('reasoning') || textToSearch.includes('neural') || textToSearch.includes('model') || textToSearch.includes('llm') || textToSearch.includes('robot') || textToSearch.includes('chatgpt') || textToSearch.includes('copilot')) {
    return 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80'; // glowing brain
  }
  if (textToSearch.includes('battery') || textToSearch.includes('solid-state') || textToSearch.includes('quantumscape') || textToSearch.includes('ev ') || textToSearch.includes('lithium') || textToSearch.includes('power') || textToSearch.includes('electricity') || textToSearch.includes('charging')) {
    return 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80'; // battery/EV charging
  }
  if (textToSearch.includes('supersonic') || textToSearch.includes('aviation') || textToSearch.includes('flight') || textToSearch.includes('boom') || textToSearch.includes('plane') || textToSearch.includes('concorde') || textToSearch.includes('airline') || textToSearch.includes('aerodynamic')) {
    return 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80'; // sleek plane
  }
  if (textToSearch.includes('maritime') || textToSearch.includes('shipping') || textToSearch.includes('cargo') || textToSearch.includes('treaty') || textToSearch.includes('ocean') || textToSearch.includes('sea') || textToSearch.includes('port') || textToSearch.includes('vessel')) {
    return 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=600&q=80'; // cargo ship
  }
  if (textToSearch.includes('aurora') || textToSearch.includes('solar') || textToSearch.includes('flare') || textToSearch.includes('storm') || textToSearch.includes('geomagnetic') || textToSearch.includes('weather') || textToSearch.includes('sky')) {
    return 'https://images.unsplash.com/photo-1483168527879-c66136b56105?auto=format&fit=crop&w=600&q=80'; // aurora
  }
  if (textToSearch.includes('bluesky') || textToSearch.includes('federation') || textToSearch.includes('social') || textToSearch.includes('network') || textToSearch.includes('twitter') || textToSearch.includes('mastodon') || textToSearch.includes('threads') || textToSearch.includes('dm')) {
    return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80'; // connection network
  }
  if (textToSearch.includes('chip') || textToSearch.includes('semiconductor') || textToSearch.includes('nvidia') || textToSearch.includes('hardware') || textToSearch.includes('quantum') || textToSearch.includes('gpu') || textToSearch.includes('cpu') || textToSearch.includes('microchip') || textToSearch.includes('silicon')) {
    return 'https://images.unsplash.com/photo-1558441719-ff34b0524a24?auto=format&fit=crop&w=600&q=80'; // technology circuit board
  }
  if (textToSearch.includes('code') || textToSearch.includes('software') || textToSearch.includes('developer') || textToSearch.includes('programming') || textToSearch.includes('github') || textToSearch.includes('linux') || textToSearch.includes('git') || textToSearch.includes('script') || textToSearch.includes('framework')) {
    return 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80'; // screen code
  }
  if (textToSearch.includes('politic') || textToSearch.includes('election') || textToSearch.includes('government') || textToSearch.includes('president') || textToSearch.includes('law') || textToSearch.includes('summit') || textToSearch.includes('senate') || textToSearch.includes('congress')) {
    return 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=600&q=80'; // court/government
  }
  if (textToSearch.includes('finance') || textToSearch.includes('crypto') || textToSearch.includes('bitcoin') || textToSearch.includes('market') || textToSearch.includes('stock') || textToSearch.includes('economy') || textToSearch.includes('trade') || textToSearch.includes('inflation') || textToSearch.includes('dollar')) {
    return 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80'; // trading graph
  }
  if (textToSearch.includes('science') || textToSearch.includes('biotech') || textToSearch.includes('dna') || textToSearch.includes('medical') || textToSearch.includes('health') || textToSearch.includes('research') || textToSearch.includes('microscope') || textToSearch.includes('lab') || textToSearch.includes('crispr')) {
    return 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&w=600&q=80'; // microscope laboratory
  }

  if (story.source_type === 'googlenews') {
    return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80'; // global news paper
  }
  if (story.source_type === 'hackernews') {
    return 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80'; // digital desk startup
  }

  return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80'; // nice generic technology space planet
}

export default function StoryCard({ story, onClick }: StoryCardProps) {
  const {
    title,
    source_name,
    source_type,
    score,
    comments_count,
    velocity_score,
    first_seen_at,
    cross_platform_count,
    platform_data,
    history
  } = story;

  const imageUrl = getStoryImageUrl(story);

  // Format time elapsed
  const timeElapsed = () => {
    const minutes = Math.max(1, Math.floor((new Date().getTime() - new Date(first_seen_at).getTime()) / (1000 * 60)));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Platform badges renderer
  const renderPlatformBadges = () => {
    const platforms = Object.keys(platform_data || {});
    if (platforms.length <= 1) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/5 text-gray-400 border border-white/5">
          {source_type === 'hackernews' && <Zap className="h-3 w-3 text-brand-purple" />}
          {source_type === 'reddit' && <MessageSquare className="h-3 w-3 text-amber-500" />}
          {source_type === 'twitter' && <Twitter className="h-3 w-3 text-sky-400" />}
          {source_type === 'bluesky' && <MessageCircle className="h-3 w-3 text-brand-cyan" />}
          {source_type === 'googlenews' && <Globe className="h-3 w-3 text-brand-accent" />}
          {source_name}
        </span>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-1">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 font-bold">
          <Layers className="h-2.5 w-2.5" />
          {cross_platform_count} sources
        </span>
        {platforms.map((p) => (
          <span 
            key={p} 
            className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-white/5 border border-white/10 text-[8px] font-mono text-gray-400 uppercase"
            title={platform_data[p]?.source_name || p}
          >
            {p[0].toUpperCase()}
          </span>
        ))}
      </div>
    );
  };

  // Sparkline Generator
  const renderSparkline = () => {
    const points = history || [];
    if (points.length < 2) return null;

    const values = points.map(p => p.velocity_score);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const width = 120;
    const height = 28;
    const padding = 2;

    const coords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * (width - padding * 2) + padding;
      const y = height - ((p.velocity_score - min) / range) * (height - padding * 2) - padding;
      return `${x},${y}`;
    }).join(' ');

    const isTrendingUp = values[values.length - 1] >= values[0];

    return (
      <div className="flex flex-col items-end gap-1 select-none shrink-0">
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            <linearGradient id={`grad-${story.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isTrendingUp ? 'var(--color-brand-trending)' : 'var(--color-brand-accent)'} stopOpacity="0.15" />
              <stop offset="100%" stopColor={isTrendingUp ? 'var(--color-brand-trending)' : 'var(--color-brand-accent)'} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {/* Sparkline gradient fill */}
          <path
            d={`M ${padding},${height} L ${coords} L ${width - padding},${height} Z`}
            fill={`url(#grad-${story.id})`}
          />
          {/* Sparkline stroke */}
          <polyline
            fill="none"
            stroke={isTrendingUp ? 'var(--color-brand-trending)' : 'var(--color-brand-accent)'}
            strokeWidth="1.5"
            points={coords}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Pulse dot at end */}
          {points.length > 0 && (
            <circle
              cx={(width - padding)}
              cy={height - ((values[values.length - 1] - min) / range) * (height - padding * 2) - padding}
              r="2.5"
              fill={isTrendingUp ? 'var(--color-brand-trending)' : 'var(--color-brand-accent)'}
              className="animate-pulse"
            />
          )}
        </svg>
        <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider flex items-center gap-1 select-none">
          <TrendingUp className={`h-2.5 w-2.5 ${isTrendingUp ? 'text-brand-trending' : 'text-gray-400'}`} />
          Velocity Curve
        </span>
      </div>
    );
  };

  return (
    <motion.div
      onClick={onClick}
      className={`group relative rounded-xl border p-5 cursor-pointer bg-brand-surface/40 hover:bg-brand-surface/80 transition-all duration-300 select-none ${
        story.is_breaking 
          ? 'border-brand-breaking/20 hover:border-brand-breaking/40 hover:glow-breaking' 
          : 'border-brand-border hover:border-brand-accent/30 hover:glow-cyan'
      }`}
      whileHover={{ y: -3 }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Decorative pulse glow on breaking */}
      {story.is_breaking && (
        <span className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full bg-brand-breaking animate-ping" />
      )}

      <div className="flex flex-col md:flex-row gap-5 items-stretch">
        {/* News Reference Image */}
        <div className="relative w-full md:w-44 h-40 md:h-28 rounded-xl overflow-hidden shrink-0 bg-white/5 border border-white/10 group-hover:border-brand-accent/20 transition-all duration-300">
          <img
            src={imageUrl}
            alt={title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
          {story.is_breaking && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-mono font-black uppercase tracking-wider bg-brand-breaking text-white shadow-lg animate-pulse">
              HOT
            </div>
          )}
        </div>

        {/* Text Details */}
        <div className="flex-1 flex flex-col justify-between min-w-0 space-y-3">
          <div className="space-y-2">
            {/* Badges and metadata */}
            <div className="flex flex-wrap items-center gap-2">
              {renderPlatformBadges()}
              
              {story.is_breaking && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-brand-breaking/10 text-brand-breaking border border-brand-breaking/20">
                  Urgent Signal
                </span>
              )}
              
              <span className="text-[10px] font-mono text-gray-500 font-medium">
                {timeElapsed()}
              </span>
            </div>

            {/* Headline */}
            <h3 className="font-heading font-semibold text-base sm:text-lg text-white group-hover:text-brand-accent transition-colors duration-200 leading-snug tracking-tight">
              {title}
            </h3>

            {/* Brief Snippet */}
            {story.description && (
              <p className="font-sans text-xs text-gray-400 line-clamp-2 leading-relaxed">
                {story.description}
              </p>
            )}
          </div>

          {/* Stats footers */}
          <div className="flex items-center gap-4 text-[11px] font-mono text-gray-500 select-none">
            {score > 0 && (
              <span className="flex items-center gap-1 hover:text-white transition-colors">
                <ArrowUpRight className="h-3.5 w-3.5 text-brand-trending" />
                {score} points
              </span>
            )}
            {comments_count > 0 && (
              <span className="flex items-center gap-1 hover:text-white transition-colors">
                <MessageSquare className="h-3.5 w-3.5 text-brand-cyan" />
                {comments_count} thread comments
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Velocity panel (Right block) */}
        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-4 border-t md:border-t-0 border-brand-border/40 pt-3 md:pt-0 shrink-0">
          {/* Sparkline visualization */}
          {renderSparkline()}

          {/* Large dynamic velocity number */}
          <div className="flex items-center gap-2 select-none">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest leading-none">VELOCITY</span>
              <span className="font-mono text-xl sm:text-2xl font-black text-white tracking-tighter">
                {velocity_score.toFixed(1)}
              </span>
            </div>
            
            <div className={`relative flex items-center justify-center h-7 w-7 rounded-full bg-white/5 border border-white/10 ${
              story.is_breaking ? 'text-brand-breaking bg-brand-breaking/5' : 'text-brand-cyan bg-brand-cyan/5'
            }`}>
              <Zap className={`h-4 w-4 ${story.is_breaking ? 'animate-bounce text-brand-breaking' : 'text-brand-cyan'}`} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
