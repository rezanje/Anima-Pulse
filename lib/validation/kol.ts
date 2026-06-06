import { z } from 'zod';

export const kolSchema = z.object({
  name: z.string().min(1, 'Nama wajib'),
  handle: z.string().min(2, 'Handle wajib').regex(/^@?[\w.\-]+$/, 'Handle tidak valid'),
  platform: z.enum(['tiktok', 'instagram']),
  niche: z.array(z.string()).default([]),
  followers: z.number().int().nonnegative(),
  avgViews: z.number().int().nonnegative().optional(),
  avgER: z.number().nonnegative().optional(),
  ratePerContent: z.number().nonnegative(),
  status: z.enum(['prospect', 'negotiating', 'active', 'blacklist']),
  contact: z.object({
    wa: z.string().default(''),
    email: z.string().email().or(z.literal('')).default(''),
  }),
  notes: z.string().optional(),
});

export const kolEditSchema = kolSchema.partial().extend({
  contact: kolSchema.shape.contact.optional(),
});

export const growthSchema = z.object({
  followers: z.number().int().nonnegative(),
  date: z.string().regex(/^\d{4}-\d{2}$/, 'Format tanggal: YYYY-MM'),
});

export type KolInput = z.infer<typeof kolSchema>;
