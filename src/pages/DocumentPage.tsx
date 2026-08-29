import AppShell from "../components/AppShell";
import { documents, versions } from "../data/mockdata";

function DocumentPage() {
  const document = documents[0];

  const documentVersions = versions.filter(
    (version) => version.documentId === document?.id
  );

  return (
    <AppShell>
      <main
        id="page-document"
        className="min-h-[calc(100vh-4rem)] bg-[#0B0D0F] text-[#F5F5F3] p-6 md:p-8 lg:p-10"
      >
        {/* HEADER */}
        <header className="border-b border-white/10 pb-7">
          <p className="text-[10px] tracking-[0.28em] text-white/30">
            DOCUMENT
          </p>

          <div className="mt-3 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                {document?.name || "Document"}
              </h1>

              <p className="mt-2 text-sm text-white/35">
                Document history, versions and verification details.
              </p>
            </div>

            <span className="border border-white/15 px-3 py-2 text-[9px] tracking-wider text-white/50">
              {document?.status?.toUpperCase() || "VERIFIED"}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-5 text-[10px] tracking-wider text-white/30">
            <span>✓ SHA-256 VERIFIED</span>
            <span>✓ VERSION IMMUTABLE</span>
            <span>✓ AUTHORIZED</span>
          </div>
        </header>

        {/* SUMMARY */}
        <section className="mt-8 grid grid-cols-1 md:grid-cols-3 border border-white/10">
          <SummaryItem
            label="CURRENT VERSION"
            value={document?.version || "—"}
            detail={document?.updatedAt || "—"}
          />

          <SummaryItem
            label="BRANCH"
            value={document?.branch || "—"}
            detail="Active branch"
          />

          <SummaryItem
            label="OWNER"
            value={document?.owner || "—"}
            detail="Authorized user"
          />
        </section>

        {/* DOCUMENT DETAILS */}
        <section className="mt-10">
          <div className="mb-5">
            <p className="text-[10px] tracking-[0.28em] text-white/30">
              DOCUMENT DETAILS
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Document information
            </h2>

            <p className="mt-2 text-sm text-white/35">
              Verified metadata associated with this document.
            </p>
          </div>

          <div className="border border-white/10">
            <InfoRow
              label="DOCUMENT NAME"
              value={document?.name || "—"}
            />

            <InfoRow
              label="CURRENT VERSION"
              value={document?.version || "—"}
            />

            <InfoRow
              label="STATUS"
              value={document?.status || "—"}
            />

            <InfoRow
              label="BRANCH"
              value={document?.branch || "—"}
            />

            <InfoRow
              label="OWNER"
              value={document?.owner || "—"}
            />

            <InfoRow
              label="CREATED"
              value="Aug 27, 2026"
            />

            <InfoRow
              label="LAST UPDATED"
              value={document?.updatedAt || "—"}
            />

            <InfoRow
              label="INTEGRITY"
              value="SHA-256 VERIFIED"
              last
            />
          </div>
        </section>

        {/* VERSION HISTORY */}
        <section className="mt-10">
          <div className="mb-5">
            <p className="text-[10px] tracking-[0.28em] text-white/30">
              VERSION HISTORY
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Versions
            </h2>

            <p className="mt-2 text-sm text-white/35">
              Immutable history of document revisions.
            </p>
          </div>

          <div className="border border-white/10">
            {documentVersions.length === 0 ? (
              <div className="p-8 text-sm text-white/35">
                No versions available.
              </div>
            ) : (
              documentVersions.map((version, index) => (
                <VersionRow
                  key={version.id}
                  version={version.version}
                  createdBy={version.createdBy}
                  createdAt={version.createdAt}
                  status={version.status}
                  last={index === documentVersions.length - 1}
                />
              ))
            )}
          </div>
        </section>

        {/* PROVENANCE */}
        <section
          id="blame-panel"
          className="mt-10 border border-white/10"
        >
          <div className="p-6 border-b border-white/10">
            <p className="text-[10px] tracking-[0.25em] text-white/30">
              PROVENANCE
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Who / What
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <ProvenanceItem
              label="ORIGIN"
              value="Uploaded document"
            />

            <ProvenanceItem
              label="OWNER"
              value={document?.owner || "—"}
            />

            <ProvenanceItem
              label="BRANCH"
              value={document?.branch || "—"}
            />

            <ProvenanceItem
              label="VERSION"
              value={document?.version || "—"}
            />

            <ProvenanceItem
              label="STATUS"
              value={document?.status || "—"}
            />

            <ProvenanceItem
              label="ARTIFACT"
              value={document?.name || "—"}
            />

            <ProvenanceItem
              label="UPDATED"
              value={document?.updatedAt || "—"}
            />

            <ProvenanceItem
              label="HASH"
              value="SHA-256 VERIFIED"
            />
          </div>
        </section>

        {/* FOOTER */}
        <div className="mt-10 mb-8 flex flex-wrap gap-5 text-[10px] tracking-wider text-white/30">
          <span>✓ EVIDENCE FIRST</span>
          <span>✓ SHA-256 VERIFIED</span>
          <span>✓ VERSION IMMUTABLE</span>
          <span>✓ AUTHORIZED</span>
        </div>
      </main>
    </AppShell>
  );
}

/* =========================================================
   SUMMARY
========================================================= */

interface SummaryItemProps {
  label: string;
  value: string;
  detail: string;
}

function SummaryItem({
  label,
  value,
  detail,
}: SummaryItemProps) {
  return (
    <div className="p-6 border-b md:border-b-0 md:border-r last:border-r-0 border-white/10">
      <p className="text-[9px] tracking-[0.2em] text-white/30">
        {label}
      </p>

      <p className="mt-3 text-2xl font-semibold">
        {value}
      </p>

      <p className="mt-2 text-[10px] text-white/30">
        {detail}
      </p>
    </div>
  );
}

/* =========================================================
   INFO ROW
========================================================= */

interface InfoRowProps {
  label: string;
  value: string;
  last?: boolean;
}

function InfoRow({
  label,
  value,
  last = false,
}: InfoRowProps) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-[220px_1fr] gap-3 p-6 ${
        !last ? "border-b border-white/10" : ""
      }`}
    >
      <p className="text-[9px] tracking-wider text-white/30">
        {label}
      </p>

      <p className="text-sm text-white/60">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   VERSION ROW
========================================================= */

interface VersionRowProps {
  version: string;
  createdBy: string;
  createdAt: string;
  status: string;
  last?: boolean;
}

function VersionRow({
  version,
  createdBy,
  createdAt,
  status,
  last = false,
}: VersionRowProps) {
  return (
    <div
      className={`p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 ${
        !last ? "border-b border-white/10" : ""
      }`}
    >
      <div>
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium">
            {version}
          </h3>

          <span className="border border-white/10 px-2 py-1 text-[8px] tracking-wider text-white/35">
            {status.toUpperCase()}
          </span>
        </div>

        <p className="mt-2 text-xs text-white/35">
          Created by {createdBy}
        </p>
      </div>

      <div>
        <p className="text-[8px] tracking-wider text-white/25">
          CREATED
        </p>

        <p className="mt-1 text-xs text-white/55">
          {createdAt}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   PROVENANCE ITEM
========================================================= */

interface ProvenanceItemProps {
  label: string;
  value: string;
}

function ProvenanceItem({
  label,
  value,
}: ProvenanceItemProps) {
  return (
    <div className="p-6 border-b md:border-r border-white/10">
      <p className="text-[9px] tracking-wider text-white/30">
        {label}
      </p>

      <p className="mt-3 text-xs text-white/60">
        {value}
      </p>
    </div>
  );
}

export default DocumentPage;