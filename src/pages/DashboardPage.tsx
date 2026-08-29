import AppShell from "../components/AppShell";
import { documents, activities, versions } from "../data/mockdata";

function DashboardPage() {
  // Data coming from mockData.ts
  const authorizedDocuments = documents.filter(
    (doc) => doc.status === "Verified"
  ).length;

  const authorizedVersions = versions.length;

  const reviewsNeeded = documents.filter(
    (doc) => doc.status === "Pending"
  ).length;

  // Current mock data has 2 material changes for Vendor Agreement
  const materialChanges = 2;

  // Recent documents
  const recentDocuments = documents.slice(0, 2);

  return (
    <AppShell>
      <div
        id="page-dashboard"
        className="min-h-[calc(100vh-4rem)] bg-[#0B0D0F] text-[#F5F5F3] p-8 lg:p-10"
      >
        {/* TITLE */}
        <div className="mb-10">
          <p className="text-[10px] tracking-[0.25em] font-semibold text-white/35">
            OVERVIEW
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Document history, at a glance.
          </h2>

          <p className="mt-2 text-sm text-white/45">
            Review changes, versions and evidence across your workspace.
          </p>
        </div>

        {/* STATS */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border border-white/10">
          <Stat
            label="AUTHORIZED DOCUMENTS"
            value={String(authorizedDocuments)}
          />

          <Stat
            label="AUTHORIZED VERSIONS"
            value={String(authorizedVersions)}
          />

          <Stat
            label="REVIEWS NEEDED"
            value={String(reviewsNeeded)}
          />

          <Stat
            label="MATERIAL CHANGES"
            value={String(materialChanges)}
          />
        </section>

        {/* MATERIAL CHANGES */}
        <section className="mt-12">
          <p className="text-[10px] tracking-[0.25em] font-semibold text-white/35">
            EVIDENCE
          </p>

          <h3 className="mt-2 text-xl font-semibold">
            Recent material changes
          </h3>

          <div className="mt-5 border border-white/10">
            <Change
              title="Payment Terms"
              previous="30 days"
              current="15 days"
            />

            <Change
              title="Liability Cap"
              previous="₹50,000"
              current="₹1,00,000"
              last
            />
          </div>
        </section>

        {/* RECENT DOCUMENTS */}
        <section className="mt-12">
          <p className="text-[10px] tracking-[0.25em] font-semibold text-white/35">
            DOCUMENTS
          </p>

          <h3 className="mt-2 text-xl font-semibold">
            Recent documents
          </h3>

          <div className="mt-5 border border-white/10">
            {recentDocuments.length === 0 ? (
              <div className="p-6 text-sm text-white/35">
                No documents available.
              </div>
            ) : (
              recentDocuments.map((document, index) => (
                <DocumentRow
                  key={document.id}
                  title={document.name}
                  version={document.version}
                  last={index === recentDocuments.length - 1}
                />
              ))
            )}
          </div>
        </section>

        {/* ACTIVITY SUMMARY */}
        <section className="mt-12">
          <p className="text-[10px] tracking-[0.25em] font-semibold text-white/35">
            ACTIVITY
          </p>

          <h3 className="mt-2 text-xl font-semibold">
            Workspace activity
          </h3>

          <div className="mt-5 border border-white/10">
            {activities.length === 0 ? (
              <div className="p-6 text-sm text-white/35">
                No recent activity.
              </div>
            ) : (
              activities.slice(0, 3).map((activity, index) => (
                <ActivityRow
                  key={activity.id}
                  action={activity.action}
                  document={activity.document}
                  user={activity.user}
                  time={activity.time}
                  last={index === Math.min(activities.length, 3) - 1}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

/* =========================================================
   STAT COMPONENT
========================================================= */

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="p-6 border-b md:border-r border-white/10">
      <p className="text-[10px] tracking-wider text-white/35">
        {label}
      </p>

      <p className="mt-4 text-3xl font-semibold">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   CHANGE COMPONENT
========================================================= */

interface ChangeProps {
  title: string;
  previous: string;
  current: string;
  last?: boolean;
}

function Change({
  title,
  previous,
  current,
  last = false,
}: ChangeProps) {
  return (
    <div
      className={`p-6 ${
        !last ? "border-b border-white/10" : ""
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div>
          <p className="text-xs text-white/40">
            {title.toUpperCase()}
          </p>

          <div className="mt-4 flex items-center gap-4">
            <span className="text-lg text-white/40">
              {previous}
            </span>

            <span className="text-white/20">
              →
            </span>

            <span className="text-lg font-medium">
              {current}
            </span>
          </div>
        </div>

        <div className="md:text-right">
          <p className="text-[10px] tracking-wider text-white/40">
            MATERIAL CHANGE
          </p>

          <p className="mt-2 text-xs font-semibold">
            FINANCIAL · HIGH
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs text-white/35">
        Vendor Agreement — Acme Technologies · V1 → V2
      </p>
    </div>
  );
}

/* =========================================================
   DOCUMENT ROW
========================================================= */

interface DocumentRowProps {
  title: string;
  version: string;
  last?: boolean;
}

function DocumentRow({
  title,
  version,
  last = false,
}: DocumentRowProps) {
  return (
    <div
      className={`p-6 flex items-center justify-between ${
        !last ? "border-b border-white/10" : ""
      }`}
    >
      <div>
        <p className="text-sm font-medium">
          {title}
        </p>

        <p className="mt-2 text-xs text-white/35">
          Current version · {version}
        </p>
      </div>

      <span className="text-[10px] tracking-wider text-white/50">
        ✓ IMMUTABLE
      </span>
    </div>
  );
}

/* =========================================================
   ACTIVITY ROW
========================================================= */

interface ActivityRowProps {
  action: string;
  document: string;
  user: string;
  time: string;
  last?: boolean;
}

function ActivityRow({
  action,
  document,
  user,
  time,
  last = false,
}: ActivityRowProps) {
  const formattedAction = action
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <div
      className={`p-6 ${
        !last ? "border-b border-white/10" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="mt-1.5 w-2 h-2 rounded-full border border-white/40 shrink-0" />

        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-sm font-medium">
                {formattedAction}
              </p>

              <p className="mt-2 text-xs text-white/40">
                {document}
              </p>
            </div>

            <p className="text-[10px] text-white/25">
              {time}
            </p>
          </div>

          <p className="mt-4 text-[10px] tracking-wider text-white/25">
            BY {user.toUpperCase()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;