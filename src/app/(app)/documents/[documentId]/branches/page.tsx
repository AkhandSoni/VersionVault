// ============================================================
// Branch Page
// ============================================================

export default async function BranchPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;

  return (
    <div data-testid="page-branches">
      <h1 className="text-2xl font-bold mb-6">Branches</h1>
      {/* TODO: Implement branch management
          - BranchSelector
          - BranchGraph
          - Branch creation
          - AI proposal display
      */}
      <p className="text-gray-500">Branches not implemented yet (Doc: {documentId})</p>
    </div>
  );
}
