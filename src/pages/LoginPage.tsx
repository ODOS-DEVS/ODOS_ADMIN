import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { getAdminBootstrapStatus } from "@/api/adminAuthApi";
import { Button } from "@/components/ui/Button";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/useToast";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminUser, login, isSigningIn } = useAdminAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState("admin@odos.app");
  const [password, setPassword] = useState("admin12345");
  const [error, setError] = useState<string | null>(null);
  const [bootstrapEnabled, setBootstrapEnabled] = useState(false);

  useEffect(() => {
    const loadBootstrapStatus = async () => {
      const status = await getAdminBootstrapStatus();
      setBootstrapEnabled(status.bootstrapEnabled);
    };

    void loadBootstrapStatus();
  }, []);

  useEffect(() => {
    if (adminUser) {
      const nextPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(nextPath ?? "/dashboard", { replace: true });
    }
  }, [adminUser, location.state, navigate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await login({ email, password });
      showToast({
        title: "Signed in successfully",
        description: "Your ODOS admin workspace is ready.",
        tone: "success",
      });
      navigate("/dashboard", { replace: true });
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Unable to sign in right now.";
      setError(message);
      showToast({
        title: "Sign in failed",
        description: message,
        tone: "error",
      });
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas px-4 py-10 text-textStrong">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.10),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.14),transparent_30%)]" />
      <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <section className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accentSoft">
            ODOS Control Room
          </p>
          <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-textStrong">
            Run the marketplace with calm, clear, high-signal operations.
          </h1>
          <p className="max-w-2xl text-lg text-textMuted">
            Review vendor applications, monitor orders, protect catalog quality, and keep the
            customer experience healthy from one professional workspace.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Vendor ops", "Approve and manage high-quality stores."],
              ["Order visibility", "Track platform activity and fulfillment risk."],
              ["Catalog control", "Monitor products, markets, and categories."],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm font-semibold text-textStrong">{title}</p>
                <p className="mt-2 text-sm text-textMuted">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-panel/90 p-6 shadow-glow backdrop-blur sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-accent/15 text-accentSoft">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accentSoft">
                Admin Sign In
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-textStrong">
                Access your dashboard
              </h2>
            </div>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-textStrong">Email address</label>
              <input
                type="email"
                className="app-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@odos.app"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-textStrong">Password</label>
              <input
                type="password"
                className="app-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            <Button type="submit" className="w-full" isLoading={isSigningIn}>
              Sign in to admin
            </Button>
          </form>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-textMuted">
            Demo fallback credentials:
            <span className="ml-2 font-medium text-textStrong">admin@odos.app / admin12345</span>
          </div>

          {bootstrapEnabled ? (
            <div className="mt-4 rounded-2xl border border-accent/20 bg-accent/10 px-4 py-4 text-sm text-textMuted">
              No admin exists yet.
              <Link to="/setup-admin" className="ml-2 font-medium text-accentSoft hover:text-textStrong">
                Create the first admin account
              </Link>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
