import { z } from 'zod';

const SOCIAL_URL = /^https?:\/\/(www\.)?(tiktok\.com|instagram\.com|vt\.tiktok\.com|instagr\.am)\/.+/i;

const submissionBase = z.object({
  url: z.string().url().regex(SOCIAL_URL, 'URL harus link TikTok atau Instagram'),
  platform: z.enum(['tiktok', 'instagram']),
  title: z.string().min(1, 'Judul wajib diisi').max(280),
  views: z.number().int().nonnegative(),
  likes: z.number().int().nonnegative(),
  comments: z.number().int().nonnegative(),
  shares: z.number().int().nonnegative(),
  followers: z.number().int().nonnegative(),
});

const noViewsContradiction = (d: { views: number; likes?: number; comments?: number; shares?: number }) =>
  !(d.views === 0 && ((d.likes ?? 0) > 0 || (d.comments ?? 0) > 0 || (d.shares ?? 0) > 0));

export const submissionSchema = submissionBase.refine(noViewsContradiction, {
  message: 'Views tidak boleh 0 jika ada likes/komentar/shares',
  path: ['views'],
});

export const submissionEditSchema = submissionBase.partial();

export type SubmissionInput = z.infer<typeof submissionSchema>;
