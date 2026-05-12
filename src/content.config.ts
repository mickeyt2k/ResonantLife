import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const transcripts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/transcripts' }),
  schema: z.object({
    episodeSlug: z.string(),
  }),
});

export const collections = { transcripts };
