import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { APP_URL } from '@/lib/config';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = new URL(requestUrl.searchParams.get('next') || '/dashboard', APP_URL);

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (data.user) {
      const serviceSupabase = await createServiceClient();
      const { data: existingMembership } = await serviceSupabase
        .from('memberships')
        .select('id')
        .eq('user_id', data.user.id)
        .limit(1)
        .maybeSingle();

      if (!existingMembership) {
        const email = data.user.email || 'Google user';
        const { data: tenant } = await serviceSupabase
          .from('tenants')
          .insert({ name: `${email.split('@')[0]}'s Workspace` })
          .select('id')
          .single();

        if (tenant) {
          await serviceSupabase.from('memberships').insert({
            user_id: data.user.id,
            tenant_id: tenant.id,
            role: 'OWNER',
          });
        }
      }
    }
  }

  return NextResponse.redirect(next);
}
