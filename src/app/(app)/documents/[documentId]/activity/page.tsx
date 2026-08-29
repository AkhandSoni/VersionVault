// ============================================================
// Activity Page
// ============================================================

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;

  return (
    <div data-testid="page-activity">
      <h1 className="text-2xl font-bold mb-6">Activity</h1>
      {/* TODO: Implement audit trail / activity timeline
          - AuditTimeline component
          - Event types: VERSION_CREATED, CHANGE_DETECTED, etc.
          - Actor + timestamp for each event
      */}
      <p className="text-gray-500">Activity not implemented yet (Doc: {documentId})</p>
    </div>
  );
}
