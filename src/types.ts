/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SourceType = 'reddit' | 'hackernews' | 'twitter' | 'bluesky' | 'googlenews' | 'gemini';

export interface Story {
  id: string;
  title: string;
  url: string | null;
  description: string | null;
  source_name: string;
  source_type: SourceType;
  source_url: string;
  source_id: string | null;
  score: number;
  comments_count: number;
  upvote_ratio: number | null;
  author: string | null;
  thumbnail_url: string | null;
  first_seen_at: string;
  last_updated_at: string;
  published_at: string | null;
  velocity_score: number;
  growth_rate: number;
  is_breaking: boolean;
  keywords: string[];
  cross_platform_count: number;
  platform_data: Record<string, any>;
  history?: Array<{ timestamp: string; velocity_score: number }>; // For details/charts
}

export interface StoryGroup {
  id: string;
  canonical_title: string;
  canonical_url: string | null;
  story_ids: string[];
  created_at: string;
}

export interface DashboardStats {
  breakingCount: number;
  storiesPerHour: number;
  totalStories: number;
  activeSources: SourceType[];
  lastUpdate: string;
}

export interface SourceHealth {
  source: SourceType;
  healthy: boolean;
  last_fetched: string | null;
  error?: string;
  count?: number;
}
