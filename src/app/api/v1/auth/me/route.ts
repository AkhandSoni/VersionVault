import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth.service';
import { UnauthorizedError, toApiError } from '@/lib/errors';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const supabase = await createServiceClient();
    const { data: memberships } = await supabase
      .from('memberships')
      .select('id, tenant_id, role, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    const mappedMemberships = (memberships || []).map((membership) => ({
      id: membership.id,
      tenantId: membership.tenant_id,
      role: membership.role,
      createdAt: membership.created_at,
    }));

    return NextResponse.json({
      user,
      memberships: mappedMemberships,
      tenantId: mappedMemberships[0]?.tenantId ?? null,
    }, { status: 200 });
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json(
      { error: apiError.error, message: apiError.message },
      { status: apiError.statusCode },
    );
  }
}
