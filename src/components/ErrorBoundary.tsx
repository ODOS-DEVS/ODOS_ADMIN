import { Component, type ErrorInfo, type ReactNode } from "react";

import { ErrorState } from "@/components/ui/ErrorState";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ODOS Admin crashed:", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
          <div className="w-full max-w-lg">
            <ErrorState
              title="Something went wrong"
              description="This part of ODOS Admin hit an unexpected error. Reloading usually fixes it — if it keeps happening, let engineering know."
              onRetry={() => window.location.reload()}
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
