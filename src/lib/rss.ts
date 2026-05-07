/**
 * RSS feed loader. Runs at build time. Fetches the Anchor/Spotify-for-Creators
 * feed, parses it, and returns a normalized list of episodes for use in pages.
 *
 * Defensive by design — Anchor's feed is largely standard RSS 2.0 with the
 * iTunes namespace, but individual episodes can be missing fields. Anything
 * we can't read becomes an empty/sensible default rather than a build error.
 */

import { XMLParser } from 'fast-xml-parser';
import sanitizeHtml from 'sanitize-html';
import { site } from '~/config/site';

export interface Episode {
  /** URL-safe slug derived from the title, used for /episodes/[slug] routes */
  slug: string;
  /** Episode title, plain text */
  title: string;
  /** ISO date string (publication date) */
  pubDate: string;
  /** Pre-formatted human date, e.g. "March 8, 2026" */
  pubDateFormatted: string;
  /** Sanitized HTML show notes, safe to render */
  descriptionHtml: string;
  /** Plain-text version of show notes for previews and meta tags */
  descriptionText: string;
  /** Short excerpt suitable for cards (~ 200 chars) */
  excerpt: string;
  /** Episode artwork URL, falls back to show artwork */
  imageUrl: string;
  /** Audio enclosure URL — present on Anchor feeds */
  audioUrl: string;
  /** Audio duration, formatted like "32:14" or "1:05:23" */
  duration: string;
  /** iTunes episode number, if present */
  episodeNumber: number | null;
  /** iTunes season number, if present */
  seasonNumber: number | null;
  /** Original GUID from the RSS feed */
  guid: string;
  /** Spotify-for-Creators episode page link, when available */
  link: string;
}

export interface PodcastFeed {
  title: string;
  description: string;
  imageUrl: string;
  episodes: Episode[];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  // CDATA fields like <description><![CDATA[...]]></description> need to keep their content
  cdataPropName: '__cdata',
  // Keep arrays predictable: <item> can be 1 or many; force array
  isArray: (name) => name === 'item',
  // Don't auto-convert numeric-looking strings; we'll cast explicitly where needed
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
});

function pickText(node: unknown): string {
  if (node == null) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number' || typeof node === 'boolean') return String(node);
  if (typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    if (typeof obj['__cdata'] === 'string') return obj['__cdata'] as string;
    if (typeof obj['#text'] === 'string') return obj['#text'] as string;
  }
  return '';
}

function pickAttr(node: unknown, attr: string): string {
  if (node && typeof node === 'object') {
    const v = (node as Record<string, unknown>)[`@_${attr}`];
    if (typeof v === 'string') return v;
  }
  return '';
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.valueOf())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDuration(raw: string): string {
  if (!raw) return '';
  // iTunes duration may be seconds ("1234") or "HH:MM:SS" / "MM:SS"
  if (raw.includes(':')) return raw;
  const total = parseInt(raw, 10);
  if (!Number.isFinite(total) || total <= 0) return '';
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mm = minutes.toString().padStart(hours > 0 ? 2 : 1, '0');
  const ss = seconds.toString().padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

function htmlToText(html: string): string {
  // Strip tags + collapse whitespace for previews / meta tags
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function makeExcerpt(text: string, maxLen = 200): string {
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 100 ? cut.slice(0, lastSpace) : cut).trim() + '…';
}

function uniqueSlug(base: string, used: Set<string>): string {
  let slug = base || 'episode';
  let i = 2;
  while (used.has(slug)) {
    slug = `${base}-${i}`;
    i++;
  }
  used.add(slug);
  return slug;
}

export async function loadFeed(): Promise<PodcastFeed> {
  const url = site.rssFeedUrl;
  const res = await fetch(url, {
    headers: {
      // Anchor occasionally returns short bodies for default UAs; identify ourselves.
      'User-Agent': 'ResonantLifeSiteBuilder/1.0 (+https://www.resonantlife.net)',
      Accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.5',
    },
  });
  if (!res.ok) {
    throw new Error(`RSS fetch failed: ${res.status} ${res.statusText}`);
  }
  const xml = await res.text();
  const parsed = parser.parse(xml) as Record<string, unknown>;
  const channelRaw = (parsed.rss as Record<string, unknown> | undefined)?.channel;
  if (!channelRaw || typeof channelRaw !== 'object') {
    throw new Error('RSS feed missing <channel> element');
  }
  const channel = channelRaw as Record<string, unknown>;

  const showTitle = pickText(channel.title);
  const showDescription = pickText(channel.description);
  const channelImageUrl =
    pickAttr(channel['itunes:image'], 'href') ||
    pickText((channel.image as Record<string, unknown> | undefined)?.url) ||
    '';

  const items = Array.isArray(channel.item) ? (channel.item as Record<string, unknown>[]) : [];
  const usedSlugs = new Set<string>();

  const episodes: Episode[] = items
    .map((item): Episode | null => {
      const title = pickText(item.title);
      if (!title) return null;

      const link = pickText(item.link);
      const guid = pickText(item.guid) || link || title;
      const pubDateRaw = pickText(item.pubDate);
      const pubDateIso = pubDateRaw ? new Date(pubDateRaw).toISOString() : '';

      // Description: prefer content:encoded (full HTML) over description (often HTML too)
      const rawHtml =
        pickText(item['content:encoded']) ||
        pickText(item.description) ||
        pickText(item['itunes:summary']) ||
        '';

      const descriptionHtml = sanitizeHtml(rawHtml, {
        allowedTags: [
          'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'a',
          'ul', 'ol', 'li', 'blockquote',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'code', 'pre',
        ],
        allowedAttributes: {
          a: ['href', 'title', 'rel', 'target'],
        },
        transformTags: {
          a: (tagName, attribs) => ({
            tagName,
            attribs: {
              ...attribs,
              rel: 'noopener noreferrer',
              target: '_blank',
            },
          }),
        },
      });

      const descriptionText = htmlToText(descriptionHtml);
      const excerpt = makeExcerpt(descriptionText);

      // Episode artwork via <itunes:image href="..."/> falls back to show art
      const imageUrl = pickAttr(item['itunes:image'], 'href') || channelImageUrl;

      // <enclosure url="..." length="..." type="audio/mpeg"/>
      const audioUrl = pickAttr(item.enclosure, 'url');

      const duration = formatDuration(pickText(item['itunes:duration']));
      const episodeNumber = (() => {
        const v = parseInt(pickText(item['itunes:episode']), 10);
        return Number.isFinite(v) ? v : null;
      })();
      const seasonNumber = (() => {
        const v = parseInt(pickText(item['itunes:season']), 10);
        return Number.isFinite(v) ? v : null;
      })();

      const baseSlug = slugify(title);
      const slug = uniqueSlug(baseSlug, usedSlugs);

      return {
        slug,
        title,
        pubDate: pubDateIso,
        pubDateFormatted: formatDate(pubDateIso),
        descriptionHtml,
        descriptionText,
        excerpt,
        imageUrl,
        audioUrl,
        duration,
        episodeNumber,
        seasonNumber,
        guid,
        link,
      };
    })
    .filter((e): e is Episode => e !== null)
    // Newest first
    .sort((a, b) => (a.pubDate < b.pubDate ? 1 : -1));

  return {
    title: showTitle,
    description: showDescription,
    imageUrl: channelImageUrl,
    episodes,
  };
}

/** Cached singleton across pages in a single build. */
let cached: Promise<PodcastFeed> | null = null;
export function getFeed(): Promise<PodcastFeed> {
  if (!cached) cached = loadFeed();
  return cached;
}
