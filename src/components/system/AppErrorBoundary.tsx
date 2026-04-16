import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled app error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-muted px-4">
          <div className="w-full max-w-lg rounded-xl border bg-card p-8 text-center shadow-sm">
            <h1 className="mb-2 text-2xl font-bold text-foreground">Something went wrong</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              The app hit an unexpected error. Your files remain local and unchanged.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Reload App
              </button>
              <Link
                to="/tools"
                className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground"
              >
                Open Tools
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
