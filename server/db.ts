/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { Story, StoryGroup, SourceType, DashboardStats, SourceHealth } from '../src/types';
import { stringSimilarity, calculateVelocityScore, extractKeywords } from './algorithm';
import { 
  fetchGoogleNews, 
  fetchHackerNews, 
  fetchReddit, 
  fetchBluesky, 
  fetchTwitter, 
  fetchGeminiNewsInsights
} from './fetchers';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Memory storage
let stories: Story[] = [];
let storyGroups: StoryGroup[] = [];
let healthRegistry: Record<SourceType, SourceHealth> = {
  reddit: { source: 'reddit', healthy: true, last_fetched: null },
  hackernews: { source: 'hackernews', healthy: true, last_fetched: null },
  twitter: { source: 'twitter', healthy: true, last_fetched: null },
  bluesky: { source: 'bluesky', healthy: true, last_fetched: null },
  googlenews: { source: 'googlenews', healthy: true, last_fetched: null },
  gemini: { source: 'gemini', healthy: true, last_fetched: null },
};

// SSE active clients
const sseClients: any[] = [];

/**
 * Initialize database and directories
 */
export function initDb() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      stories = data.stories || [];
      storyGroups = data.storyGroups || [];
      if (data.healthRegistry) {
        healthRegistry = data.healthRegistry;
      }
      console.log(`Database loaded: ${stories.length} stories, ${storyGroups.length} groups.`);
    } else {
      console.log('No database file found. Starting empty DB.');
      stories = [];
      storyGroups = [];
      saveDb();
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    stories = [];
    storyGroups = [];
    saveDb();
  }
}

/**
 * Seed initial data has been decommissioned as part of verified zero simulation rule.
 */
function seedInitialData() {
  stories = [];
  storyGroups = [];
  saveDb();
}

/**
 * Save state to file
 */
export function saveDb() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify({ stories, storyGroups, healthRegistry }, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write database file:', error);
  }
}

/**
 * Run Levenshtein distance grouping and update canonical cross-platform metadata
 */
export function runDeduplicationAndGrouping() {
  // Reset grouping structure
  const groups: StoryGroup[] = [];
  const handledIds = new Set<string>();

  // Sort by first seen to preserve earliest reporting timeline
  const sortedStories = [...stories].sort(
    (a, b) => new Date(a.first_seen_at).getTime() - new Date(b.first_seen_at).getTime()
  );

  for (const story of sortedStories) {
    if (handledIds.has(story.id)) continue;

    const groupStoryIds = [story.id];
    handledIds.add(story.id);

    // Scan subsequent stories to find matches
    for (const other of sortedStories) {
      if (handledIds.has(other.id)) continue;

      let isDuplicate = false;

      // 1. Exact URL match
      if (story.url && other.url && story.url === other.url) {
        isDuplicate = true;
      }

      // 2. Title similarity via Levenshtein (>80%)
      if (!isDuplicate && stringSimilarity(story.title, other.title) >= 0.78) {
        isDuplicate = true;
      }

      // 3. Keyword overlap as secondary signal (>70% overlap on substantial articles)
      if (!isDuplicate && story.keywords.length > 3 && other.keywords.length > 3) {
        const setA = new Set(story.keywords);
        let intersection = 0;
        for (const kw of other.keywords) {
          if (setA.has(kw)) intersection++;
        }
        const overlap = intersection / Math.min(story.keywords.length, other.keywords.length);
        if (overlap >= 0.72) {
          isDuplicate = true;
        }
      }

      if (isDuplicate) {
        groupStoryIds.push(other.id);
        handledIds.add(other.id);
      }
    }

    // Create Group
    const group: StoryGroup = {
      id: Math.random().toString(36).substring(2, 15),
      canonical_title: story.title,
      canonical_url: story.url,
      story_ids: groupStoryIds,
      created_at: story.first_seen_at
    };
    groups.push(group);
  }

  storyGroups = groups;

  // Re-map platform details into individual stories
  stories.forEach((story) => {
    const group = storyGroups.find((g) => g.story_ids.includes(story.id));
    if (group) {
      const peerStories = stories.filter((s) => group.story_ids.includes(s.id));
      
      story.cross_platform_count = peerStories.length;
      
      const platforms: Record<string, any> = {};
      peerStories.forEach((peer) => {
        platforms[peer.source_type] = {
          source_name: peer.source_name,
          source_url: peer.source_url,
          score: peer.score,
          comments_count: peer.comments_count,
          author: peer.author,
          id: peer.id
        };
      });
      story.platform_data = platforms;
    } else {
      story.cross_platform_count = 1;
      story.platform_data = {
        [story.source_type]: {
          source_name: story.source_name,
          source_url: story.source_url,
          score: story.score,
          comments_count: story.comments_count,
          author: story.author,
          id: story.id
        }
      };
    }

    // Recompute Velocity score based on new parameters
    const prevVelocity = story.velocity_score;
    story.velocity_score = calculateVelocityScore(story);

    // Maintain History (limit to 20 historical points)
    if (!story.history) story.history = [];
    
    // Add new history point if score has changed
    const lastHist = story.history[story.history.length - 1];
    const nowStr = new Date().toISOString();
    if (!lastHist || Math.abs(lastHist.velocity_score - story.velocity_score) > 0.5) {
      story.history.push({
        timestamp: nowStr,
        velocity_score: story.velocity_score
      });
      if (story.history.length > 24) {
        story.history.shift();
      }
    }

    // Breaking flag threshold: if velocity score crosses 100, or if it has high score
    // Reddit > 800, HN > 250, or cross-platform spread >= 2
    const wasBreaking = story.is_breaking;
    story.is_breaking = 
      story.velocity_score >= 80 || 
      story.cross_platform_count >= 2 ||
      (story.source_type === 'reddit' && story.score > 1200) ||
      (story.source_type === 'hackernews' && story.score > 300);

    // Fire real-time events for new breaking arrivals
    if (story.is_breaking && !wasBreaking) {
      broadcastSseEvent('breaking_story', story);
    }
  });
}

/**
 * Core engine: Fetch all channels, merge, compute, save
 */
export async function executeFetchAll() {
  console.log('Initiating global fetch cycle across all channels in parallel...');
  const now = new Date().toISOString();
  const nowTime = Date.now();
  const freshnessLimit = 24 * 60 * 60 * 1000; // 24 hours
  
  // Array of independent jobs running in parallel
  const jobs = [
    { type: 'googlenews' as SourceType, run: fetchGoogleNews },
    { type: 'hackernews' as SourceType, run: fetchHackerNews },
    { type: 'reddit' as SourceType, run: fetchReddit },
    { type: 'bluesky' as SourceType, run: fetchBluesky },
    { type: 'twitter' as SourceType, run: fetchTwitter },
    { type: 'gemini' as SourceType, run: fetchGeminiNewsInsights } // Gemini Google Search Grounded feed
  ];

  const resultsList = await Promise.allSettled(
    jobs.map(async (job) => {
      try {
        const results = await job.run();
        const isHealthy = (results as any).healthy !== false;
        const errMsg = (results as any).error || null;
        return { type: job.type, results, success: true, healthy: isHealthy, error: errMsg };
      } catch (err: any) {
        return { type: job.type, results: [], success: false, healthy: false, error: err?.message || String(err) };
      }
    })
  );

  resultsList.forEach((settled, index) => {
    const job = jobs[index];
    if (settled.status === 'fulfilled' && settled.value.success) {
      const results = settled.value.results || [];
      const isHealthy = settled.value.healthy;
      const errorMsg = settled.value.error;
      
      healthRegistry[job.type] = {
        source: job.type,
        healthy: isHealthy,
        last_fetched: now,
        error: errorMsg || undefined,
        count: results.length
      };

      if (results.length > 0) {
        // Filter out any article older than 24 hours (freshness window)
        const freshResults = results.filter((item) => {
          if (!item.published_at) return true;
          const pubTime = new Date(item.published_at).getTime();
          return (nowTime - pubTime) < freshnessLimit;
        });

        // Sort by published timestamp, newest first
        freshResults.sort((a, b) => {
          const timeA = a.published_at ? new Date(a.published_at).getTime() : 0;
          const timeB = b.published_at ? new Date(b.published_at).getTime() : 0;
          return timeB - timeA;
        });

        freshResults.forEach((item) => {
          // Check if we already have this source ID or URL in storage
          const existing = stories.find(
            (s) => s.source_id === item.source_id || (s.url && item.url && s.url === item.url && s.source_type === item.source_type)
          );

          if (existing) {
            // Update stats
            existing.score = Math.max(existing.score, item.score || 0);
            existing.comments_count = Math.max(existing.comments_count, item.comments_count || 0);
            existing.last_updated_at = now;
            if (item.published_at) existing.published_at = item.published_at;
            if (item.upvote_ratio !== undefined) existing.upvote_ratio = item.upvote_ratio;
          } else {
            // Insert new story
            const newStory: Story = {
              id: Math.random().toString(36).substring(2, 15),
              title: item.title || '',
              url: item.url || null,
              description: item.description || null,
              source_name: item.source_name || '',
              source_type: item.source_type || job.type,
              source_url: item.source_url || '',
              source_id: item.source_id || `fetch-${Math.random().toString(36).substring(2, 10)}`,
              score: item.score || 0,
              comments_count: item.comments_count || 0,
              upvote_ratio: item.upvote_ratio || 1.0,
              author: item.author || null,
              thumbnail_url: item.thumbnail_url || null,
              first_seen_at: now,
              last_updated_at: now,
              published_at: item.published_at || now,
              velocity_score: 0,
              growth_rate: 0,
              is_breaking: false,
              keywords: item.keywords || [],
              cross_platform_count: 1,
              platform_data: {},
              history: [{ timestamp: now, velocity_score: 0 }]
            };
            stories.push(newStory);
          }
        });
      }
    } else {
      const err = settled.status === 'fulfilled' ? settled.value.error : settled.reason;
      console.error(`Fetch failure on source [${job.type}]:`, err);
      healthRegistry[job.type] = {
        source: job.type,
        healthy: false,
        last_fetched: healthRegistry[job.type]?.last_fetched || null,
        error: String(err?.message || err),
        count: 0
      };
    }
  });

  // Run cleanup: Keep only the latest 200 stories to prevent database bloatedness (zero cost bounds!)
  cleanupOldStories();

  // Deduplicate, link groups, calculate scores
  runDeduplicationAndGrouping();

  // Save changes
  saveDb();
  
  // Broadcast general update event
  broadcastSseEvent('feed_update', { timestamp: now });
  console.log('Global fetch cycle completed.');
}

/**
 * Remove items > 24 hours old or limit size to 250 items to run in free constraints safely
 */
export function cleanupOldStories() {
  const now = new Date();
  const limitTime = 24 * 60 * 60 * 1000; // 24 hours

  // Strictly filter out any stories older than 24 hours window to prevent stale headlines resurfacing
  stories = stories.filter((story) => {
    const publishedTime = story.published_at ? new Date(story.published_at).getTime() : new Date(story.first_seen_at).getTime();
    const age = now.getTime() - publishedTime;
    return age < limitTime;
  });

  // Keep total count at 250 max
  if (stories.length > 250) {
    stories.sort((a, b) => b.velocity_score - a.velocity_score);
    stories = stories.slice(0, 250);
  }
}

/**
 * Query active dashboard feeds
 * It aggregates story groups so we don't display duplicates twice!
 * The query returns the "canonical leader" story, decorated with group metrics
 */
export function queryStories(filters: {
  source?: string;
  sort?: string;
  breaking_only?: boolean;
  min_score?: number;
}): Story[] {
  let list = [...stories];

  // 1. Filter by breaking
  if (filters.breaking_only) {
    list = list.filter((s) => s.is_breaking);
  }

  // 2. Filter by source
  if (filters.source && filters.source !== 'all') {
    if (filters.source === 'cross_platform') {
      list = list.filter((s) => s.cross_platform_count >= 2);
    } else {
      list = list.filter((s) => s.source_type === filters.source);
    }
  }

  // 3. Filter by min score
  if (filters.min_score) {
    list = list.filter((s) => s.score >= (filters.min_score || 0));
  }

  // Group deduplication for the main feed view
  const canonicalStories: Story[] = [];
  const handledGroupIds = new Set<string>();

  // Sort list temporarily by velocity score to find the strongest representative
  const sortedByStrength = [...list].sort((a, b) => b.velocity_score - a.velocity_score);

  for (const story of sortedByStrength) {
    const group = storyGroups.find((g) => g.story_ids.includes(story.id));
    if (group) {
      if (handledGroupIds.has(group.id)) continue;
      handledGroupIds.add(group.id);
      
      // Let's use this story as the canonical representative
      canonicalStories.push(story);
    } else {
      canonicalStories.push(story);
    }
  }

  // Sort canonical list based on requested scheme
  if (filters.sort === 'recent') {
    canonicalStories.sort((a, b) => {
      const timeA = a.published_at ? new Date(a.published_at).getTime() : new Date(a.first_seen_at).getTime();
      const timeB = b.published_at ? new Date(b.published_at).getTime() : new Date(b.first_seen_at).getTime();
      return timeB - timeA;
    });
  } else if (filters.sort === 'score') {
    canonicalStories.sort((a, b) => b.score - a.score);
  } else {
    // Default is Velocity Score descending
    canonicalStories.sort((a, b) => b.velocity_score - a.velocity_score);
  }

  return canonicalStories;
}

/**
 * Get single story, combining group items as related links
 */
export function getStoryDetail(id: string): (Story & { related?: Story[] }) | null {
  const story = stories.find((s) => s.id === id);
  if (!story) return null;

  const group = storyGroups.find((g) => g.story_ids.includes(story.id));
  if (group) {
    const related = stories.filter((s) => group.story_ids.includes(s.id) && s.id !== story.id);
    return {
      ...story,
      related
    };
  }

  return { ...story, related: [] };
}

/**
 * Search last 7 days
 */
export function searchStories(query: string): Story[] {
  if (!query) return [];
  const cleanQuery = query.toLowerCase().trim();

  // Returns matching records
  return stories.filter((story) => {
    return (
      story.title.toLowerCase().includes(cleanQuery) ||
      (story.description && story.description.toLowerCase().includes(cleanQuery)) ||
      story.keywords.some((kw) => kw.includes(cleanQuery)) ||
      story.source_name.toLowerCase().includes(cleanQuery)
    );
  });
}

/**
 * Fetch stats
 */
export function getDashboardStats(): DashboardStats {
  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - (10 * 60 * 1000));
  const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));

  const breakingCount = stories.filter((s) => s.is_breaking).length;
  const recentStories = stories.filter((s) => new Date(s.first_seen_at) >= oneHourAgo).length;

  const activeSources = Array.from(new Set(stories.map((s) => s.source_type)));

  return {
    breakingCount,
    storiesPerHour: recentStories,
    totalStories: stories.length,
    activeSources,
    lastUpdate: new Date().toISOString()
  };
}

/**
 * Health statistics
 */
export function getSourcesHealth(): SourceHealth[] {
  return Object.values(healthRegistry);
}

/**
 * SSE real-time streaming management
 */
export function registerSseClient(res: any) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  res.write('data: {"connected": true}\n\n');
  sseClients.push(res);

  // Send baseline health
  res.write(`event: health_status\ndata: ${JSON.stringify(getSourcesHealth())}\n\n`);

  console.log(`SSE Client connected. Total active clients: ${sseClients.length}`);
}

export function unregisterSseClient(res: any) {
  const index = sseClients.indexOf(res);
  if (index !== -1) {
    sseClients.splice(index, 1);
  }
  console.log(`SSE Client disconnected. Total active clients: ${sseClients.length}`);
}

export function broadcastSseEvent(event: string, data: any) {
  sseClients.forEach((client) => {
    client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  });
}
