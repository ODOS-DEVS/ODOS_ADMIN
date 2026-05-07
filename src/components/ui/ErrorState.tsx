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
    <div className="rounded-3xl border border-red-400/20 bg-red-500/5 px-6 py-12 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-200">
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
