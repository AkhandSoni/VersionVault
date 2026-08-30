import NextVaultApp from '../../../NextVaultApp';

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  await params;
  return <NextVaultApp />;
}
