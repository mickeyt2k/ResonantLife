/**
 * Deep links from an episode to the major listening platforms.
 *
 * Strategy:
 *   - Spotify: the RSS feed includes a per-episode link to the Spotify web
 *     player; we use it directly when present.
 *   - Apple Podcasts: there's no per-episode URL exposed in the feed, so we
 *     send users to the show page on Apple Podcasts. Apple's player will
 *     surface recent episodes.
 *   - YouTube: same situation; we send users to the channel. (Using a search
 *     URL by title would work but is brittle — the channel link is reliable.)
 *
 * If you ever want true per-episode YouTube deep links we can keep a small
 * episode → YouTube URL map in src/config/episode-overrides.ts.
 */

import { listenLinks } from '~/config/site';
import type { Episode } from './rss';

const apple = listenLinks.find((l) => l.name === 'Apple Podcasts')?.url ?? '#';
const youtube = listenLinks.find((l) => l.name === 'YouTube')?.url ?? '#';
const spotify = listenLinks.find((l) => l.name === 'Spotify')?.url ?? '#';

export interface PlatformLink {
  name: 'Apple Podcasts' | 'Spotify' | 'YouTube';
  url: string;
  /** True if this links to the specific episode rather than the show */
  episodeSpecific: boolean;
}

export function getPlatformLinks(episode: Episode): PlatformLink[] {
  return [
    {
      name: 'Apple Podcasts',
      url: apple,
      episodeSpecific: false,
    },
    {
      name: 'Spotify',
      url: episode.link && episode.link.includes('spotify') ? episode.link : spotify,
      episodeSpecific: !!(episode.link && episode.link.includes('spotify')),
    },
    {
      name: 'YouTube',
      url: youtube,
      episodeSpecific: false,
    },
  ];
}
