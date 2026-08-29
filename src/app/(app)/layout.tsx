// ============================================================
// App Layout — Main application shell with sidebar
// ============================================================

// TODO: Wrap with auth guard — redirect to /login if unauthenticated

import { AppShell } from '@/components/layout/AppShell';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
