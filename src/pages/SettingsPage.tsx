import AppShell from "../components/AppShell";

function SettingsPage() {
  return (
    <AppShell>
      <main className="min-h-[calc(100vh-4rem)] bg-[#0B0D0F] text-[#F5F5F3] p-6 md:p-8 lg:p-10">

        {/* HEADER */}
        <header className="border-b border-white/10 pb-7">
          <p className="text-[10px] tracking-[0.28em] text-white/30">
            ACCOUNT
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Settings
          </h1>

          <p className="mt-2 text-sm text-white/35">
            Manage your account and VersionVault preferences.
          </p>
        </header>


        {/* PROFILE */}
        <section className="mt-8 border border-white/10">

          <div className="p-6 border-b border-white/10">
            <p className="text-[10px] tracking-[0.22em] text-white/30">
              PROFILE
            </p>
          </div>

          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">

            <InputField
              label="FULL NAME"
              value="Akhand"
            />

            <InputField
              label="EMAIL"
              value="akhand@example.com"
            />

            <InputField
              label="ROLE"
              value="Administrator"
            />

            <InputField
              label="ORGANIZATION"
              value="VersionVault"
            />

          </div>

          <div className="px-6 md:px-8 pb-7">
            <button className="bg-white text-black px-5 py-2.5 text-xs font-medium hover:bg-white/90 transition">
              Save Changes
            </button>
          </div>

        </section>


        {/* PREFERENCES */}
        <section className="mt-6 border border-white/10">

          <div className="p-6 border-b border-white/10">
            <p className="text-[10px] tracking-[0.22em] text-white/30">
              PREFERENCES
            </p>
          </div>

          <div className="divide-y divide-white/10">

            <SettingRow
              title="Email notifications"
              description="Receive notifications about document activity."
              enabled
            />

            <SettingRow
              title="Version alerts"
              description="Get notified when a document receives a new version."
              enabled
            />

            <SettingRow
              title="Activity updates"
              description="Receive updates about changes made to your projects."
            />

          </div>

        </section>


        {/* SECURITY */}
        <section className="mt-6 border border-white/10">

          <div className="p-6 border-b border-white/10">
            <p className="text-[10px] tracking-[0.22em] text-white/30">
              SECURITY
            </p>
          </div>

          <div className="p-6 md:p-8 space-y-6">

            <SecurityRow
              title="Password"
              description="Update your account password."
              action="Change Password"
            />

            <SecurityRow
              title="Two-factor authentication"
              description="Add an additional layer of account security."
              action="Configure"
            />

          </div>

        </section>


        {/* DANGER ZONE */}
        <section className="mt-6 border border-white/10">

          <div className="p-6 border-b border-white/10">
            <p className="text-[10px] tracking-[0.22em] text-white/30">
              DANGER ZONE
            </p>
          </div>

          <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">

            <div>
              <h2 className="text-sm font-medium">
                Sign out
              </h2>

              <p className="mt-2 text-xs text-white/35">
                Sign out of your current VersionVault session.
              </p>
            </div>

            <button className="border border-white/10 px-5 py-2.5 text-xs text-white/50 hover:text-white hover:border-white/25 transition">
              Sign Out
            </button>

          </div>

        </section>


        <p className="mt-8 text-[10px] tracking-wider text-white/20">
          VERSIONVAULT · SETTINGS
        </p>

      </main>
    </AppShell>
  );
}


/* INPUT */

function InputField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <label className="block">

      <span className="text-[9px] tracking-[0.18em] text-white/30">
        {label}
      </span>

      <input
        defaultValue={value}
        className="mt-3 w-full bg-transparent border border-white/10 px-4 py-3 text-sm text-white/70 outline-none focus:border-white/30 transition"
      />

    </label>
  );
}


/* SETTING ROW */

function SettingRow({
  title,
  description,
  enabled = false,
}: {
  title: string;
  description: string;
  enabled?: boolean;
}) {
  return (
    <div className="p-6 flex items-center justify-between gap-6">

      <div>
        <h3 className="text-sm text-white/70">
          {title}
        </h3>

        <p className="mt-2 text-xs text-white/30">
          {description}
        </p>
      </div>

      <button
        className={`w-10 h-5 border shrink-0 relative ${
          enabled
            ? "border-white/40"
            : "border-white/10"
        }`}
      >
        <span
          className={`absolute top-1 w-3 h-3 transition ${
            enabled
              ? "right-1 bg-white"
              : "left-1 bg-white/20"
          }`}
        />
      </button>

    </div>
  );
}


/* SECURITY ROW */

function SecurityRow({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

      <div>
        <h3 className="text-sm text-white/70">
          {title}
        </h3>

        <p className="mt-2 text-xs text-white/30">
          {description}
        </p>
      </div>

      <button className="border border-white/10 px-4 py-2 text-xs text-white/45 hover:text-white hover:border-white/25 transition">
        {action}
      </button>

    </div>
  );
}

export default SettingsPage;