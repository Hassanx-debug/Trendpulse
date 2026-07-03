/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ArrowUpRight, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  User, 
  ExternalLink, 
  Layers, 
  Zap, 
  Globe, 
  Twitter, 
  MessageCircle,
  Share2
} from 'lucide-react';
import { Story } from '../types';
import { getStoryImageUrl } from './StoryCard';

interface StoryDetailProps {
  story: Story | null;
  onClose: () => void;
  onSelectRelated: (story: Story) => void;
  allStories: Story[];
}

export default function StoryDetail({ story, onClose, onSelectRelated, allStories }: StoryDetailProps) {
  if (!story) return null;

  const {
    title,
    description,
    source_name,
    source_type,
    source_url,
    score,
    comments_count,
    velocity_score,
    first_seen_at,
    author,
    cross_platform_count,
    platform_data,
    history
  } = story;

  // Format date
  const formatFullDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  // Find related stories based on platform links
  const relatedStories = allStories.filter(s => {
    if (s.id === story.id) return false;
    const storyGroupIds = Object.values(platform_data || {}).map((item: any) => item.id);
    return storyGroupIds.includes(s.id);
  });

  // Calculate coordinates for the main Velocity graph
  const renderVelocityChart = () => {
    const points = history || [];
    if (points.length < 2) {
      return (
        <div className="h-48 flex items-center justify-center text-xs text-gray-500 font-mono border border-white/5 rounded bg-white/[0.01]">
          Acquiring enough telemetry data points to draw curve...
        </div>
      );
    }

    const values = points.map(p => p.velocity_score);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const width = 500;
    const height = 180;
    const padding = 20;

    const coords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * (width - padding * 2) + padding;
      const y = height - ((p.velocity_score - min) / range) * (height - padding * 2) - padding;
      return { x, y, val: p.velocity_score, time: new Date(p.timestamp).toLocaleTimeString() };
    });

    const pathData = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
    const fillPathData = `${pathData} L ${coords[coords.length - 1].x} ${height - padding} L ${coords[0].x} ${height - padding} Z`;

    return (
      <div className="space-y-3 bg-brand-surface border border-brand-border p-5 rounded-xl">
        <div className="flex items-center justify-between">
          <span className="font-heading font-semibold text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
            <TrendingUp className="h-4 w-4 text-brand-cyan animate-pulse" />
            Signal Trend Velocity (Dynamic Accelerator)
          </span>
          <span className="font-mono text-xs text-brand-trending uppercase">
            Peak: V={max.toFixed(1)}
          </span>
        </div>

        <div className="relative w-full">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-brand-cyan)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--color-brand-cyan)" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.03)" strokeDasharray="3" />
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.03)" strokeDasharray="3" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.05)" />

            {/* Gradient Fill */}
            <path d={fillPathData} fill="url(#chart-grad)" />

            {/* Path line */}
            <path
              d={pathData}
              fill="none"
              stroke="var(--color-brand-cyan)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Verticals & Tooltips & Data Nodes */}
            {coords.map((c, i) => {
              const isLast = i === coords.length - 1;
              return (
                <g key={i} className="group/node">
                  {/* Vertical hover line */}
                  <line
                    x1={c.x}
                    y1={padding}
                    x2={c.x}
                    y2={height - padding}
                    stroke="rgba(62, 244, 255, 0.15)"
                    className="opacity-0 group-hover/node:opacity-100 transition-opacity"
                    strokeDasharray="2"
                  />
                  {/* Point */}
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={isLast ? "4.5" : "3.5"}
                    className={`${isLast ? 'fill-brand-cyan animate-pulse' : 'fill-brand-bg stroke-brand-cyan stroke-2'} cursor-pointer`}
                  />
                  {/* Tooltip value */}
                  <text
                    x={c.x}
                    y={c.y - 10}
                    textAnchor="middle"
                    className="font-mono text-[9px] fill-brand-cyan font-bold opacity-0 group-hover/node:opacity-100 transition-opacity bg-black pointer-events-none"
                  >
                    V={c.val.toFixed(1)}
                  </text>
                  {/* Timeline hours */}
                  {i % 4 === 0 && (
                    <text
                      x={c.x}
                      y={height - 4}
                      textAnchor="middle"
                      className="font-mono text-[8px] fill-gray-500"
                    >
                      {c.time.split(' ')[0]}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  const shareStory = () => {
    if (navigator.share) {
      navigator.share({
        title,
        text: description || 'TrendPulse signal alert.',
        url: source_url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(source_url);
      alert('Signal link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Backdrop */}
      <motion.div 
        className="fixed inset-0 bg-black/75 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Slide out drawer */}
      <motion.div 
        className="relative w-full max-w-2xl bg-brand-bg border-l border-brand-border h-full flex flex-col z-50 overflow-hidden"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
      >
        {/* Header toolbar */}
        <div className="px-6 py-4 border-b border-brand-border/60 flex items-center justify-between bg-black/30 select-none">
          <div className="flex items-center gap-2">
            <span className="font-heading font-extrabold text-[11px] uppercase tracking-[0.25em] text-gray-400">
              Signal Intelligence Analyzer
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={shareStory}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Share Link"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Drawer Body Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Gorgeous Graphical Reference Image */}
          <div className="relative w-full h-52 sm:h-64 rounded-xl overflow-hidden border border-brand-border bg-brand-surface/20 group/banner select-none shadow-lg">
            <img 
              src={getStoryImageUrl(story)} 
              alt={title} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover/banner:scale-105 transition-transform duration-700 ease-out"
            />
            {/* Ambient vignette gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {story.is_breaking && (
              <span className="absolute top-4 left-4 px-2.5 py-1 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-brand-breaking text-white shadow-xl animate-pulse">
                CRITICAL ALERT
              </span>
            )}
          </div>
          
          {/* Main Title Metadata */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/20">
                {source_type}
              </span>
              
              {story.is_breaking && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-brand-breaking/15 text-brand-breaking border border-brand-breaking/20 animate-pulse">
                  BREAKING ALARM
                </span>
              )}

              <span className="font-mono text-xs text-gray-500">
                V:{velocity_score.toFixed(1)}
              </span>
            </div>

            <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-white leading-tight tracking-tight">
              {title}
            </h1>

            {/* Author + Date details */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-400 font-mono select-none">
              {author && (
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-brand-accent" />
                  Reporter: {author}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-brand-accent" />
                First detected: {formatFullDate(first_seen_at)}
              </span>
            </div>
          </div>

          {/* Description Snippet */}
          {description && (
            <div className="bg-brand-surface/40 border border-brand-border/60 rounded-xl p-5 space-y-2">
              <span className="text-[10px] font-mono uppercase text-gray-500 tracking-wider">AGGREGATED CONTEXT</span>
              <p className="font-sans text-sm text-gray-300 leading-relaxed">
                {description}
              </p>
            </div>
          )}

          {/* Core Velocity Graph */}
          {renderVelocityChart()}

          {/* Cross Platform footprint links */}
          <div className="space-y-3">
            <span className="block text-[11px] font-mono text-gray-500 uppercase tracking-widest select-none">
              Cross-Platform Telemetry Footprint ({cross_platform_count})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.keys(platform_data || {}).map((p) => {
                const info = platform_data[p];
                return (
                  <a
                    key={p}
                    href={info.source_url || source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-brand-surface hover:bg-white/[0.03] border border-brand-border/60 hover:border-brand-accent/30 rounded-xl transition-all duration-200 group/link"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        {p === 'hackernews' && <Zap className="h-4 w-4 text-brand-purple" />}
                        {p === 'reddit' && <MessageSquare className="h-4 w-4 text-amber-500" />}
                        {p === 'twitter' && <Twitter className="h-4 w-4 text-sky-400" />}
                        {p === 'bluesky' && <MessageCircle className="h-4 w-4 text-brand-cyan" />}
                        {p === 'googlenews' && <Globe className="h-4 w-4 text-brand-accent" />}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-heading font-bold text-white group-hover/link:text-brand-accent transition-colors">
                          {info.source_name}
                        </span>
                        <span className="block text-[10px] font-mono text-gray-500">
                          Score: {info.score} | Comments: {info.comments_count}
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-500 group-hover/link:text-white transition-colors shrink-0" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Related story duplicate groups */}
          {relatedStories.length > 0 && (
            <div className="space-y-3">
              <span className="block text-[11px] font-mono text-gray-500 uppercase tracking-widest select-none">
                Related Duplicate Matches (Levenshtein Grouping)
              </span>
              <div className="space-y-2">
                {relatedStories.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectRelated(rel)}
                    className="flex items-start justify-between p-3.5 bg-white/[0.01] hover:bg-white/[0.03] border border-brand-border rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="space-y-1 pr-6">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-brand-cyan uppercase tracking-wider">
                          {rel.source_name}
                        </span>
                        <span className="text-[9px] font-mono text-gray-500">
                          V:{rel.velocity_score}
                        </span>
                      </div>
                      <p className="font-sans text-xs font-semibold text-gray-300 line-clamp-1">
                        {rel.title}
                      </p>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Action Bottom dock */}
        <div className="p-4 bg-brand-surface border-t border-brand-border flex items-center justify-between select-none shrink-0">
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-gray-500 uppercase">CANONICAL SIGNAL ID</span>
            <span className="text-[10px] font-mono text-gray-400 select-all">{story.id}</span>
          </div>
          <a
            href={source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-accent hover:bg-brand-accent/80 text-white rounded-lg font-heading font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Go to Source Post
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

      </motion.div>
    </div>
  );
}
