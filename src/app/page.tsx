// ============================================================
// VersionVault — Landing Page
// ============================================================

export default function LandingPage() {
  return (
    <main data-testid="page-landing" className="min-h-screen">
      {/* TODO: Implement landing page
          - Hero section: "Evidence-first document version control"
          - Value proposition: what changed → proof → who → when → why
          - CTA: Get Started / Login
      */}
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold">VersionVault</h1>
          <p className="mt-4 text-lg text-gray-600">
            Evidence-first document version control
          </p>
        </div>
      </div>
    </main>
  );
}
