import { z } from 'zod';

const SOCIAL_URL = /^https?:\/\/(www\.)?(tiktok\.com|instagram\.com|vt\.tiktok\.com|instagr\.am)\/.+/i;

export const vaultSchema = z.object({
  url: z.string().url().regex(SOCIAL_URL, 'URL harus link TikTok atau Instagram'),
  title: z.string().min(1, 'Judul/deskripsi wajib').max(280),
  platform: z.enum(['tiktok', 'instagram']),
  tags: z.array(z.string().min(1)).min(1, 'Pilih minimal 1 tag'),
  thumbnailUrl: z.string().url().optional().nullable(),
});

export type VaultInput = z.infer<typeof vaultSchema>;
