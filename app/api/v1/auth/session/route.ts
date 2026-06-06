import { ok, handle } from '@/lib/http';
import { getSession } from '@/lib/auth/session';
import { isCloudMode } from '@/lib/repo';

export async function GET() {
  return handle(async () => {
    const s = await getSession();
    return ok({ session: s, cloudMode: isCloudMode() });
  });
}
