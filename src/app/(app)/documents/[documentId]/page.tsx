// ============================================================
// Document Page — Primary workspace screen
// ============================================================

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;

  return (
    <div data-testid="page-document">
      <h1 className="text-2xl font-bold mb-6">Document</h1>
      {/* TODO: Implement document workspace
          - DocumentHeader (name, branch, version, integrity)
          - VersionTimeline / VersionGraph
          - VersionInspector
          - DiffViewer
          - AIExplanationPanel
          - UploadZone
      */}
      <p className="text-gray-500">Document page not implemented yet (ID: {documentId})</p>
    </div>
  );
}
