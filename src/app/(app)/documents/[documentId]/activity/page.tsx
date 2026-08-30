import NextVaultApp from '../../../../NextVaultApp';

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  await params;
  return <NextVaultApp />;
}
