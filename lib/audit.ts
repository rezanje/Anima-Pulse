// ============================================================
// Anima Pulse — audit trail helper (PRD §10.2)
// ============================================================
import { getRepo } from '@/lib/repo';

export async function recordAudit(input: {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress?: string | null;
}): Promise<void> {
  try {
    await getRepo().recordAudit(input);
  } catch {
    // never let audit failure break the primary write
  }
}
