import NextVaultApp from '../../../../NextVaultApp';

export default async function BranchPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  await params;
  return <NextVaultApp />;
}
