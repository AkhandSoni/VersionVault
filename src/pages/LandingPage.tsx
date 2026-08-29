function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0B0D0F] text-[#F5F5F3]">
      {/* NAVBAR */}
      <nav className="border-b border-white/10 px-6 py-5 md:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em]">
              VERSIONVAULT
            </p>
            <p className="mt-1 text-[9px] tracking-[0.2em] text-white/30">
              DOCUMENT INTEGRITY PLATFORM
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="border border-white/10 px-4 py-2 text-xs text-white/60 transition hover:border-white/25 hover:text-white"
            >
              LOGIN
            </a>

            <a
              href="/register"
              className="border border-white/20 px-4 py-2 text-xs font-medium transition hover:bg-white hover:text-black"
            >
              GET STARTED
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28">
        <div className="max-w-4xl">
          <p className="mb-6 text-[10px] font-semibold tracking-[0.3em] text-white/35">
            EVIDENCE-FIRST DOCUMENT CONTROL
          </p>

          <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            Know what changed.
            <br />
            Know who changed it.
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-7 text-white/40 md:text-lg">
            VersionVault gives teams a reliable history of documents,
            versions, branches and changes — with immutable evidence
            for every revision.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <a
              href="/register"
              className="border border-white/20 px-6 py-3 text-xs font-semibold tracking-wider transition hover:bg-white hover:text-black"
            >
              START BUILDING
            </a>

            <a
              href="/dashboard"
              className="border border-white/10 px-6 py-3 text-xs tracking-wider text-white/50 transition hover:border-white/25 hover:text-white"
            >
              VIEW DASHBOARD →
            </a>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-white/10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 md:grid-cols-4">
          <TrustItem label="SHA-256" value="VERIFIED" />
          <TrustItem label="VERSIONS" value="IMMUTABLE" />
          <TrustItem label="ACCESS" value="AUTHORIZED" />
          <TrustItem label="EVIDENCE" value="TRACEABLE" />
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-24">
        <div className="mb-12">
          <p className="text-[10px] font-semibold tracking-[0.28em] text-white/30">
            CORE CAPABILITIES
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Everything around document history.
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-6 text-white/35">
            Keep every important revision understandable, traceable
            and easy to verify.
          </p>
        </div>

        <div className="grid grid-cols-1 border border-white/10 md:grid-cols-2 lg:grid-cols-4">
          <Feature
            number="01"
            title="Document History"
            description="See the complete history of every authorized document."
          />

          <Feature
            number="02"
            title="Immutable Versions"
            description="Preserve revisions so previous states remain verifiable."
          />

          <Feature
            number="03"
            title="Branch Control"
            description="Maintain independent document histories without losing context."
          />

          <Feature
            number="04"
            title="Evidence"
            description="Track who changed what and verify document integrity."
          />
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-24">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-24">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.28em] text-white/30">
                WORKFLOW
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                A clear chain of evidence.
              </h2>

              <p className="mt-4 max-w-lg text-sm leading-7 text-white/35">
                VersionVault turns document changes into a structured,
                reviewable history that your team can understand at a glance.
              </p>
            </div>

            <div className="space-y-0 border border-white/10">
              <WorkflowStep
                number="01"
                title="Upload"
                text="Add an authorized document to your workspace."
              />

              <WorkflowStep
                number="02"
                title="Version"
                text="Every meaningful revision receives its own immutable version."
              />

              <WorkflowStep
                number="03"
                title="Review"
                text="Inspect material changes and understand their impact."
              />

              <WorkflowStep
                number="04"
                title="Verify"
                text="Use provenance and integrity information as evidence."
                last
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-24">
          <div className="border border-white/10 p-8 md:p-12">
            <p className="text-[10px] font-semibold tracking-[0.28em] text-white/30">
              VERSIONVAULT
            </p>

            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
              Make every document change accountable.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-6 text-white/35">
              Centralize document history, protect previous versions and
              make evidence easy to inspect.
            </p>

            <div className="mt-7">
              <a
                href="/register"
                className="inline-block border border-white/20 px-6 py-3 text-xs font-semibold tracking-wider transition hover:bg-white hover:text-black"
              >
                CREATE WORKSPACE
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 py-6 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-[9px] tracking-wider text-white/25 md:flex-row md:items-center md:justify-between">
          <span>VERSIONVAULT · DOCUMENT INTEGRITY PLATFORM</span>
          <span>✓ EVIDENCE FIRST · ✓ VERSION IMMUTABLE</span>
        </div>
      </footer>
    </main>
  );
}

/* =========================================================
   TRUST ITEM
========================================================= */

interface TrustItemProps {
  label: string;
  value: string;
}

function TrustItem({ label, value }: TrustItemProps) {
  return (
    <div className="border-r border-white/10 p-6 last:border-r-0">
      <p className="text-[9px] tracking-[0.2em] text-white/25">
        {label}
      </p>

      <p className="mt-3 text-xs font-medium text-white/60">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   FEATURE
========================================================= */

interface FeatureProps {
  number: string;
  title: string;
  description: string;
}

function Feature({
  number,
  title,
  description,
}: FeatureProps) {
  return (
    <div className="border-b border-r border-white/10 p-6 last:border-r-0 md:p-7">
      <p className="text-[9px] tracking-[0.2em] text-white/25">
        {number}
      </p>

      <h3 className="mt-8 text-sm font-semibold">
        {title}
      </h3>

      <p className="mt-3 text-xs leading-6 text-white/35">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   WORKFLOW STEP
========================================================= */

interface WorkflowStepProps {
  number: string;
  title: string;
  text: string;
  last?: boolean;
}

function WorkflowStep({
  number,
  title,
  text,
  last = false,
}: WorkflowStepProps) {
  return (
    <div
      className={`flex gap-5 p-6 ${
        !last ? "border-b border-white/10" : ""
      }`}
    >
      <span className="text-[9px] tracking-wider text-white/25">
        {number}
      </span>

      <div>
        <h3 className="text-sm font-medium">
          {title}
        </h3>

        <p className="mt-2 text-xs leading-5 text-white/35">
          {text}
        </p>
      </div>
    </div>
  );
}

export default LandingPage;