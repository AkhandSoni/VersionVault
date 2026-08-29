import AppShell from "../components/AppShell";

function ActivityPage() {
  const events = [
    {
      type: "VERSION_RESTORED",
      title: "Version restored",
      description: "V1 content restored into a new immutable version.",
      actor: "Akhand",
      resource: "Vendor Agreement — Acme Technologies",
      time: "Aug 29, 2026 · 10:42 AM",
    },
    {
      type: "HUMAN_APPROVAL_RECORDED",
      title: "Human approval recorded",
      description: "AI proposed compliance changes were approved.",
      actor: "Akhand",
      resource: "Vendor Agreement — Acme Technologies",
      time: "Aug 29, 2026 · 10:15 AM",
    },
    {
      type: "AI_PROPOSAL_CREATED",
      title: "AI proposal created",
      description: "Document Review Agent proposed an update to the compliance section.",
      actor: "Document Review Agent",
      resource: "Vendor Agreement — Acme Technologies",
      time: "Aug 29, 2026 · 09:48 AM",
    },
    {
      type: "BRANCH_CREATED",
      title: "Branch created",
      description: "A new vendor-negotiation branch was created from V2.",
      actor: "Akhand",
      resource: "Vendor Agreement — Acme Technologies",
      time: "Aug 28, 2026 · 04:12 PM",
    },
    {
      type: "CHANGE_DETECTED",
      title: "Material change detected",
      description: "Payment Terms changed from 30 days to 15 days.",
      actor: "System",
      resource: "Vendor Agreement — Acme Technologies",
      time: "Aug 28, 2026 · 03:44 PM",
    },
    {
      type: "VERSION_READY",
      title: "Version ready",
      description: "V2 finished processing and became immutable.",
      actor: "System",
      resource: "Vendor Agreement — Acme Technologies",
      time: "Aug 28, 2026 · 03:43 PM",
    },
    {
      type: "VERSION_CREATED",
      title: "Version created",
      description: "A new revision was uploaded and processing started.",
      actor: "Akhand",
      resource: "Vendor Agreement — Acme Technologies",
      time: "Aug 28, 2026 · 03:42 PM",
    },
    {
      type: "DOCUMENT_CREATED",
      title: "Document created",
      description: "Document was added to the authorized workspace.",
      actor: "Akhand",
      resource: "Vendor Agreement — Acme Technologies",
      time: "Aug 27, 2026 · 10:14 AM",
    },
  ];

  return (
    <AppShell>
      <main
        id="page-activity"
        className="min-h-[calc(100vh-4rem)] bg-[#0B0D0F] text-[#F5F5F3] p-6 md:p-8 lg:p-10"
      >
        {/* HEADER */}

        <header className="border-b border-white/10 pb-7">
          <p className="text-[10px] tracking-[0.28em] text-white/30">
            AUDIT
          </p>

          <div className="mt-2 flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Activity
              </h1>

              <p className="mt-2 text-sm text-white/35 max-w-2xl">
                A chronological record of authorized document and version
                activity.
              </p>
            </div>

            <div className="text-[10px] tracking-wider text-white/30">
              8 EVENTS
            </div>
          </div>
        </header>

        {/* FILTER BAR */}

        <section className="mt-6 flex flex-wrap items-center gap-2">
          <button className="border border-white/25 bg-white/[0.04] px-4 py-2 text-[10px] tracking-wider text-white/70">
            ALL
          </button>

          <button className="border border-white/10 px-4 py-2 text-[10px] tracking-wider text-white/35 hover:text-white/70 hover:border-white/25 transition">
            VERSIONS
          </button>

          <button className="border border-white/10 px-4 py-2 text-[10px] tracking-wider text-white/35 hover:text-white/70 hover:border-white/25 transition">
            CHANGES
          </button>

          <button className="border border-white/10 px-4 py-2 text-[10px] tracking-wider text-white/35 hover:text-white/70 hover:border-white/25 transition">
            AI
          </button>

          <button className="border border-white/10 px-4 py-2 text-[10px] tracking-wider text-white/35 hover:text-white/70 hover:border-white/25 transition">
            PERMISSIONS
          </button>
        </section>

        {/* ACTIVITY TIMELINE */}

        <section
          id="audit-timeline"
          className="mt-8 max-w-5xl"
        >
          <div className="relative">
            {/* Vertical timeline line */}

            <div className="absolute left-[7px] top-3 bottom-3 w-px bg-white/10" />

            <div className="space-y-0">
              {events.map((event, index) => (
                <ActivityEvent
                  key={`${event.type}-${index}`}
                  type={event.type}
                  title={event.title}
                  description={event.description}
                  actor={event.actor}
                  resource={event.resource}
                  time={event.time}
                />
              ))}
            </div>
          </div>
        </section>

        {/* TRUST FOOTER */}

        <section className="mt-10 border-t border-white/10 pt-6">
          <div className="flex flex-wrap gap-5 text-[10px] tracking-wider text-white/30">
            <span>✓ AUTHORIZED EVENTS ONLY</span>
            <span>✓ CHRONOLOGICAL RECORD</span>
            <span>✓ IMMUTABLE VERSION HISTORY</span>
          </div>
        </section>
      </main>
    </AppShell>
  );
}


/* =========================================================
   ACTIVITY EVENT
========================================================= */

interface ActivityEventProps {
  type: string;
  title: string;
  description: string;
  actor: string;
  resource: string;
  time: string;
}

function ActivityEvent({
  type,
  title,
  description,
  actor,
  resource,
  time,
}: ActivityEventProps) {
  return (
    <article className="relative pl-9 pb-8">
      {/* Timeline node */}

      <div className="absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border border-white/25 bg-[#0B0D0F]">
        <div className="absolute left-[4px] top-[4px] h-[5px] w-[5px] rounded-full bg-white/45" />
      </div>

      {/* Event */}

      <div className="border border-white/10 p-5 md:p-6 hover:border-white/20 transition">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[9px] tracking-[0.18em] text-white/35">
                {type}
              </span>

              <span className="h-1 w-1 rounded-full bg-white/20" />

              <span className="text-xs text-white/65">
                {title}
              </span>
            </div>

            <p className="mt-4 text-sm leading-6 text-white/50">
              {description}
            </p>
          </div>

          <time className="shrink-0 text-[10px] text-white/30">
            {time}
          </time>
        </div>

        <div className="mt-5 border-t border-white/10 pt-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-8 text-[10px] text-white/30">
          <div>
            <span className="tracking-wider">ACTOR</span>
            <span className="ml-2 text-white/50">
              {actor}
            </span>
          </div>

          <div className="min-w-0">
            <span className="tracking-wider">RESOURCE</span>
            <span className="ml-2 text-white/50">
              {resource}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default ActivityPage;