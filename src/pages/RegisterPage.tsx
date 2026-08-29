import { FormEvent, useState } from "react";
import { Link, useNavigate } from "@/lib/router-bridge";

function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Temporary frontend-only registration
    // Backend authentication baad mein connect karenge.
    if (!name || !email || !password) {
      return;
    }

    navigate("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#0B0D0F] text-[#F5F5F3]">
      {/* NAVBAR */}
      <nav className="border-b border-white/10 px-6 py-5 md:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            to="/"
            className="text-sm font-semibold tracking-[0.18em]"
          >
            VERSIONVAULT
          </Link>

          <Link
            to="/login"
            className="text-xs text-white/40 transition hover:text-white"
          >
            ALREADY HAVE AN ACCOUNT? →
          </Link>
        </div>
      </nav>

      {/* REGISTER */}
      <section className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <p className="text-[10px] font-semibold tracking-[0.28em] text-white/30">
              CREATE ACCOUNT
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Create your workspace.
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/35">
              Set up your VersionVault account to start managing
              document history and evidence.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="border border-white/10 p-6 md:p-8"
          >
            {/* NAME */}
            <div>
              <label className="text-[9px] tracking-[0.2em] text-white/30">
                FULL NAME
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                className="mt-3 w-full border border-white/10 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
              />
            </div>

            {/* EMAIL */}
            <div className="mt-6">
              <label className="text-[9px] tracking-[0.2em] text-white/30">
                EMAIL
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="mt-3 w-full border border-white/10 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
              />
            </div>

            {/* PASSWORD */}
            <div className="mt-6">
              <label className="text-[9px] tracking-[0.2em] text-white/30">
                PASSWORD
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a password"
                className="mt-3 w-full border border-white/10 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
              />
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              className="mt-8 w-full border border-white/20 px-6 py-3 text-xs font-semibold tracking-wider transition hover:bg-white hover:text-black"
            >
              CREATE ACCOUNT
            </button>
          </form>

          {/* LOGIN */}
          <p className="mt-6 text-center text-xs text-white/30">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-white/60 hover:text-white"
            >
              Login
            </Link>
          </p>

          {/* SECURITY */}
          <div className="mt-10 flex flex-wrap justify-center gap-4 text-[9px] tracking-wider text-white/20">
            <span>✓ AUTHORIZED</span>
            <span>✓ SECURE</span>
            <span>✓ EVIDENCE FIRST</span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default RegisterPage;