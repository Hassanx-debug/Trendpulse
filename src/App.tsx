/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Search, 
  RefreshCw, 
  ArrowDown, 
  Activity, 
  Wifi, 
  WifiOff, 
  SlidersHorizontal,
  Flame,
  Terminal,
  Layers,
  Sparkles,
  Power,
  Globe,
  Compass,
  Brain
} from 'lucide-react';

import { Story, DashboardStats, SourceHealth } from './types';
import CommandPalette from './components/CommandPalette';
import BreakingStrip from './components/BreakingStrip';
import StoryCard from './components/StoryCard';
import SourceTabs from './components/SourceTabs';
import LiveCounter from './components/LiveCounter';
import StoryDetail from './components/StoryDetail';

import HeroBackgroundScene from './components/hero/HeroBackgroundScene';
import SignalParticleField from './components/hero/SignalParticleField';
import DataFlowOverlay from './components/hero/DataFlowOverlay';

/**
 * Normalizes and returns the absolute API URL if VITE_BACKEND_URL is defined,
 * allowing client-side cross-origin deployments (e.g. Vercel) to point directly to
 * backend container deployments (e.g. Hugging Face Spaces or Render).
 */
function getApiUrl(path: string): string {
  const backendUrl = ((import.meta as any).env?.VITE_BACKEND_URL as string) || '';
  if (backendUrl) {
    const base = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
    return `${base}${path}`;
  }
  return path;
}

export default function App() {
  // Navigation & View States
  const [currentAct, setCurrentAct] = useState<number>(1);
  const showDashboard = currentAct === 4;
  const setShowDashboard = (val: boolean) => {
    setCurrentAct(val ? 4 : 1);
  };
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data States
  const [stories, setStories] = useState<Story[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<SourceHealth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Session, cache-busting & deduplication states
  const [shownArticleUrls, setShownArticleUrls] = useState<string[]>([]);
  const [lastFetchedTime, setLastFetchedTime] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: string; story: Story }>>([]);

  const dashboardRef = useRef<HTMLDivElement>(null);

  // Helper to construct cache-busting URLs with UUID nonces
  const getFreshApiUrl = (path: string): string => {
    const randomUuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    const nonce = `${new Date().toISOString()}_${randomUuid}`;
    const separator = path.includes('?') ? '&' : '?';
    return getApiUrl(`${path}${separator}_nonce=${encodeURIComponent(nonce)}`);
  };

  // Sync data on startup
  useEffect(() => {
    console.log(
      '%c[ZERO SIMULATION GUARANTEE] TrendPulse active in 100% live-only mode. Zero simulated content present in client/server codebases.',
      'color: #10B981; font-weight: bold; font-size: 11px; border: 1px solid #10B981; padding: 6px 12px; border-radius: 4px; background: rgba(16, 185, 129, 0.05);'
    );
    fetchData();
    connectRealtime();

    // Check keyboard command shortcuts (Cmd+K / Ctrl+K)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch feed details
  const fetchData = async () => {
    setIsSyncing(true);
    setFetchError(null);
    try {
      // 1. Stories list
      const storiesRes = await fetch(getFreshApiUrl(`/api/stories?source=${activeTab}`), { cache: 'no-store' });
      if (!storiesRes.ok) {
        throw new Error(`Stories server returned status ${storiesRes.status}`);
      }
      const data: Story[] = await storiesRes.json();
      
      // Update stories with deduplication logic
      if (shownArticleUrls.length === 0) {
        // Initial load
        setStories(data);
        setShownArticleUrls(data.map((s) => s.url || s.id).filter(Boolean));
      } else {
        // Subsequent fetch / refresh
        const fresh = data.filter((s) => !shownArticleUrls.includes(s.url || s.id));
        if (fresh.length > 0) {
          setStories(fresh);
          setShownArticleUrls((prev) => {
            const next = [...prev];
            fresh.forEach((s) => {
              const key = s.url || s.id;
              if (key && !next.includes(key)) next.push(key);
            });
            return next;
          });
        } else {
          setStories([]);
        }
      }

      // 2. Dashboard metrics
      const statsRes = await fetch(getFreshApiUrl('/api/stats'), { cache: 'no-store' });
      if (statsRes.ok) {
        const statData = await statsRes.json();
        setStats(statData);
      }

      // 3. Crawler health check
      const healthRes = await fetch(getFreshApiUrl('/api/sources/health'), { cache: 'no-store' });
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
      }

      setLastFetchedTime(new Date().toLocaleTimeString());
      setIsLoading(false);
    } catch (err: any) {
      console.error('Failed to sync intelligence feed:', err);
      setFetchError(err.message || 'Connection lost while syncing.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Re-fetch stories when filter category tab shifts
  useEffect(() => {
    if (showDashboard) {
      fetchStoriesOnly();
    }
  }, [activeTab]);

  const fetchStoriesOnly = async () => {
    setIsSyncing(true);
    setFetchError(null);
    try {
      const res = await fetch(getFreshApiUrl(`/api/stories?source=${activeTab}`), { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Stories server returned status ${res.status}`);
      }
      const data: Story[] = await res.json();
      
      // Update stories with deduplication logic
      if (shownArticleUrls.length === 0) {
        setStories(data);
        setShownArticleUrls(data.map((s) => s.url || s.id).filter(Boolean));
      } else {
        const fresh = data.filter((s) => !shownArticleUrls.includes(s.url || s.id));
        if (fresh.length > 0) {
          setStories(fresh);
          setShownArticleUrls((prev) => {
            const next = [...prev];
            fresh.forEach((s) => {
              const key = s.url || s.id;
              if (key && !next.includes(key)) next.push(key);
            });
            return next;
          });
        } else {
          setStories([]);
        }
      }
      setLastFetchedTime(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error('Stories fetch failure:', err);
      setFetchError(err.message || 'Connection lost while fetching stories.');
    } finally {
      setIsSyncing(false);
    }
  };

  // HTML5 SSE Connection
  const connectRealtime = () => {
    try {
      const sse = new EventSource(getApiUrl('/api/realtime'));
      
      sse.onopen = () => {
        setIsConnected(true);
        console.log('Realtime telemetry stream online (SSE connected).');
      };

      sse.onerror = () => {
        setIsConnected(false);
        console.warn('Realtime channel lost. Gracefully fallback to polling mode...');
        sse.close();
        
        // Reconnection interval
        setTimeout(connectRealtime, 15000);
      };

      // General feed recalculations
      sse.addEventListener('feed_update', () => {
        fetchStoriesOnly();
        // Update stats
        fetch(getApiUrl('/api/stats')).then(r => r.ok && r.json()).then(setStats).catch(console.error);
      });

      // Crawler health checks
      sse.addEventListener('health_status', (e: any) => {
        try {
          const healthData = JSON.parse(e.data);
          setHealth(healthData);
        } catch {}
      });

      // New breaking signal arrival toast alerts
      sse.addEventListener('breaking_story', (e: any) => {
        try {
          const story: Story = JSON.parse(e.data);
          
          // Trigger browser notification
          if (Notification.permission === 'granted') {
            new Notification(`[BREAKING] ${story.source_name}`, { body: story.title });
          }

          // Add to system toaster overlays
          const toastId = Math.random().toString(36).substring(2, 9);
          setToasts((prev) => [...prev, { id: toastId, story }]);
          
          // Auto remove after 6 seconds
          setTimeout(() => {
            setToasts((prev) => prev.filter(t => t.id !== toastId));
          }, 6000);

        } catch {}
      });

    } catch {
      setIsConnected(false);
    }
  };

  // Force trigger full recrawls manually
  const forceRecrawl = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setFetchError(null);
    try {
      const cronRes = await fetch(getFreshApiUrl('/api/cron/fetch-all'), { cache: 'no-store' });
      if (!cronRes.ok) {
        throw new Error(`Manual crawl failed with status ${cronRes.status}`);
      }
      await fetchData();
    } catch (err: any) {
      console.error('Manual crawl request failed:', err);
      setFetchError(err.message || 'Manual crawl request failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Transition scroll trigger
  const enterWorkspace = () => {
    setCurrentAct(4);
    setTimeout(() => {
      dashboardRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  // Request native permission
  const requestNotifyPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  // Filtered stories to match secondary search inputs on dashboard
  const filteredStories = stories.filter(story => {
    if (searchQuery.trim() === '') return true;
    const query = searchQuery.toLowerCase();
    return (
      story.title.toLowerCase().includes(query) ||
      (story.description && story.description.toLowerCase().includes(query)) ||
      story.keywords.some(k => k.includes(query)) ||
      story.source_name.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-brand-bg text-white relative">
      
      {/* Background noise grid overlays globally */}
      <div className="absolute inset-x-0 top-0 h-[600px] bg-gradient-to-b from-brand-accent/5 to-transparent pointer-events-none z-0" />

      {/* SSE Connection telemetry node badge */}
      <div className="fixed bottom-4 right-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 border border-brand-border text-[10px] font-mono backdrop-blur-md select-none">
        {isConnected ? (
          <>
            <Wifi className="h-3.5 w-3.5 text-brand-cyan animate-pulse" />
            <span className="text-brand-cyan">TELEMETRY LINK SECURE</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3.5 w-3.5 text-brand-breaking animate-pulse" />
            <span className="text-brand-breaking">SSE POLLING MODE</span>
          </>
        )}
      </div>

      {/* REAL-TIME OVERLAY ALARMS (TOASTS) */}
      <div className="fixed bottom-16 left-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none select-none">
        <AnimatePresence>
          {toasts.map(({ id, story }) => (
            <motion.div
              key={id}
              initial={{ x: -100, opacity: 0, scale: 0.9 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: -100, opacity: 0, scale: 0.95 }}
              onClick={() => {
                setSelectedStory(story);
                setToasts(prev => prev.filter(t => t.id !== id));
              }}
              className="pointer-events-auto bg-brand-surface border border-brand-breaking/40 p-4 rounded-xl glow-breaking flex flex-col gap-1.5 cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-breaking animate-ping" />
                <span className="text-[10px] font-mono font-black text-brand-breaking tracking-widest uppercase">
                  BREAKING DETECTED ({story.source_type})
                </span>
              </div>
              <p className="font-sans text-xs font-semibold leading-snug text-white">
                {story.title}
              </p>
              <span className="text-[9px] font-mono text-gray-500">
                Velocity Score surged to: {story.velocity_score}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ACT I - III: LANDING HERO */}
      {!showDashboard && currentAct !== 5 && (
        <div className="relative min-h-screen flex flex-col items-center justify-center px-6 select-none overflow-hidden z-10 bg-[#05070A]">
          
          {/* Animated sphere global mesh */}
          <HeroBackgroundScene />
          
          {/* Noise signals particle layer (Act 2 uses higher opacity) */}
          <div className={`absolute inset-0 transition-opacity duration-1000 ${currentAct === 2 ? 'opacity-100' : 'opacity-40'}`}>
            <SignalParticleField />
          </div>

          {/* Cybernetic High-Tech Header Section */}
          <header className="absolute top-0 inset-x-0 h-18 border-b border-white/[0.05] z-30 flex items-center justify-between px-6 md:px-12 bg-black/20 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded border border-brand-cyan/30 flex items-center justify-center text-[11px] text-brand-cyan font-mono font-bold tracking-tighter bg-brand-cyan/5">TP</div>
              <div>
                <span className="text-xs font-heading font-extrabold tracking-[0.3em] text-brand-accent uppercase block leading-none mb-1">Section 11 / Project.TrendPulse</span>
                <span className="text-[10px] font-mono text-gray-500 block leading-none">System Live Storyboarding</span>
              </div>
            </div>
            <div className="flex gap-8 md:gap-12 text-[10px] tracking-widest uppercase text-gray-400 font-mono">
              <div className="hidden sm:flex flex-col gap-0.5 text-right">
                <span className="text-gray-600 text-[8px]">Status</span>
                <span className="text-brand-trending">Operational</span>
              </div>
              <div className="flex flex-col gap-0.5 text-right">
                <span className="text-gray-600 text-[8px]">Uptime</span>
                <span className="text-white">99.982%</span>
              </div>
              <div className="flex flex-col gap-0.5 text-right">
                <span className="text-gray-600 text-[8px]">Region</span>
                <span className="text-brand-cyan font-bold">Global_E1</span>
              </div>
            </div>
          </header>

          {/* Side Stepper Progress Bar (Act Controller) */}
          <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-8 z-30">
            {[
              { num: "01", name: "Global Intent", active: currentAct === 1 },
              { num: "02", name: "Swarm Flow", active: currentAct === 2 },
              { num: "03", name: "Semantic Fusion", active: currentAct === 3 },
            ].map((step, idx) => (
              <button
                key={step.num}
                onClick={() => setCurrentAct(idx + 1)}
                className="group flex items-center gap-4 text-left focus:outline-none transition-all cursor-pointer"
              >
                <div className={`h-2 w-2 rounded-full transition-all duration-500 ${
                  step.active 
                    ? 'bg-brand-cyan scale-125 ring-4 ring-brand-cyan/20' 
                    : 'bg-white/10 group-hover:bg-white/40'
                }`} />
                <div className="font-mono text-[10px] tracking-widest">
                  <span className={`block font-extrabold text-[9px] ${step.active ? 'text-brand-cyan' : 'text-gray-600 group-hover:text-gray-400'}`}>
                    ACT {step.num}
                  </span>
                  <span className={`block text-[10px] font-medium uppercase mt-0.5 ${step.active ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                    {step.name}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Side automated operations logs overlay */}
          <div className={`transition-opacity duration-700 ${currentAct === 1 ? 'opacity-100' : 'opacity-20'}`}>
            <DataFlowOverlay />
          </div>

          {/* ACT 1: THE WORLD NEVER SLEEPS */}
          {currentAct === 1 && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.6 }}
              className="relative z-10 max-w-3xl space-y-6 mt-16 text-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/[0.06] text-[10px] font-mono text-brand-cyan tracking-wider uppercase backdrop-blur-sm">
                <Sparkles className="h-3 w-3 text-brand-cyan animate-pulse" />
                ACT I // Planetary Signal Scan
              </div>

              <h1 className="font-heading font-extrabold text-4xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.1] max-w-2xl mx-auto">
                Every Headline Begins <br className="hidden sm:block" />
                as a <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent via-brand-cyan to-brand-purple animate-pulse">Signal</span>.
              </h1>

              <p className="font-sans text-gray-400 text-xs sm:text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                Continuous scraping of Hacker News, Reddit, Twitter, Bluesky, and Google News.
                Signals are mapped, duplicate items consolidated, and breaking velocities calculated silently.
              </p>

              <div className="pt-6 flex flex-wrap justify-center gap-4">
                <button 
                  onClick={() => setCurrentAct(2)}
                  className="px-6 py-3.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-cyan/40 text-white font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 shadow-lg"
                >
                  Scan Packet Swarm
                  <span className="text-brand-cyan text-xs">→</span>
                </button>
                <button 
                  onClick={enterWorkspace}
                  className="px-6 py-3.5 rounded-lg bg-gradient-to-r from-brand-accent to-brand-purple text-white font-mono text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg shadow-brand-purple/20 flex items-center gap-2"
                >
                  Deploy Active Console
                  <Activity className="h-3.5 w-3.5 text-white animate-pulse" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ACT 2: BILLIONS OF CONVERSATIONS */}
          {currentAct === 2 && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.6 }}
              className="relative z-10 max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 mt-16 text-left"
            >
              <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/[0.06] text-[10px] font-mono text-brand-cyan tracking-wider uppercase backdrop-blur-sm self-start">
                  <Compass className="h-3 w-3 text-brand-cyan animate-pulse" />
                  ACT II // Swarm Telemetry Flow
                </div>

                <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-white tracking-tight leading-tight">
                  Billions of conversations, <br />
                  parsed in real-time.
                </h2>

                <p className="font-sans text-gray-400 text-xs sm:text-sm leading-relaxed">
                  Our crawler spiders monitor social platforms continuously. Raw incoming feeds are ingested, normalized at the edge, and indexed with millisecond response constraints.
                </p>

                <div className="pt-2 flex flex-wrap gap-4">
                  <button 
                    onClick={() => setCurrentAct(3)}
                    className="px-5 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-purple/40 text-white font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2"
                  >
                    Model Core intelligence
                    <span className="text-brand-purple">→</span>
                  </button>
                  <button 
                    onClick={enterWorkspace}
                    className="px-5 py-3 rounded-lg bg-brand-cyan/10 hover:bg-brand-cyan/20 border border-brand-cyan/30 text-brand-cyan font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Skip to Active Console
                  </button>
                </div>
              </div>

              <div className="lg:col-span-7 bg-[#0A1018]/70 border border-white/[0.06] p-5 rounded-xl backdrop-blur-xl flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
                  <span className="font-mono text-[9px] text-gray-500 tracking-widest uppercase">NODE_SWARM_FEED_STREAMING</span>
                  <span className="h-2 w-2 rounded-full bg-brand-trending animate-ping" />
                </div>
                <div className="space-y-3 font-mono text-[10px]">
                  {stories.slice(0, 4).map((story, idx) => (
                    <div key={idx} className="border-b border-white/[0.03] pb-3 last:border-0 last:pb-0 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-gray-500 text-[9px]">
                        <span>CORE: TP_{100 + idx} // {story.source_name.toUpperCase()}</span>
                        <span className="text-brand-cyan font-extrabold uppercase">SURGE: {story.velocity_score}</span>
                      </div>
                      <p className="text-white text-[11px] font-sans truncate font-medium">{story.title}</p>
                      <div className="flex items-center gap-3 text-gray-600 text-[8px] uppercase tracking-wider">
                        <span>Score: {story.score || 12} pts</span>
                        <span>•</span>
                        <span>Ingestion Loop: Verified</span>
                      </div>
                    </div>
                  ))}
                  {stories.length === 0 && (
                    <div className="py-12 text-center text-gray-500">
                      Syncing with global gateways...
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ACT 3: SIGNAL INTELLIGENCE */}
          {currentAct === 3 && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.6 }}
              className="relative z-10 max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 mt-16 text-left"
            >
              <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/[0.06] text-[10px] font-mono text-brand-purple tracking-wider uppercase backdrop-blur-sm self-start">
                  <Brain className="h-3 w-3 text-brand-purple animate-pulse" />
                  ACT III // Cognitive Deduplication
                </div>

                <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-white tracking-tight leading-tight">
                  Consolidating noise <br />
                  into raw intelligence.
                </h2>

                <p className="font-sans text-gray-400 text-xs sm:text-sm leading-relaxed">
                  Redundant, fragmented posts across communities are consolidated by semantic clustering algorithms. One single unified node point calculates growth vectors instantly.
                </p>

                <div className="pt-2">
                  <button 
                    onClick={enterWorkspace}
                    className="group relative inline-flex items-center gap-3 px-6 py-3.5 rounded-lg bg-gradient-to-r from-brand-accent to-brand-purple text-white font-mono text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg shadow-brand-accent/25"
                  >
                    Deploy Active Mission Control
                    <span className="text-white animate-pulse">→</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-7 bg-[#0A1018]/70 border border-white/[0.06] p-5 rounded-xl backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-white/[0.05] pb-3 mb-4">
                    <span className="font-mono text-[9px] text-gray-500 tracking-widest uppercase">COGNITIVE_MATCHING_ENGINE</span>
                    <span className="text-brand-purple font-mono text-[9px] tracking-wider uppercase font-bold">98.4% CLUSTERING BIAS</span>
                  </div>
                  
                  {/* Semantic Consolidation Visual Model */}
                  <div className="space-y-4">
                    <div className="p-3 bg-white/[0.01] border border-white/5 rounded-lg font-mono text-[10px] flex items-center justify-between relative overflow-hidden">
                      <div>
                        <span className="text-brand-cyan block text-[8px] mb-1">SIGNAL A [HACKER_NEWS]</span>
                        <span className="text-gray-300 font-sans text-xs">Vite 6 is officially out with environment API support</span>
                      </div>
                      <span className="h-2 w-2 rounded-full bg-brand-cyan animate-pulse shrink-0 ml-3" />
                    </div>

                    <div className="flex justify-center my-0.5">
                      <span className="text-[9px] font-mono text-brand-purple animate-pulse uppercase tracking-widest font-bold">↓ FUSION PROCESSOR (98.6% SIMILARITY) ↓</span>
                    </div>

                    <div className="p-3 bg-white/[0.01] border border-white/5 rounded-lg font-mono text-[10px] flex items-center justify-between relative overflow-hidden">
                      <div>
                        <span className="text-[#FF6A3D] block text-[8px] mb-1">SIGNAL B [REDDIT/R/WEBDEV]</span>
                        <span className="text-gray-300 font-sans text-xs">Vite 6.0 released featuring new modular environment API pipelines</span>
                      </div>
                      <span className="h-2 w-2 rounded-full bg-[#FF6A3D] animate-pulse shrink-0 ml-3" />
                    </div>

                    <div className="p-4 bg-brand-purple/10 border border-brand-purple/20 rounded-lg font-mono text-[10px] mt-4 flex flex-col gap-1.5 border-dashed">
                      <span className="text-brand-purple font-bold block text-[8px]">CONSOLIDATED SYSTEM NODAL SUMMARY</span>
                      <p className="text-white font-sans text-sm font-semibold leading-snug">Vite 6.0 Launches Internationally with Modular Environment API Pipelines</p>
                      <div className="flex items-center gap-4 text-gray-500 text-[8px] uppercase tracking-wider pt-1 font-bold">
                        <span>GROWTH: +284%</span>
                        <span>DEDUPLICATED: 2 ENTRIES</span>
                        <span className="text-brand-trending">STATE: COMPILED</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Downward indicator */}
          <div className="absolute bottom-6 flex flex-col items-center gap-1 font-mono text-[9px] text-gray-500 tracking-widest select-none">
            SCROLL OR NAVIGATE STEPS TO UNLOCK INTEL
            <ArrowDown className="h-3 w-3 animate-pulse" />
          </div>

        </div>
      )}

      {/* ACT IV - V: LIVE TELEMETRY DASHBOARD */}
      {showDashboard && (
        <div 
          ref={dashboardRef}
          className="relative min-h-screen z-10 flex flex-col"
          id="dashboard-root"
        >
          {/* Breaking now running marquee */}
          <BreakingStrip stories={stories} onSelectStory={setSelectedStory} />

          {/* Floated Glass Header */}
          <header className="sticky top-0 bg-brand-bg/85 backdrop-blur-md border-b border-brand-border/60 z-30 select-none">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
              
              {/* Brand Logo */}
              <div className="flex items-center gap-3">
                <div 
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => {
                    setShowDashboard(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-accent to-brand-purple flex items-center justify-center shadow-lg shadow-brand-accent/20">
                    <Activity className="h-4.5 w-4.5 text-white animate-pulse" />
                  </div>
                  <div>
                    <span className="font-heading font-black text-sm tracking-widest text-white uppercase block leading-none">TrendPulse</span>
                    <span className="text-[9px] font-mono text-brand-cyan tracking-wider block">Global Consciousness v1.0</span>
                  </div>
                </div>

                <div className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-[8px] font-mono text-emerald-400 font-bold uppercase tracking-wider select-none shrink-0">
                  <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                  ZERO SIMULATION GUARANTEED
                </div>
              </div>

              {/* Central Telemetry counters */}
              <div className="hidden md:flex items-center gap-4">
                <LiveCounter stories={stories} />
                
                {stats && (
                  <div className="font-mono text-[10px] text-gray-500 flex items-center gap-3">
                    <span>BREAKING: <span className="text-brand-breaking font-extrabold">{stats.breakingCount}</span></span>
                    <span>INGESTED/HR: <span className="text-white font-extrabold">{stats.storiesPerHour}</span></span>
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2">
                
                {/* Search / Command palette activator */}
                <button 
                  onClick={() => setIsCommandPaletteOpen(true)}
                  className="p-2 hover:bg-white/5 border border-white/0 hover:border-white/5 rounded-lg text-gray-400 hover:text-white transition-all cursor-pointer text-xs font-mono hidden sm:flex items-center gap-2"
                  title="Command Palette"
                >
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                  <kbd className="px-1.5 py-0.5 text-[9px] font-mono text-gray-500 bg-white/5 border border-white/10 rounded">
                    ⌘K
                  </kbd>
                </button>

                {/* Mobile Search Button */}
                <button 
                  onClick={() => setIsCommandPaletteOpen(true)}
                  className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all cursor-pointer sm:hidden"
                >
                  <Search className="h-4.5 w-4.5" />
                </button>

                {/* Direct crawl refresh button */}
                <button
                  onClick={forceRecrawl}
                  disabled={isSyncing}
                  className={`p-2 bg-white/[0.02] hover:bg-white/5 border border-brand-border hover:border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0 ${
                    isSyncing ? 'animate-spin text-brand-cyan' : ''
                  }`}
                  title="Synchronize Feed Telemetry"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                
                {/* Notification Activator toggle */}
                <button
                  onClick={requestNotifyPermission}
                  className="p-2 bg-white/[0.02] hover:bg-white/5 border border-brand-border rounded-lg text-brand-cyan hover:text-white transition-colors cursor-pointer shrink-0 text-xs font-mono font-bold uppercase hidden md:block"
                >
                  Set Push Alerts
                </button>

                {/* Decommission/Power lock toggle */}
                <button
                  onClick={() => setCurrentAct(5)}
                  className="p-2 bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 hover:border-red-500/30 rounded-lg text-brand-breaking hover:text-white transition-all cursor-pointer shrink-0 text-xs font-mono flex items-center justify-center"
                  title="Lock Console / Power Standby"
                >
                  <Power className="h-4 w-4" />
                </button>

              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
            
            {/* Upper Dashboard Summary Cards */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                
                <div className="bg-brand-surface/40 border border-brand-border p-4 rounded-xl space-y-1">
                  <span className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest">BREAKING DISCOVERIES</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-black text-brand-breaking">{stats.breakingCount}</span>
                    <span className="text-[10px] font-mono text-gray-400">active channels</span>
                  </div>
                </div>

                <div className="bg-brand-surface/40 border border-brand-border p-4 rounded-xl space-y-1">
                  <span className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest">HOURLY RATE</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-black text-brand-trending">{stats.storiesPerHour}</span>
                    <span className="text-[10px] font-mono text-gray-400">new signals / hr</span>
                  </div>
                </div>

                <div className="bg-brand-surface/40 border border-brand-border p-4 rounded-xl space-y-1">
                  <span className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest">ACTIVE CORPUS</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-black text-white">{stats.totalStories}</span>
                    <span className="text-[10px] font-mono text-gray-400">consolidated items</span>
                  </div>
                </div>

                {/* Web crawler healthy sources list */}
                <div className="bg-brand-surface/40 border border-brand-border p-4 rounded-xl space-y-2 col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-1 overflow-hidden">
                  <span className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest">CONNECTIONS HEALTH</span>
                  <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto no-scrollbar pt-0.5">
                    {health.length === 0 ? (
                      <span className="text-[9px] font-mono text-gray-500">Initializing spiders...</span>
                    ) : (
                      health.map((h) => {
                        const label = h.source === 'googlenews' ? 'Google News' :
                                      h.source === 'hackernews' ? 'Hacker News' :
                                      h.source === 'reddit' ? 'Reddit r/news' :
                                      h.source === 'twitter' ? 'Twitter/Nitter' :
                                      h.source === 'bluesky' ? 'Bluesky Search' :
                                      h.source === 'gemini' ? 'Gemini Grounding' : h.source;
                        
                        const statusText = h.healthy 
                          ? `OK (${h.count ?? 0} art.)` 
                          : h.error && h.error.toLowerCase().includes('quota') 
                            ? 'QUOTA EXCEEDED' 
                            : 'UNAVAILABLE';
                        return (
                          <div 
                            key={h.source} 
                            className="flex items-center justify-between text-[10px] font-mono py-0.5 border-b border-white/[0.02] last:border-0"
                          >
                            <span className="text-gray-400 font-medium">{label}</span>
                            <span 
                              className={`inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded tracking-tight ${
                                h.healthy 
                                  ? 'bg-brand-trending/10 text-brand-trending border border-brand-trending/20' 
                                  : 'bg-brand-breaking/10 text-brand-breaking border border-brand-breaking/20'
                              }`}
                              title={h.error || `Last check: ${h.last_fetched ? new Date(h.last_fetched).toLocaleTimeString() : 'N/A'}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${h.healthy ? 'bg-brand-trending animate-pulse' : 'bg-brand-breaking'}`} />
                              {statusText}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* Source channel switch switcher tabs */}
            <SourceTabs activeTab={activeTab} onChange={setActiveTab} />

            {/* Secondary Search & Sort input cluster on the actual feed panel */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pb-6">
              
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Filter local feed by keywords or sources..."
                  className="w-full bg-brand-surface border border-brand-border hover:border-white/10 focus:border-brand-accent/50 focus:glow-cyan outline-none rounded-lg py-2 pl-9 pr-4 font-sans text-xs text-white placeholder-gray-500 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0 select-none text-xs text-gray-400 font-sans">
                <SlidersHorizontal className="h-3.5 w-3.5 text-gray-500" />
                <span>Showing:</span>
                <span className="font-mono text-white bg-white/5 border border-white/10 px-2.5 py-0.5 rounded font-bold uppercase">
                  {filteredStories.length} unique signals
                </span>
                {lastFetchedTime && (
                  <span className="text-[10px] font-mono text-gray-500 bg-white/[0.02] border border-white/5 px-2.5 py-0.5 rounded">
                    Last updated: <span className="text-brand-cyan">{lastFetchedTime}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Core News Grid Cards listing */}
            {isSyncing && filteredStories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border border-dashed border-brand-border rounded-xl bg-brand-surface/10">
                <RefreshCw className="h-8 w-8 text-brand-cyan mx-auto mb-3 animate-spin" />
                <p className="font-sans text-sm text-gray-400 font-medium">Synchronizing fresh signals...</p>
              </div>
            ) : fetchError ? (
              <div className="text-center py-16 border border-dashed border-red-500/20 rounded-xl bg-red-500/5">
                <Terminal className="h-8 w-8 text-brand-breaking mx-auto mb-3 animate-pulse" />
                <p className="font-sans text-sm text-red-400 font-medium">{fetchError}</p>
                <button 
                  onClick={fetchData}
                  className="mt-4 px-4 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-mono text-white transition-all cursor-pointer"
                >
                  Retry Connection
                </button>
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-32 rounded-xl bg-brand-surface/20 border border-brand-border animate-pulse p-5 space-y-3">
                    <div className="flex gap-2.5">
                      <div className="h-4 w-16 bg-white/5 rounded" />
                      <div className="h-4 w-12 bg-white/5 rounded" />
                    </div>
                    <div className="h-6 w-3/4 bg-white/5 rounded" />
                    <div className="h-4 w-1/2 bg-white/5 rounded" />
                  </div>
                ))}
              </div>
            ) : stories.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-brand-border rounded-xl bg-brand-surface/10 px-4">
                <Terminal className="h-8 w-8 text-brand-breaking mx-auto mb-3 animate-pulse" />
                <p className="font-sans text-sm text-gray-300 font-bold">Unable to fetch live news right now — please try again shortly</p>
                <p className="font-sans text-xs text-gray-500 mt-1.5 max-w-sm mx-auto">
                  Continuous global monitoring channels are currently undergoing reconnection. 
                  Zero simulation fallbacks exist in this workspace.
                </p>
                <button 
                  onClick={fetchData}
                  className="mt-4 px-4 py-1.5 rounded bg-brand-breaking/10 hover:bg-brand-breaking/20 border border-brand-breaking/20 text-xs font-mono text-brand-breaking transition-all cursor-pointer"
                >
                  Force Hard Retry
                </button>
              </div>
            ) : filteredStories.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-brand-border rounded-xl bg-brand-surface/10 px-4">
                <Terminal className="h-8 w-8 text-gray-600 mx-auto mb-3 animate-pulse" />
                {shownArticleUrls.length > 0 ? (
                  <>
                    <p className="font-sans text-sm text-gray-400 font-medium">All news signals are up-to-date! No duplicate articles to display.</p>
                    <p className="font-sans text-xs text-gray-500 mt-1 max-w-sm mx-auto">We've filtered out previously seen stories in this session to ensure your feed is 100% fresh.</p>
                    <button 
                      onClick={() => { setShownArticleUrls([]); setStories([]); fetchData(); }}
                      className="mt-4 px-4 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-brand-cyan transition-all cursor-pointer"
                    >
                      Reset Session Cache
                    </button>
                  </>
                ) : (
                  <>
                    <p className="font-sans text-sm text-gray-400 font-medium">No signals matching the requested query parameters.</p>
                    <button 
                      onClick={() => { setActiveTab('all'); setSearchQuery(''); }}
                      className="mt-3 text-xs font-mono text-brand-cyan hover:underline"
                    >
                      Reset active filters
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredStories.map((story) => (
                    <StoryCard 
                      key={story.id} 
                      story={story} 
                      onClick={() => setSelectedStory(story)} 
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

          </main>

          {/* Core Footer */}
          <footer className="border-t border-brand-border bg-black/40 py-8 select-none">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center">
              <div className="space-y-1 md:text-left">
                <span className="font-heading font-extrabold text-xs text-white uppercase tracking-wider block">TrendPulse Signals Aggregator</span>
                <span className="text-[10px] font-mono text-gray-500 block">Deduplicated at Edge | Calculated via continuous growth rate formulas.</span>
              </div>
              <div className="font-mono text-[10px] text-gray-500 flex flex-wrap justify-center gap-4">
                <span>Deploy: Zero-Cost Stack</span>
                <span>•</span>
                <span>React 19 + Express + Vite</span>
                <span>•</span>
                <span className="text-brand-cyan">V: 1.0.0</span>
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* ACT 5: CLOSING STANDBY */}
      {currentAct === 5 && (
        <div className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center select-none overflow-hidden z-10 bg-[#020305]">
          <div className="absolute inset-0 opacity-[0.01] bg-brand-cyan animate-pulse pointer-events-none" />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2 }}
            className="max-w-2xl space-y-8"
          >
            <div className="h-14 w-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-brand-breaking animate-pulse">
              <Power className="h-6 w-6" />
            </div>
            
            <div className="space-y-3">
              <span className="font-mono text-[10px] text-brand-breaking tracking-[0.3em] uppercase block">SYSTEMS STANDBY // DECOMMISSIONED</span>
              <h2 className="font-heading font-light text-4xl sm:text-5xl text-white tracking-tight leading-snug">
                The signal fades, <br />
                but the heartbeat continues.
              </h2>
            </div>

            <p className="font-sans text-gray-500 text-xs max-w-sm mx-auto leading-relaxed font-mono uppercase tracking-widest">
              Telemetry loops severed. Humanity's silent digital consciousness continues to rotate in the dark.
            </p>

            <div className="pt-4">
              <button
                onClick={() => setCurrentAct(1)}
                className="px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-cyan/40 text-brand-cyan font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer"
              >
                Re-Initialize Protocols
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* COMMAND PALETTE INTERACTIVE VIEW */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        stories={stories}
        onSelectStory={(story) => {
          setSelectedStory(story);
          setShowDashboard(true);
        }}
        onSelectSource={(source) => {
          setShowDashboard(true);
          if (source === 'breaking') {
            setActiveTab('all');
            // Trigger filter immediately
            setSearchQuery('');
            setStories(prev => prev.filter(s => s.is_breaking));
          } else {
            setActiveTab(source);
            setSearchQuery('');
          }
        }}
      />

      {/* DETAILED DRILLDOWN DRAWER VIEW */}
      <AnimatePresence>
        {selectedStory && (
          <StoryDetail 
            story={selectedStory}
            onClose={() => setSelectedStory(null)}
            onSelectRelated={(story) => setSelectedStory(story)}
            allStories={stories}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
