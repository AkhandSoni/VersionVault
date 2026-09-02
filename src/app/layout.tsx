import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VersionVault',
  description:
    'VersionVault proves what changed in your documents before AI ever explains why it matters. Immutable versions, SHA-256 integrity, deterministic diff, and grounded AI explanations.',
  icons: {
    icon: '/versionvault-icon.svg',
    shortcut: '/versionvault-icon.svg',
    apple: '/versionvault-icon.svg',
  },
  keywords: [
    'version control',
    'document management',
    'audit trail',
    'immutable versions',
    'deterministic diff',
    'AI document analysis',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
