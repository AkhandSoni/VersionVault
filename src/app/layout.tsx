import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'VersionVault — Evidence-First Document Version Control',
  description:
    'VersionVault proves what changed in your documents before AI ever explains why it matters. Immutable versions, SHA-256 integrity, deterministic diff, and grounded AI explanations.',
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
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
