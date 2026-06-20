import { z } from 'zod';

export const contentPlanSchema = z.object({
  deadline: z.string().min(1, 'Deadline wajib diisi'),
  funnel: z.string().min(1, 'Funnel wajib diisi'),
  category: z.string().min(1, 'Category wajib diisi'),
  tanggalUpload: z.string().min(1, 'Tanggal upload wajib diisi'),
  formatKonten: z.string().min(1, 'Format konten wajib diisi'),
  platform: z.string().min(1, 'Platform wajib diisi'),
  ideKonten: z.string().min(1, 'Ide konten wajib diisi').max(280, 'Ide konten terlalu panjang (max 280 karakter)'),
  hook: z.string().optional().nullable(),
  brief: z.string().optional().nullable(),
  caption: z.string().optional().nullable(),
  referensi: z.string().optional().nullable(),
  progress: z.string().min(1, 'Progress wajib diisi'),
  result: z.string().optional().nullable(),
  feedback: z.string().optional().nullable(),
  revision: z.string().optional().nullable(),
  approval: z.boolean().default(false),
});

export const contentPlanEditSchema = contentPlanSchema.partial();

export type ContentPlanInput = z.infer<typeof contentPlanSchema>;
