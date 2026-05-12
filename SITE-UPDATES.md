# Site Update Workflows

A reference guide for the most common updates to the A Resonant Life site.

---

## Adding a Transcript

Transcripts live at `/episodes/[slug]/transcript` and are linked automatically from the episode page once processed.

**1. Prepare your script file**

Name the file after the episode slug — the same slug used in the episode URL.

For example, if the episode URL is:
```
/episodes/fafo-and-the-compassion-muscle
```
Name the file:
```
fafo-and-the-compassion-muscle.txt
```

**2. Drop it into the raw folder**

```
transcripts/raw/fafo-and-the-compassion-muscle.txt
```

> Note: `.txt` files in `transcripts/raw/` are excluded from Git — they stay local only. The processed output in `src/content/transcripts/` is what gets committed.

**3. Run the processor**

```bash
npm run transcript
```

You should see:
```
✓  fafo-and-the-compassion-muscle.txt  →  src/content/transcripts/fafo-and-the-compassion-muscle.md
Done. Commit src/content/transcripts/ and push to deploy.
```

**4. Commit and push**

```bash
git add src/content/transcripts/
git commit -m "Add transcript: fafo-and-the-compassion-muscle"
git push
```

Cloudflare deploys in ~90 seconds. The episode page will now show a **Read transcript →** link automatically.

---

## Adding Pull Quotes

Pull quotes rotate randomly on the homepage. They're stored in a single JSON file.

**Open the quotes file:**
```
src/data/quotes.json
```

**Add a new entry:**
```json
{
  "text": "Your pull quote here — a standalone insight that lands without context.",
  "episode": "Episode Title Here",
  "slug": "episode-slug-here"
}
```

**Full example:**
```json
[
  {
    "text": "Self-criticism has no value whatsoever. Beating up oneself for a mistake is not the path toward positive change.",
    "episode": "FAFO and the Compassion Muscle",
    "slug": "fafo-and-the-compassion-muscle"
  },
  {
    "text": "Your new quote here.",
    "episode": "Episode Title",
    "slug": "episode-slug"
  }
]
```

**Tips for good pull quotes:**
- Should make sense without any context
- Specific and concrete beats vague and inspirational
- One clear idea per quote
- Aim for 1–3 sentences

**Commit and push:**
```bash
git add src/data/quotes.json
git commit -m "Add pull quote: [episode title]"
git push
```

---

## Finding an Episode Slug

The slug is the last part of any episode URL on the site. For example:

```
/episodes/fafo-and-the-compassion-muscle
          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
          this is the slug
```

Use this exact string for both transcript filenames and pull quote entries.

---

## General Push Workflow

```bash
# 1. Make your changes
# 2. Stage and commit
git add .
git commit -m "Brief description of what changed"

# 3. Push — Cloudflare auto-deploys in ~90 seconds
git push
```

Check the live preview at: **https://preview.resonantlife.net**
