import AppShell from "../components/AppShell";
import { branches } from "../data/mockData";

function BranchPage() {
  return (
    <AppShell>
      <main className="min-h-[calc(100vh-4rem)] bg-[#0B0D0F] text-[#F5F5F3] p-6 md:p-8 lg:p-10">

        {/* HEADER */}
        <header className="border-b border-white/10 pb-7">
          <p className="text-[10px] tracking-[0.28em] text-white/30">
            VERSION CONTROL
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Branches
          </h1>

          <p className="mt-2 text-sm text-white/35">
            Manage document branches and independent version histories.
          </p>
        </header>


        {/* SUMMARY */}
        <section className="mt-8 grid grid-cols-1 sm:grid-cols-3 border border-white/10">

          <Stat
            label="TOTAL BRANCHES"
            value={String(branches.length)}
          />

          <Stat
            label="ACTIVE BRANCH"
            value="main"
          />

          <Stat
            label="LATEST VERSION"
            value={branches[0]?.version || "—"}
          />

        </section>


        {/* BRANCH LIST */}
        <section className="mt-8 border border-white/10">

          <div className="px-6 py-5 border-b border-white/10">
            <p className="text-[10px] tracking-[0.22em] text-white/30">
              ALL BRANCHES
            </p>
          </div>


          <div>
            {branches.map((branch, index) => (
              <BranchRow
                key={branch.id}
                name={branch.name}
                description={branch.description}
                version={branch.version}
                updated={branch.updatedAt}
                active={branch.name === "main"}
                last={index === branches.length - 1}
              />
            ))}
          </div>

        </section>


        {/* DETAILS */}
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* CURRENT BRANCH */}
          <div className="border border-white/10 p-6">

            <p className="text-[10px] tracking-[0.22em] text-white/30">
              CURRENT BRANCH
            </p>

            <h2 className="mt-4 text-2xl font-semibold">
              {branches[0]?.name || "main"}
            </h2>

            <p className="mt-2 text-sm text-white/35">
              {branches[0]?.description || "Primary document history"}
            </p>

            <div className="mt-8 space-y-5">

              <InfoRow
                label="CURRENT VERSION"
                value={branches[0]?.version || "—"}
              />

              <InfoRow
                label="LAST UPDATED"
                value={branches[0]?.updatedAt || "—"}
              />

              <InfoRow
                label="STATUS"
                value="ACTIVE"
              />

            </div>

          </div>


          {/* BRANCH ACTIVITY */}
          <div className="border border-white/10 p-6">

            <p className="text-[10px] tracking-[0.22em] text-white/30">
              BRANCH OVERVIEW
            </p>

            <div className="mt-7 space-y-6">

              {branches.map((branch) => (
                <div key={branch.id}>

                  <div className="flex items-center justify-between gap-4">

                    <p className="text-sm text-white/65">
                      {branch.name}
                    </p>

                    <span className="text-xs text-white/30">
                      {branch.version}
                    </span>

                  </div>

                  <p className="mt-2 text-xs text-white/30">
                    {branch.description}
                  </p>

                </div>
              ))}

            </div>

          </div>

        </section>


        <p className="mt-8 text-[10px] tracking-wider text-white/20">
          VERSIONVAULT · BRANCH MANAGEMENT
        </p>

      </main>
    </AppShell>
  );
}


/* =========================================================
   STAT
========================================================= */

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="p-6 border-b sm:border-b-0 sm:border-r border-white/10 last:border-r-0">

      <p className="text-[10px] tracking-wider text-white/30">
        {label}
      </p>

      <p className="mt-4 text-2xl font-semibold">
        {value}
      </p>

    </div>
  );
}


/* =========================================================
   BRANCH ROW
========================================================= */

function BranchRow({
  name,
  description,
  version,
  updated,
  active = false,
  last = false,
}: {
  name: string;
  description: string;
  version: string;
  updated: string;
  active?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={`p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 ${
        !last ? "border-b border-white/10" : ""
      }`}
    >

      <div className="flex items-start gap-4">

        <div className="mt-1.5 w-2 h-2 border border-white/40 shrink-0" />

        <div>

          <div className="flex items-center gap-3">

            <h3 className="text-sm font-medium">
              {name}
            </h3>

            {active && (
              <span className="border border-white/10 px-2 py-1 text-[8px] tracking-wider text-white/35">
                ACTIVE
              </span>
            )}

          </div>

          <p className="mt-2 text-xs text-white/35">
            {description}
          </p>

        </div>

      </div>


      <div className="flex items-center gap-8">

        <div>
          <p className="text-[8px] tracking-wider text-white/25">
            VERSION
          </p>

          <p className="mt-1 text-xs text-white/55">
            {version}
          </p>
        </div>

        <div>
          <p className="text-[8px] tracking-wider text-white/25">
            UPDATED
          </p>

          <p className="mt-1 text-xs text-white/55">
            {updated}
          </p>
        </div>

      </div>

    </div>
  );
}


/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between border-b border-white/10 pb-4">

      <span className="text-[9px] tracking-wider text-white/25">
        {label}
      </span>

      <span className="text-xs text-white/55">
        {value}
      </span>

    </div>
  );
}

export default BranchPage;