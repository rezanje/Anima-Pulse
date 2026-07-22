import { z } from 'zod';

const pillarBase = z.object({
  name: z.string().min(1, 'Nama pillar wajib diisi').max(80),
  description: z.string().min(1, 'Deskripsi wajib diisi').max(500),
  exampleAngle: z.string().max(500).optional(),
});

export const pillarSchema = pillarBase;
export const pillarEditSchema = pillarBase.partial().extend({
  isActive: z.boolean().optional(),
});

export type PillarInput = z.infer<typeof pillarSchema>;
