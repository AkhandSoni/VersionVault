import NextVaultApp from '../../../../NextVaultApp';

export default async function VersionComparePage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  await params;
  return <NextVaultApp />;
}
