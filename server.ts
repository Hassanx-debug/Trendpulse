/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { 
  initDb, 
  queryStories, 
  getStoryDetail, 
  searchStories, 
  getDashboardStats, 
  getSourcesHealth, 
  executeFetchAll,
  registerSseClient,
  unregisterSseClient,
  runDeduplicationAndGrouping,
  saveDb
} from './server/db';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Initialize database
initDb();

// Body parser
app.use(express.json());

// API: List paginated stories
app.get('/api/stories', (req, res) => {
  try {
    const source = req.query.source as string;
    const sort = req.query.sort as string;
    const breaking_only = req.query.breaking_only === 'true';
    const min_score = req.query.min_score ? parseInt(req.query.min_score as string, 10) : undefined;

    const results = queryStories({ source, sort, breaking_only, min_score });
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal database error' });
  }
});

// API: Single story details
app.get('/api/stories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const story = getStoryDetail(id);
    if (!story) {
      res.status(404).json({ error: 'Story not found' });
      return;
    }
    res.json(story);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal database error' });
  }
});

// API: Related story groups
app.get('/api/stories/:id/related', (req, res) => {
  try {
    const { id } = req.params;
    const story = getStoryDetail(id);
    if (!story) {
      res.status(404).json({ error: 'Story not found' });
      return;
    }
    res.json(story.related || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal database error' });
  }
});

// API: Dashboard stats
app.get('/api/stats', (req, res) => {
  try {
    const stats = getDashboardStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal stats error' });
  }
});

// API: Search
app.get('/api/search', (req, res) => {
  try {
    const q = (req.query.q as string) || '';
    const results = searchStories(q);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal search error' });
  }
});

// API: Sources health check
app.get('/api/sources/health', (req, res) => {
  try {
    const health = getSourcesHealth();
    res.json(health);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal health check error' });
  }
});

// API: Real-time Server-Sent Events (SSE) route
app.get('/api/realtime', (req, res) => {
  registerSseClient(res);

  req.on('close', () => {
    unregisterSseClient(res);
  });
});

// CRON: Run combined fetcher
app.get('/api/cron/fetch-all', async (req, res) => {
  try {
    // Basic protection (can accept auth/secret header or query param if required)
    await executeFetchAll();
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Cron execution failed' });
  }
});

// Individual crons as specified by routing
app.get('/api/cron/fetch-reddit', async (req, res) => {
  try {
    await executeFetchAll(); // For simplify/robustness, call the grouped manager
    res.json({ success: true, channel: 'reddit' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cron/fetch-hackernews', async (req, res) => {
  try {
    await executeFetchAll();
    res.json({ success: true, channel: 'hackernews' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cron/fetch-twitter', async (req, res) => {
  try {
    await executeFetchAll();
    res.json({ success: true, channel: 'twitter' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cron/fetch-googlenews', async (req, res) => {
  try {
    await executeFetchAll();
    res.json({ success: true, channel: 'googlenews' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cron/fetch-bluesky', async (req, res) => {
  try {
    await executeFetchAll();
    res.json({ success: true, channel: 'bluesky' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cron/cleanup', (req, res) => {
  try {
    runDeduplicationAndGrouping();
    saveDb();
    res.json({ success: true, message: 'Database groups re-synchronized.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Setup dev vs production servers
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);

    // Development auto-fetch routine to make the dashboard feel active:
    // Every 5 minutes, we fetch all active external endpoints
    console.log('Spawning background data-intelligence fetch loop (5-minute intervals)...');
    setInterval(() => {
      executeFetchAll().catch((err) => console.error('Background fetch failure:', err));
    }, 5 * 60 * 1000);
    
    // Run an initial quick fetch in the background as well
    setTimeout(() => {
      executeFetchAll().catch((err) => console.error('Initial background fetch failure:', err));
    }, 5000);

  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TrendPulse intelligence engine online on http://localhost:${PORT}`);
  });
}

start();
