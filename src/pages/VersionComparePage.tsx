import { Link, useSearchParams } from "@/lib/router-bridge";
import AppShell from "../components/AppShell";
import { versionComparison, documents, versions } from "../data/mockdata";

function VersionComparePage() {
  const [searchParams] = useSearchParams();

  const documentId = searchParams.get("documentId") || "1";

  const document = documents.find((doc) => doc.id === documentId);

  const documentVersions = versions.filter(
    (version) => version.documentId === documentId
  );

  const currentVersion =
    documentVersions.find((version) => version.status === "Current") ||
    documentVersions[0];

  const previousVersion =
    documentVersions.find((version) => version.status === "Previous") ||
    documentVersions[1];

  const current = currentVersion?.version || "V2";
  const previous = previousVersion?.version || "V1";

  return (
    <AppShell>
      <main
        id="page-version-compare"
        className="min-h-[calc(100vh-4rem)] bg-[#0B0D0F] text-[#F5F5F3] p-6 md:p-8 lg:p-10"
      >
        {/* HEADER */}
        <header className="border-b border-white/10 pb-7">
          <p className="text-[10px] tracking-[0.28em] text-white/30">
            VERSION COMPARISON
          </p>

          <div className="mt-2 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                {previous} → {current}
              </h1>

              <p className="mt-2 text-sm text-white/35">
                {document?.name || "Document"}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-[10px]">
              <span
                id="diff-base-version"
                className="border border-white/10 px-3 py-2 text-white/45"
              >
                PREVIOUS · {previous}
              </span>

              <span className="border border-white/20 px-3 py-2 text-white/70">
                CURRENT · {current}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-5 text-[10px] tracking-wider text-white/35">
            <span>✓ SHA-256 VERIFIED</span>
            <span>✓ VERSION IMMUTABLE</span>
            <span>✓ AUTHORIZED</span>
          </div>
        </header>

        {/* SUMMARY */}
        <section className="mt-8 grid grid-cols-1 md:grid-cols-3 border border-white/10">
          <SummaryItem
            label="BASE VERSION"
            value={previous}
            detail={previousVersion?.createdAt || "Previous version"}
          />

          <SummaryItem
            label="TARGET VERSION"
            value={current}
            detail={currentVersion?.createdAt || "Current version"}
          />

          <SummaryItem
            label="MATERIAL CHANGES"
            value="2"
            detail="Financial · High"
          />
        </section>

        {/* DIFF */}
        <section id="diff-viewer" className="mt-10">
          <div className="mb-5">
            <p className="text-[10px] tracking-[0.28em] text-white/30">
              DETERMINISTIC DIFF
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              What changed?
            </h2>

            <p className="mt-2 text-sm text-white/35">
              Changes below are produced from the document versions, not AI.
            </p>
          </div>

          <CompareChange
            id="diff-change-payment"
            section="PAYMENT TERMS"
            oldValue="30 days"
            newValue="15 days"
            category="FINANCIAL"
            severity="HIGH"
          />

          <CompareChange
            id="diff-change-liability"
            section="LIABILITY CAP"
            oldValue="₹50,000"
            newValue="₹1,00,000"
            category="FINANCIAL"
            severity="HIGH"
          />
        </section>

        {/* SIDE BY SIDE */}
        <section className="mt-10 border border-white/10">
          <div className="p-6 border-b border-white/10">
            <p className="text-[10px] tracking-[0.25em] text-white/30">
              DOCUMENT CONTENT
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              Previous / Current
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* PREVIOUS */}
            <div className="p-6 md:p-8 lg:border-r border-white/10">
              <div className="flex items-center justify-between">
                <p className="text-[10px] tracking-[0.2em] text-white/30">
                  PREVIOUS
                </p>

                <span className="text-xs text-white/40">
                  {previous}
                </span>
              </div>

              <div className="mt-7 space-y-7">
                <ContentRow
                  title="Payment Terms"
                  value="30 days"
                  changed
                />

                <ContentRow
                  title="Liability Cap"
                  value="₹50,000"
                  changed
                />

                <ContentRow
                  title="Termination Notice"
                  value="30 days"
                />

                <ContentRow
                  title="Support"
                  value="Business hours"
                />
              </div>
            </div>

            {/* CURRENT */}
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between">
                <p className="text-[10px] tracking-[0.2em] text-white/30">
                  CURRENT
                </p>

                <span className="text-xs text-white/70">
                  {current}
                </span>
              </div>

              <div className="mt-7 space-y-7">
                <ContentRow
                  title="Payment Terms"
                  value="15 days"
                  changed
                  current
                />

                <ContentRow
                  title="Liability Cap"
                  value="₹1,00,000"
                  changed
                  current
                />

                <ContentRow
                  title="Termination Notice"
                  value="30 days"
                />

                <ContentRow
                  title="Support"
                  value="Business hours"
                />
              </div>
            </div>
          </div>
        </section>

        {/* EVIDENCE */}
        <section className="mt-10">
          <div className="mb-5">
            <p className="text-[10px] tracking-[0.28em] text-white/30">
              PROOF
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Evidence
            </h2>

            <p className="mt-2 text-sm text-white/35">
              Verified facts supporting the detected changes.
            </p>
          </div>

          <div className="border border-white/10">
            <EvidenceRow
              label="SOURCE VERSIONS"
              value={`${previous} → ${current}`}
            />

            <EvidenceRow
              label="SECTION"
              value="Payment Terms"
            />

            <EvidenceRow
              label="PREVIOUS VALUE"
              value="30 days"
            />

            <EvidenceRow
              label="CURRENT VALUE"
              value="15 days"
            />

            <EvidenceRow
              label="ACTOR"
              value={currentVersion?.createdBy || document?.owner || "Unknown"}
            />

            <EvidenceRow
              label="TIMESTAMP"
              value={currentVersion?.createdAt || document?.updatedAt || "Unknown"}
            />

            <EvidenceRow
              label="BRANCH"
              value={document?.branch || "main"}
            />

            <EvidenceRow
              label="SOURCE"
              value="Uploaded revision"
            />

            <EvidenceRow
              label="INTEGRITY"
              value="SHA-256 VERIFIED"
              last
            />
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
              value={previous}
            />

            <ProvenanceItem
              label="ACTOR"
              value={currentVersion?.createdBy || document?.owner || "Unknown"}
            />

            <ProvenanceItem
              label="BRANCH"
              value={document?.branch || "main"}
            />

            <ProvenanceItem
              label="TIMESTAMP"
              value={currentVersion?.createdAt || document?.updatedAt || "Unknown"}
            />

            <ProvenanceItem
              label="SOURCE"
              value="Uploaded revision"
            />

            <ProvenanceItem
              label="ARTIFACT"
              value={document?.name || "Document"}
            />

            <ProvenanceItem
              label="TARGET"
              value={current}
            />

            <ProvenanceItem
              label="HASH"
              value="SHA-256 verified"
            />
          </div>
        </section>

        {/* AI */}
        <section
          id="ai-explanation"
          className="mt-10 border border-white/10"
        >
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
              <div>
                <p className="text-[10px] tracking-[0.28em] text-white/30">
                  AI INTERPRETATION
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Why does this matter?
                </h2>
              </div>

              <span
                id="ai-status"
                className="border border-white/15 px-3 py-2 text-[9px] tracking-wider text-white/45"
              >
                AVAILABLE
              </span>
            </div>

            <div className="mt-7 max-w-3xl">
              <p className="text-base leading-8 text-white/65">
                The payment window was reduced from 30 days to 15 days.
                This may increase the speed at which payment is expected
                and could affect cash-flow planning.
              </p>
            </div>

            <div className="mt-8">
              <p className="text-[10px] tracking-[0.2em] text-white/30">
                POTENTIALLY AFFECTED
              </p>

              <ul className="mt-4 space-y-3 text-sm text-white/50">
                <li>• Payment scheduling</li>
                <li>• Accounts payable workflow</li>
                <li>• Cash-flow planning</li>
              </ul>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div>
                <p className="text-[10px] tracking-wider text-white/30">
                  BASED ON
                </p>

                <p
                  id="ai-source-versions"
                  className="mt-2 text-sm text-white/60"
                >
                  {previous} → {current} · Payment Terms
                </p>
              </div>

              <Link
                to={`/documents/${documentId}`}
                className="border border-white/15 px-5 py-2.5 text-xs text-white/60 hover:text-white hover:border-white/30 transition"
              >
                View Evidence
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <div className="mt-10 mb-8 flex flex-wrap gap-5 text-[10px] tracking-wider text-white/30">
          <span>✓ EVIDENCE FIRST</span>
          <span>✓ SHA-256 VERIFIED</span>
          <span>✓ VERSION IMMUTABLE</span>
          <span>✓ AI GROUNDED IN {previous} → {current}</span>
        </div>
      </main>
    </AppShell>
  );
}

/* SUMMARY */

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

/* CHANGE */

interface CompareChangeProps {
  id: string;
  section: string;
  oldValue: string;
  newValue: string;
  category: string;
  severity: string;
}

function CompareChange({
  id,
  section,
  oldValue,
  newValue,
  category,
  severity,
}: CompareChangeProps) {
  return (
    <article
      id={id}
      className="border border-white/10 mb-4"
    >
      <div className="p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-7">
          <div>
            <p className="text-[10px] tracking-[0.2em] text-white/35">
              {section}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-4">
              <span className="text-lg text-white/35 line-through decoration-white/20">
                {oldValue}
              </span>

              <span className="text-white/20">
                →
              </span>

              <span className="text-2xl font-semibold">
                {newValue}
              </span>
            </div>
          </div>

          <div className="lg:text-right">
            <p className="text-[9px] tracking-[0.2em] text-white/30">
              MATERIAL CHANGE
            </p>

            <p className="mt-2 text-[10px] tracking-wider text-white/60">
              {category} · {severity}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

/* CONTENT ROW */

interface ContentRowProps {
  title: string;
  value: string;
  changed?: boolean;
  current?: boolean;
}

function ContentRow({
  title,
  value,
  changed = false,
  current = false,
}: ContentRowProps) {
  return (
    <div
      className={`pb-5 border-b ${
        changed
          ? "border-white/20"
          : "border-white/10"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-[10px] tracking-wider text-white/30">
          {title}
        </span>

        {changed && (
          <span className="text-[9px] tracking-wider text-white/30">
            CHANGED
          </span>
        )}
      </div>

      <p
        className={`mt-3 text-sm ${
          current && changed
            ? "text-white font-medium"
            : changed
              ? "text-white/40"
              : "text-white/55"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/* EVIDENCE */

interface EvidenceRowProps {
  label: string;
  value: string;
  last?: boolean;
}

function EvidenceRow({
  label,
  value,
  last = false,
}: EvidenceRowProps) {
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

/* PROVENANCE */

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

export default VersionComparePage;