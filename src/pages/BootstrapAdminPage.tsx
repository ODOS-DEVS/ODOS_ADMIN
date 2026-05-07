import { ShieldPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getAdminBootstrapStatus } from "@/api/adminAuthApi";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/useToast";

export function BootstrapAdminPage() {
  const navigate = useNavigate();
  const { adminUser, bootstrapSignup, isSigningUp } = useAdminAuth();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChecking, setIsChecking] = useState(true);
  const [bootstrapEnabled, setBootstrapEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (adminUser) {
      navigate("/dashboard", { replace: true });
    }
  }, [adminUser, navigate]);

  useEffect(() => {
    const loadStatus = async () => {
      setIsChecking(true);
      const status = await getAdminBootstrapStatus();
      setBootstrapEnabled(status.bootstrapEnabled);
      setIsChecking(false);
    };

    void loadStatus();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await bootstrapSignup({ fullName, email, password, phoneNumber });
      showToast({
        title: "Admin account created",
        description: "Your first ODOS admin account is ready.",
        tone: "success",
      });
      navigate("/dashboard", { replace: true });
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Unable to create the admin account.";
      setError(message);
      showToast({
        title: "Bootstrap signup failed",
        description: message,
        tone: "error",
      });
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-canvas p-6">
        <LoadingState label="Checking bootstrap availability..." />
      </div>
    );
  }

  if (!bootstrapEnabled) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-canvas px-4 py-10 text-textStrong">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.10),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.14),transparent_30%)]" />
        <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center">
          <div className="w-full rounded-[28px] border border-white/10 bg-panel/90 p-8 shadow-glow backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accentSoft">
              Admin Setup Closed
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-textStrong">
              An admin already exists for ODOS
            </h1>
            <p className="mt-3 text-sm text-textMuted">
              The first-admin bootstrap flow is only available once. Sign in with an existing admin
              account instead.
            </p>
            <div className="mt-6">
              <Link to="/login" className="text-sm font-medium text-accentSoft hover:text-textStrong">
                Back to admin sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas px-4 py-10 text-textStrong">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.10),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.14),transparent_30%)]" />
      <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accentSoft">
            First Admin Setup
          </p>
          <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-textStrong">
            Create the very first ODOS admin account.
          </h1>
          <p className="max-w-2xl text-lg text-textMuted">
            This setup screen is only available while the platform has no admin users. Once your
            first admin is created, this route closes automatically.
          </p>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-panel/90 p-6 shadow-glow backdrop-blur sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-accent/15 text-accentSoft">
              <ShieldPlus className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accentSoft">
                Bootstrap Admin
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-textStrong">
                Register first admin
              </h2>
            </div>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-textStrong">Full name</label>
              <input
                className="app-input"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="ODOS Administrator"
                autoComplete="name"
              />
            </div>
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
              <label className="mb-2 block text-sm font-medium text-textStrong">Phone number</label>
              <input
                className="app-input"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="+233..."
                autoComplete="tel"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-textStrong">Password</label>
              <input
                type="password"
                className="app-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a strong password"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-textStrong">Confirm password</label>
              <input
                type="password"
                className="app-input"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat the password"
                autoComplete="new-password"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              className="w-full"
              isLoading={isSigningUp}
              disabled={
                !fullName.trim() ||
                !email.trim() ||
                !password.trim() ||
                !confirmPassword.trim()
              }
            >
              Create first admin
            </Button>
          </form>

          <div className="mt-6">
            <Link to="/login" className="text-sm font-medium text-accentSoft hover:text-textStrong">
              Back to admin sign in
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
