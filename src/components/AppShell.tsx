import type { ReactNode } from "react";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";

interface AppShellProps {
  children: ReactNode;
}

function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#0B0D0F] text-[#F5F5F3]">

      {/* TOP BAR */}
      <TopBar />

      {/* SIDEBAR + CONTENT */}
      <div className="flex">

        <Sidebar />

        <main className="flex-1 min-w-0">
          {children}
        </main>

      </div>

    </div>
  );
}

export default AppShell;