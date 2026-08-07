import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/Button";

type ErrorStateProps = {
  title?: string;
  description: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-danger/20 bg-danger-soft px-6 py-12 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-danger/10 text-danger">
        <AlertTriangle className="size-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-textStrong">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-textMuted">{description}</p>
      {onRetry ? (
        <div className="mt-5 flex justify-center">
          <Button variant="danger" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : null}
    </div>
  );
}
