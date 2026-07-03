/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Globe, Flame, RefreshCw, X, MessageSquare, Zap } from 'lucide-react';
import { Story } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  stories: Story[];
  onSelectStory: (story: Story) => void;
  onSelectSource: (source: string) => void;
}

export default function CommandPalette({ isOpen, onClose, stories, onSelectStory, onSelectSource }: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle palette via Ctrl+K or Cmd+K
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const filteredStories = searchQuery.trim() === '' 
    ? stories.slice(0, 5) 
    : stories.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.source_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.keywords.some(k => k.includes(searchQuery.toLowerCase()))
      ).slice(0, 8);

  const commands = [
    { label: 'All Sources', action: () => onSelectSource('all'), icon: Globe },
    { label: 'Hacker News Feed', action: () => onSelectSource('hackernews'), icon: Zap },
    { label: 'Reddit Feed', action: () => onSelectSource('reddit'), icon: MessageSquare },
    { label: 'Breaking Only', action: () => onSelectSource('breaking'), icon: Flame },
  ].filter(cmd => 
    searchQuery === '' || cmd.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItemsCount = commands.length + filteredStories.length;

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalItemsCount);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + totalItemsCount) % totalItemsCount);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        triggerSelectedAction();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, totalItemsCount, filteredStories, commands]);

  const triggerSelectedAction = () => {
    if (selectedIndex < commands.length) {
      commands[selectedIndex].action();
      onClose();
    } else {
      const storyIndex = selectedIndex - commands.length;
      if (filteredStories[storyIndex]) {
        onSelectStory(filteredStories[storyIndex]);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 md:px-0">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
        id="cmd-palette-backdrop"
      />
      
      {/* Search Panel */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-2xl overflow-hidden rounded-xl bg-brand-surface border border-brand-border glow-cyan flex flex-col max-h-[60vh] transition-all"
        id="cmd-palette-container"
      >
        {/* Input area */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-brand-border">
          <Search className="h-5 w-5 text-gray-400 shrink-0" />
          <input 
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-white border-none outline-none font-sans text-base placeholder-gray-500"
            placeholder="Search signals, commands, or filtered feeds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-white/5 border border-white/10 rounded">
            <span>ESC</span>
          </kbd>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1 p-2 no-scrollbar">
          {totalItemsCount === 0 ? (
            <div className="py-12 text-center text-gray-500 font-sans text-sm">
              No results found for "{searchQuery}"
            </div>
          ) : (
            <div className="space-y-4">
              {/* Commands */}
              {commands.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 tracking-wider font-heading uppercase">
                    Navigation Commands
                  </div>
                  <div className="space-y-0.5">
                    {commands.map((cmd, idx) => {
                      const isSelected = idx === selectedIndex;
                      const Icon = cmd.icon;
                      return (
                        <div
                          key={cmd.label}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'bg-brand-accent/20 border-l-2 border-brand-accent text-white' : 'hover:bg-white/5 text-gray-300'
                          }`}
                          onClick={() => {
                            cmd.action();
                            onClose();
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`h-4 w-4 ${isSelected ? 'text-brand-accent animate-pulse' : 'text-gray-400'}`} />
                            <span className="font-sans text-sm">{cmd.label}</span>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] font-mono text-brand-accent">ENTER</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Signals */}
              {filteredStories.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 tracking-wider font-heading uppercase">
                    Detected Stories ({filteredStories.length})
                  </div>
                  <div className="space-y-0.5">
                    {filteredStories.map((story, idx) => {
                      const actualIdx = commands.length + idx;
                      const isSelected = actualIdx === selectedIndex;
                      return (
                        <div
                          key={story.id}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'bg-brand-accent/20 border-l-2 border-brand-accent text-white' : 'hover:bg-white/5 text-gray-300'
                          }`}
                          onClick={() => {
                            onSelectStory(story);
                            onClose();
                          }}
                        >
                          <div className="flex flex-col gap-1 pr-6 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-medium text-brand-cyan uppercase tracking-wider bg-brand-cyan/10 px-1.5 py-0.5 rounded shrink-0">
                                {story.source_type}
                              </span>
                              {story.is_breaking && (
                                <span className="text-[10px] font-mono font-semibold text-brand-breaking uppercase tracking-wider bg-brand-breaking/10 px-1.5 py-0.5 rounded shrink-0">
                                  BREAKING
                                </span>
                              )}
                              <span className="text-[10px] font-mono text-gray-500 shrink-0">
                                V: {story.velocity_score}
                              </span>
                            </div>
                            <span className="font-sans text-sm font-medium truncate w-full">{story.title}</span>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] font-mono text-brand-accent shrink-0">ENTER</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-black/40 border-t border-brand-border flex justify-between items-center text-[10px] font-mono text-gray-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigation</span>
            <span>↵ Select</span>
          </div>
          <div>
            <span>TrendPulse Command Palette v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
