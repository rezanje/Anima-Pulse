import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isCloudMode } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  
  if (!isCloudMode()) {
    // Local / Dev mode simulation: redirect immediately to callback with mock code
    const redirectUrl = new URL('/api/v1/auth/callback', url.origin);
    redirectUrl.searchParams.set('code', 'mock_google_oauth_code');
    return NextResponse.redirect(redirectUrl.toString());
  }

  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const redirectUrl = new URL('/api/v1/auth/callback', url.origin);
  const companyDomain = process.env.COMPANY_DOMAIN || process.env.NEXT_PUBLIC_COMPANY_DOMAIN || 'gmail.com';

  const queryParams: any = {
    prompt: 'select_account',
  };

  if (companyDomain.toLowerCase() !== 'gmail.com') {
    queryParams.hd = companyDomain;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl.toString(),
      queryParams,
      flowType: 'pkce',
    } as any,
  });

  if (error || !data?.url) {
    console.error('Supabase OAuth initialization failed:', error);
    const loginUrl = new URL('/login', url.origin);
    loginUrl.searchParams.set('error', 'oauth_init_failed');
    return NextResponse.redirect(loginUrl.toString());
  }

  return NextResponse.redirect(data.url);
}
