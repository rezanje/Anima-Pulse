import { z } from 'zod';

export const patchSchema = z.object({
  id: z.string().min(1),
  role: z.enum(['staff', 'manager', 'admin', 'creator']).optional(),
  isActive: z.boolean().optional(),
  workLat: z.number().nullable().optional(),
  workLng: z.number().nullable().optional(),
  workRadius: z.number().nullable().optional(),
  loginCode: z.string().min(1).optional(),
});

export const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['staff', 'manager', 'admin', 'creator']),
  loginCode: z.string({ required_error: 'Kode PIN wajib diisi' }).min(1, 'Kode PIN wajib diisi'),
});
