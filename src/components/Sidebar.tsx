import Link from 'next/link';
import { usePathname } from 'next/navigation';

function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Overview' },
    { href: '/documents/1', label: 'Documents' },
    { href: '/activity', label: 'Activity' },
    { href: '/settings', label: 'Settings' },
  ];

  return (
    <aside className="hidden md:flex w-60 min-h-[calc(100vh-4rem)] flex-col border-r border-white/10 bg-[#0B0D0F] p-6">
      <nav className="space-y-1">
        {navItems.map(({ href, label }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={`block px-3 py-2 text-sm transition ${
                isActive ? 'bg-white text-black' : 'text-white/45 hover:text-white'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-10">
        <p className="px-3 text-[10px] tracking-[0.2em] text-white/25">PROJECTS</p>

        <div className="mt-3 space-y-1">
          <button className="w-full text-left px-3 py-2 text-sm text-white/45 hover:text-white transition">
            Project A
          </button>

          <button className="w-full text-left px-3 py-2 text-sm text-white/45 hover:text-white transition">
            Project B
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;