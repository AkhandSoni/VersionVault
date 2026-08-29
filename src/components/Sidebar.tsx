import { NavLink } from "react-router-dom";

function Sidebar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-2 text-sm transition ${
      isActive
        ? "bg-white text-black"
        : "text-white/45 hover:text-white"
    }`;

  return (
    <aside className="hidden md:flex w-60 min-h-[calc(100vh-4rem)] flex-col border-r border-white/10 bg-[#0B0D0F] p-6">

      {/* NAVIGATION */}
      <nav className="space-y-1">

        <NavLink to="/dashboard" className={linkClass}>
          Overview
        </NavLink>

        <NavLink
          to="/documents/1"
          className={linkClass}
        >
          Documents
        </NavLink>

        <NavLink to="/activity" className={linkClass}>
          Activity
        </NavLink>

      </nav>


      {/* PROJECTS */}
      <div className="mt-10">

        <p className="px-3 text-[10px] tracking-[0.2em] text-white/25">
          PROJECTS
        </p>

        <div className="mt-3 space-y-1">

          <button className="w-full text-left px-3 py-2 text-sm text-white/45 hover:text-white transition">
            Project A
          </button>

          <button className="w-full text-left px-3 py-2 text-sm text-white/45 hover:text-white transition">
            Project B
          </button>

        </div>

      </div>


      {/* SETTINGS */}
      <div className="mt-auto pt-10">

        <NavLink to="/settings" className={linkClass}>
          Settings
        </NavLink>

      </div>

    </aside>
  );
}

export default Sidebar;