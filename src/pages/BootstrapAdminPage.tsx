import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getAdminBootstrapStatus } from "@/api/adminAuthApi";
import { AuthPasswordInput } from "@/components/auth/AuthPasswordInput";
import { AuthShell } from "@/components/auth/AuthShell";
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
      setError(null);
      try {
        const status = await getAdminBootstrapStatus();
        setBootstrapEnabled(status.bootstrapEnabled);
      } catch (statusError) {
        setError(
          statusError instanceof Error
            ? statusError.message
            : "Unable to confirm admin bootstrap availability.",
        );
      } finally {
        setIsChecking(false);
      }
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
        title: "Super admin created",
        description: "You can now invite staff and assign permission bands in Settings.",
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
      <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
        <LoadingState label="Checking bootstrap availability..." />
      </div>
    );
  }

  if (!bootstrapEnabled) {
    return (
      <AuthShell
        brandLinkTo="/login"
        showcase={{
          tagline: "Secure workspace",
          title: "Your ODOS admin team is already live",
          description:
            "Bootstrap is a one-time flow. Sign in with your staff credentials, or ask a super admin to invite you from Settings.",
        }}
        footer={
          <Link to="/login" className="font-semibold text-accent hover:underline">
            Back to sign in
          </Link>
        }
      >
        <div className="mb-9">
          <h1 className="font-display text-[1.75rem] font-semibold tracking-tight text-textStrong">Setup closed</h1>
          <p className="mt-2.5 text-[15px] leading-relaxed text-textMuted">
            {error
              ? `We could not reach the backend: ${error}`
              : "An admin account already exists on this environment."}
          </p>
        </div>
        <p className="text-sm leading-relaxed text-textMuted">
          Platform owners should use their saved credentials. New teammates need an invite from a
          super admin under Settings → Admin team.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      brandLinkTo="/login"
      showcase={{
        tagline: "One-time setup",
        title: "Stand up the ODOS super admin",
        description:
          "Full access to every desk plus staff invites and permission bands. This path closes once the first account exists.",
      }}
      footer={
        <p>
          Already have access?{" "}
          <Link to="/login" className="font-semibold text-accent hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <div className="mb-9">
        <h1 className="font-display text-[1.75rem] font-semibold tracking-tight text-textStrong">Super admin setup</h1>
        <p className="mt-2.5 text-[15px] leading-relaxed text-textMuted">
          Register the platform owner. You can add finance, support, and ops staff next.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="bootstrap-name" className="mb-2 block text-sm font-medium text-textStrong">
            Full name
          </label>
          <input
            id="bootstrap-name"
            className="app-input auth-input-muted"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Platform owner"
            autoComplete="name"
            required
          />
        </div>
        <div>
          <label htmlFor="bootstrap-email" className="mb-2 block text-sm font-medium text-textStrong">
            Email
          </label>
          <input
            id="bootstrap-email"
            type="email"
            className="app-input auth-input-muted"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="owner@odos.app"
            autoComplete="email"
            required
          />
        </div>
        <div>
          <label htmlFor="bootstrap-phone" className="mb-2 block text-sm font-medium text-textStrong">
            Phone <span className="text-textSubtle">(optional)</span>
          </label>
          <input
            id="bootstrap-phone"
            className="app-input auth-input-muted"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            placeholder="+233..."
            autoComplete="tel"
          />
        </div>
        <div>
          <label htmlFor="bootstrap-password" className="mb-2 block text-sm font-medium text-textStrong">
            Password
          </label>
          <AuthPasswordInput
            id="bootstrap-password"
            value={password}
            onChange={setPassword}
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <div>
          <label
            htmlFor="bootstrap-confirm"
            className="mb-2 block text-sm font-medium text-textStrong"
          >
            Confirm password
          </label>
          <AuthPasswordInput
            id="bootstrap-confirm"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Repeat password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </div>
        ) : null}

        <Button
          type="submit"
          className="w-full py-3 text-[15px]"
          isLoading={isSigningUp}
          disabled={
            !fullName.trim() ||
            !email.trim() ||
            password.length < 8 ||
            confirmPassword.length < 8
          }
        >
          Create super admin
        </Button>
      </form>
    </AuthShell>
  );
}
