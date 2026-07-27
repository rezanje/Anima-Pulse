import { z } from 'zod';

export const FEEDBACK_TYPES = ['bug', 'saran', 'pertanyaan'] as const;
export const FEEDBACK_URGENCIES = ['rendah', 'sedang', 'tinggi'] as const;
export const FEEDBACK_STATUSES = ['baru', 'diproses', 'selesai', 'ditolak'] as const;

export const feedbackSchema = z.object({
  type: z.enum(FEEDBACK_TYPES, { errorMap: () => ({ message: 'Tipe laporan tidak valid' }) }),
  urgency: z.enum(FEEDBACK_URGENCIES, { errorMap: () => ({ message: 'Urgensi tidak valid' }) }),
  description: z.string().trim().min(10, 'Ceritakan minimal 10 karakter').max(2000, 'Maksimal 2000 karakter'),
  // captured from the page behind the drawer, not typed by the reporter
  page: z.string().max(200).optional().default(''),
});

export const feedbackStatusSchema = z.object({
  status: z.enum(FEEDBACK_STATUSES, { errorMap: () => ({ message: 'Status tidak valid' }) }),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
