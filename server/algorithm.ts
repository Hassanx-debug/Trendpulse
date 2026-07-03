/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Story } from '../src/types';

/**
 * Calculates Levenshtein Distance between two strings to measure edit distance.
 */
export function levenshteinDistance(a: string, b: string): number {
  const tmp = [];
  let i, j;
  const alen = a.length;
  const blen = b.length;

  if (alen === 0) return blen;
  if (blen === 0) return alen;

  for (i = 0; i <= alen; i++) tmp[i] = [i];
  for (j = 0; j <= blen; j++) tmp[0][j] = j;

  for (i = 1; i <= alen; i++) {
    for (j = 1; j <= blen; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }

  return tmp[alen][blen];
}

/**
 * Calculates string similarity between 0 and 1.
 */
export function stringSimilarity(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (s1 === s2) return 1.0;
  
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  if (maxLength === 0) return 1.0;
  return 1.0 - distance / maxLength;
}

/**
 * Basic stop words to filter out during keyword extraction.
 */
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'cant', 'cannot', 'could',
  'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down', 'during', 'each', 'few', 'for', 'from', 'further',
  'had', 'hadnt', 'has', 'hasnt', 'have', 'havent', 'having', 'he', 'hed', 'hell', 'hes', 'her', 'here', 'heres',
  'hers', 'herself', 'him', 'himself', 'his', 'how', 'hows', 'i', 'id', 'ill', 'im', 'ive', 'if', 'in', 'into',
  'is', 'isnt', 'it', 'its', 'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor', 'not',
  'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such', 'than', 'that',
  'thats', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres', 'these', 'they', 'theyd',
  'theyll', 'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was',
  'wasnt', 'we', 'wed', 'well', 'were', 'weve', 'werent', 'what', 'whats', 'when', 'whens', 'where', 'wheres',
  'which', 'while', 'who', 'whos', 'whom', 'why', 'whys', 'with', 'wont', 'would', 'wouldnt', 'you', 'youd',
  'youll', 'youre', 'youve', 'your', 'yours', 'yourself', 'yourselves'
]);

/**
 * Simple keyword extraction algorithm.
 */
export function extractKeywords(title: string): string[] {
  const cleaned = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // remove punctuation
    .split(/[\s_]+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
  
  // Return unique keywords
  return Array.from(new Set(cleaned));
}

/**
 * Calculates the Velocity Score for a story.
 * Formula: Velocity Score = (Engagement × Recency Factor) + (Cross-Platform Mentions × 10) + (Growth Rate × 5)
 */
export function calculateVelocityScore(story: {
  score: number;
  comments_count: number;
  first_seen_at: string;
  cross_platform_count: number;
  growth_rate: number;
}): number {
  const now = new Date();
  const firstSeen = new Date(story.first_seen_at);
  const ageInMinutes = Math.max(1, (now.getTime() - firstSeen.getTime()) / (1000 * 60));

  // Engagement = Upvotes + Comments (Standard metrics)
  const engagement = story.score + (story.comments_count * 1.5);

  // Recency Factor: <30 min old = 3x, <60 min = 2x, <2 hr = 1x, >2hr decays
  let recencyFactor = 1.0;
  if (ageInMinutes < 30) {
    recencyFactor = 3.0;
  } else if (ageInMinutes < 60) {
    recencyFactor = 2.0;
  } else if (ageInMinutes < 120) {
    recencyFactor = 1.0;
  } else {
    // Gradual decay after 2 hours to keep feed fresh
    recencyFactor = Math.max(0.1, 120 / ageInMinutes);
  }

  // Cross-Platform Bonus
  const crossPlatformBonus = (story.cross_platform_count - 1) * 10;

  // Growth Rate Bonus (Growth Rate is score increase rate per hour)
  const growthBonus = story.growth_rate * 5;

  const rawVelocity = (engagement * recencyFactor) + crossPlatformBonus + growthBonus;
  
  // Return rounded to 1 decimal place
  return Math.round(rawVelocity * 10) / 10;
}
