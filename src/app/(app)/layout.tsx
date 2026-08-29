// ============================================================
// App Layout — Main application shell with sidebar
// ============================================================

// TODO: Wrap with auth guard — redirect to /login if unauthenticated

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

