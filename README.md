# A Resonant Life — site

Source for [www.resonantlife.net](https://www.resonantlife.net).

Built with [Astro](https://astro.build), deployed on [Cloudflare Pages](https://pages.cloudflare.com), with form handling on a [Cloudflare Worker](https://workers.cloudflare.com). Pulls episode data from the show's RSS feed at build time.

## Project structure

```
resonant-life/
├── src/
│   ├── components/        Reusable UI pieces (Header, Footer, EpisodeCard, etc.)
│   ├── config/site.ts     ★ Where to edit titles, links, bio, palette mappings
│   ├── layouts/           Page wrappers
│   ├── lib/               RSS fetcher and platform link helpers
│   ├── pages/             One file per page (URL routing)
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── support.astro
│   │   ├── contact.astro
│   │   └── episodes/
│   │       ├── index.astro
│   │       └── [slug].astro
│   └── styles/global.css  Design tokens + base styles
├── public/
│   └── brand/             Logos and cover art (committed)
├── worker/                Cloudflare Worker for /api/* endpoints
└── .github/workflows/     Daily auto-rebuild
```

## Local development

```bash
npm install
npm run dev
```

Open <http://localhost:4321>.

The first page load will fetch the live RSS feed (a few seconds). Subsequent loads in the same dev session use the cached result.

## Editing content

| Want to change | Edit |
|---|---|
| Show title, tagline, description | `src/config/site.ts` |
| Listening platform links | `src/config/site.ts` (`listenLinks`) |
| Buy Me a Coffee / Ko-fi / Stripe URLs | `src/config/site.ts` (`supportLinks`) |
| Mike's bio | `src/config/site.ts` (`host.bioLong`) |
| Newsletter copy | `src/config/site.ts` (`newsletter`) |
| Social links | `src/config/site.ts` (`socialLinks`) |
| Colors / fonts | `src/styles/global.css` (top of file: design tokens) |
| Hero copy | `src/pages/index.astro` |

To publish a content change: commit and push. Cloudflare Pages picks up the push and redeploys (~30 seconds).

## Adding a new episode

You don't. Publish the episode on Anchor / Spotify for Creators as usual. The RSS feed updates, the daily GitHub Action triggers a rebuild, and the new episode appears on the site within 24 hours.

If you want it sooner: open the GitHub repo → Actions → "Daily site rebuild" → Run workflow. Or push any commit.

## Deployment — first-time setup

### 1. Push to GitHub

Create a new repo (private is fine) and push this folder.

### 2. Cloudflare Pages

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Select your repo.
3. Build settings:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/` (default)
4. **Save and deploy**.

The first deploy lands on a `*.pages.dev` URL (e.g. `resonant-life.pages.dev`).

### 3. Custom domains

In the Pages project → **Custom domains**:

- For the **preview**: add `preview.resonantlife.net`. This domain auto-configures DNS since the zone is already on Cloudflare.
- When you're ready to cut over: add `www.resonantlife.net` and `resonantlife.net`. Cloudflare handles the SSL cert and DNS.

When you cut DNS, Podpage's binding goes inactive immediately — visitors hit the new site within seconds (Cloudflare propagation is fast since the zone is already on Cloudflare).

### 4. The Worker (form handling)

```bash
cd worker
npm install
npx wrangler login    # opens browser, authorize once
npx wrangler secret put RESEND_API_KEY      # paste the key when prompted
npx wrangler secret put SUBSTACK_PUBLICATION # type: resonantlife
npx wrangler deploy
```

Then in the Cloudflare dashboard → Workers → `resonantlife-api` → **Settings** → **Triggers** → **Add Custom Domain** or **Add Route**:

- Route: `www.resonantlife.net/api/*` (zone: resonantlife.net)
- Route: `preview.resonantlife.net/api/*` (zone: resonantlife.net)

This makes the Worker handle `/api/subscribe` and `/api/contact` while Pages handles everything else.

#### Resend setup (for the contact form)

1. Sign up at [resend.com](https://resend.com) — free tier covers personal use.
2. Verify a sending domain (e.g. `resonant.social`). Resend will give you DNS records to add in Cloudflare.
3. Create an API key, paste into `wrangler secret put RESEND_API_KEY`.
4. Update `CONTACT_FROM_EMAIL` in `worker/wrangler.toml` to a verified address.

### 5. GitHub Actions auto-rebuild

1. In Cloudflare Pages → your project → **Settings** → **Builds & deployments** → **Deploy hooks** → create one named "Daily rebuild".
2. Copy the URL.
3. GitHub → repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
4. Name: `CF_PAGES_DEPLOY_HOOK`. Value: the URL.

The workflow runs daily at 06:00 UTC. You can also trigger it on-demand from the Actions tab.

## Cost

| Item | Cost |
|---|---|
| Cloudflare Pages | Free (unlimited bandwidth on personal projects) |
| Cloudflare Workers | Free (100k req/day; this site uses < 100/day) |
| Cloudflare Registrar (domain) | ~$10/year at cost |
| Resend (email) | Free for < 3k emails/month |
| GitHub Actions | Free for public repos; 2000 min/month for private |
| **Total** | **~$10/year** |

Vs. Podpage Elite at $300/year → annual savings ~$290.

## Philosophy / things to know

**The site is static.** Every page is pre-rendered HTML at build time. This means it's fast, cheap, and survives traffic spikes effortlessly. The downside: episode updates are not instant. Solution: the daily auto-rebuild, plus a manual rebuild button when you want immediate update.

**Deep-linking, not hosting.** Audio lives on Anchor/Spotify. Episode pages on this site display show notes and link out to listen on Apple, Spotify, and YouTube. The site is a hub, not a player.

**One-file content edits.** Almost everything is in `src/config/site.ts`. If you can't find the lever for something there, ask Claude to add it.
