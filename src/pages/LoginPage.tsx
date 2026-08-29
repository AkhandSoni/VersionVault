import { FormEvent, useState } from "react";
import { Link, useNavigate } from "@/lib/router-bridge";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email || !password) {
      return;
    }

    // Temporary frontend-only login
    // Backend authentication baad mein connect karenge.
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
            to="/register"
            className="text-xs text-white/40 transition hover:text-white"
          >
            CREATE ACCOUNT →
          </Link>
        </div>
      </nav>

      {/* LOGIN */}
      <section className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* HEADER */}
          <div className="mb-8">
            <p className="text-[10px] font-semibold tracking-[0.28em] text-white/30">
              AUTHENTICATION
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Welcome back.
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/35">
              Sign in to access your VersionVault workspace.
            </p>
          </div>

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="border border-white/10 p-6 md:p-8"
          >
            {/* EMAIL */}
            <div>
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
              <div className="flex items-center justify-between">
                <label className="text-[9px] tracking-[0.2em] text-white/30">
                  PASSWORD
                </label>

                <span className="text-[9px] text-white/20">
                  SECURE ACCESS
                </span>
              </div>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
                className="mt-3 w-full border border-white/10 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
              />
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              className="mt-8 w-full border border-white/20 px-6 py-3 text-xs font-semibold tracking-wider transition hover:bg-white hover:text-black"
            >
              SIGN IN
            </button>
          </form>

          {/* REGISTER */}
          <p className="mt-6 text-center text-xs text-white/30">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-white/60 hover:text-white"
            >
              Create one
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

export default LoginPage;