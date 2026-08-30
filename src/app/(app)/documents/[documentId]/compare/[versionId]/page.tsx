import NextVaultApp from '../../../../../NextVaultApp';

export default async function VersionCompareRoute({
  params,
}: {
  params: Promise<{ documentId: string; versionId: string }>;
}) {
  await params;
  return <NextVaultApp />;
}
