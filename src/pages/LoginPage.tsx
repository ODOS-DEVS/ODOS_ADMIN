import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { getAdminBootstrapStatus } from "@/api/adminAuthApi";
import { AuthPasswordInput } from "@/components/auth/AuthPasswordInput";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/useToast";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminUser, login, isSigningIn } = useAdminAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <AuthShell
      showcase={{
        tagline: "Built for ODOS",
        title: "The control room for your marketplace",
        description:
          "Everything your team needs to run vendors, orders, and payouts — with access that matches each person’s role.",
      }}
      footer={
        bootstrapEnabled ? (
          <p>
            First install?{" "}
            <Link to="/setup-admin" className="font-semibold text-accent hover:text-accent/80">
              Create the super admin account
            </Link>
          </p>
        ) : (
          <p className="text-textSubtle">
            Need access? Ask your super admin to add you under Settings → Admin team.
          </p>
        )
      }
    >
      <div className="mb-8">
        <h1 className="font-display text-[1.75rem] font-semibold tracking-tight text-textStrong">Sign in</h1>
        <p className="mt-2 text-[15px] text-textMuted">Use your ODOS staff email to continue.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-textStrong">
            Work email
          </label>
          <input
            id="login-email"
            type="email"
            className="app-input auth-input-muted"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            required
          />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="login-password" className="block text-sm font-medium text-textStrong">
              Password
            </label>
            <span className="text-xs text-textSubtle">Ask a super admin to reset it</span>
          </div>
          <AuthPasswordInput
            id="login-password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </div>
        ) : null}

        <Button type="submit" className="mt-1 w-full py-3 text-[15px]" isLoading={isSigningIn}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
