function TopBar() {
  return (
    <header className="h-16 border-b border-white/10 bg-[#0B0D0F] px-8 flex items-center justify-between">

      {/* LOGO */}
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-white">
          VersionVault
        </h1>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-6">

        {/* SEARCH */}
        <input
          id="document-search"
          type="search"
          placeholder="Search documents..."
          aria-label="Search documents"
          className="w-64 bg-transparent border-b border-white/15
          px-1 py-2 text-sm text-white outline-none
          placeholder:text-white/30 focus:border-white/40"
        />

        {/* ACTIVITY */}
        <button
          className="text-sm text-white/50 hover:text-white transition"
        >
          Activity
        </button>

        {/* USER */}
        <button
          aria-label="User profile"
          className="h-8 w-8 rounded-full border border-white/15
          flex items-center justify-center text-xs text-white"
        >
          K
        </button>

      </div>

    </header>
  );
}

export default TopBar;