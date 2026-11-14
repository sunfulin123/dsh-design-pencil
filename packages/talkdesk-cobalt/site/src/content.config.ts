import {defineCollection} from 'astro:content';
import {glob} from 'astro/loaders';
export const collections={reference:defineCollection({loader:glob({pattern:'**/*.{md,mdx}',base:'./generated'})})};
