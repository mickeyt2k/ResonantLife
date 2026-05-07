/**
 * Site configuration — single source of truth for all content the
 * RSS feed doesn't provide. Edit this file and redeploy to update.
 */

export const site = {
  name: 'A Resonant Life',
  tagline: 'Buddhist wisdom meets daily life.',
  description:
    "A Resonant Life helps you turn struggle into strength and selflessness into lasting happiness — one actionable insight at a time. A Buddhist-centered life coaching podcast sharing experiences and insights on finding one's best path forward while uncovering one's authentic self.",
  url: 'https://www.resonantlife.net',
  // Anchor / Spotify for Creators RSS feed
  rssFeedUrl: 'https://anchor.fm/s/b77e8620/podcast/rss/',
  contactEmail: 'mike@resonant.social',
  // Where the contact form Worker forwards messages
  contactFormEndpoint: '/api/contact',
  newsletterFormEndpoint: '/api/subscribe',
};

export const host = {
  name: 'Mike Thompson',
  title: 'Reflector-in-Chief',
  // Bio carried over from the existing Podpage — easy to revise here later.
  bioShort:
    'Mike started The Time is Now Productions and A Resonant Life in order to build a community of people striving to make the world a happier place for all through Buddhist-centered altruistic actions.',
  bioLong: [
    'Mike started The Time is Now Productions and A Resonant Life in order to build a community of people striving to make the world a happier place for all through Buddhist-centered altruistic actions.',
    "Each episode is an experiment in turning practice into something practical — what does Buddhist wisdom actually look like when you're stuck in traffic, having a hard conversation, or trying to figure out what to do with your life?",
  ],
};

// =============================================================================
// CURATED "START HERE" EPISODE
// =============================================================================
// This is the episode the homepage's yellow "New here?" card points to.
//
// HOW TO CHANGE IT (via GitHub, no code editor needed):
//   1. Visit any episode you want to feature, e.g. on the live site:
//        https://www.resonantlife.net/episodes/fafo-and-the-compassion-muscle/
//   2. Copy the part of the URL between "/episodes/" and the trailing "/".
//      In the example above that's:  fafo-and-the-compassion-muscle
//   3. On GitHub, open this file (src/config/site.ts), click the pencil
//      icon to edit, and replace the value below.
//   4. Click "Commit changes". Cloudflare rebuilds the site in ~30 seconds.
//
// To go back to "always show the latest episode" behavior, set the value to:
//   episodeSlug: null,
// =============================================================================
export const startHere = {
  episodeSlug: null as string | null,
};

export const listenLinks = [
  {
    name: 'Apple Podcasts',
    url: 'https://podcasts.apple.com/us/podcast/id1648636011?mt=2&ls=1',
    primary: true,
  },
  {
    name: 'Spotify',
    url: 'https://open.spotify.com/show/4QjGSq8evGIkiKugmeh1Ld',
    primary: true,
  },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/@AResonantLife',
    primary: true,
  },
  {
    name: 'Castro',
    url: 'https://castro.fm/itunes/1648636011',
    primary: false,
  },
  {
    name: 'RSS',
    url: 'https://anchor.fm/s/b77e8620/podcast/rss/',
    primary: false,
  },
];

export const supportLinks = [
  {
    name: 'Buy Me a Coffee',
    url: 'https://buymeacoffee.com/resonantlife',
    blurb: 'One-time tips. The simplest way to say thanks.',
  },
  {
    name: 'Ko-fi',
    url: 'https://ko-fi.com/resonantlife',
    blurb: 'Tips and recurring support, with no platform fees.',
  },
  {
    name: 'Spotify Support',
    url: 'https://podcasters.spotify.com/pod/show/resonant-life/support',
    blurb: 'Support directly through Spotify.',
  },
];

export const socialLinks = [
  { name: 'YouTube', url: 'https://www.youtube.com/@AResonantLife' },
  { name: 'Instagram', url: 'https://www.instagram.com/mickeyt2k/' },
  { name: 'Facebook', url: 'https://www.facebook.com/mickeyt2k' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/mickeyt/' },
  { name: 'Substack', url: 'https://substack.com/@resonantlife' },
];

export const newsletter = {
  // Substack publication slug — the part before .substack.com.
  // For https://substack.com/@resonantlife, the publication is at
  // https://resonantlife.substack.com (verify and update if different).
  substackHandle: 'resonantlife',
  ctaTitle: "You'll always know first.",
  ctaBlurb:
    'Get a short note when a new episode comes out. No spam. Unsubscribe anytime.',
};

export const navigation = [
  { name: 'Episodes', href: '/episodes' },
  { name: 'About', href: '/about' },
  { name: 'Support', href: '/support' },
  { name: 'Contact', href: '/contact' },
];
