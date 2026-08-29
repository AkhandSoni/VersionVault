// ============================================================
// Version Compare Page
// ============================================================

export default async function VersionComparePage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;

  return (
    <div data-testid="page-version-compare">
      <h1 className="text-2xl font-bold mb-6">Version Compare</h1>
      {/* TODO: Implement version comparison
          - Version selector (base vs target)
          - DiffViewer (hero experience)
          - MaterialChangeBadge
          - Evidence panel
          - Provenance / BlamePanel
          - AIExplanationPanel
      */}
      <p className="text-gray-500">Version compare not implemented yet (Doc: {documentId})</p>
    </div>
  );
}
