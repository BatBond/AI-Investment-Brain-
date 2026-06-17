"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level error boundary.
 * Catches any uncaught exception in client components and shows a useful
 * error message instead of a blank page with "Application error: a client-side
 * exception has occurred".
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console for debugging (Vercel will capture this)
    console.error("[ErrorBoundary] Uncaught client error:", error, errorInfo);
  }

  handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const err = this.state.error;
      const isDbError =
        err?.message?.includes("Prisma") ||
        err?.message?.includes("relation") ||
        err?.message?.includes("does not exist") ||
        err?.message?.includes("connect") ||
        err?.message?.includes("database") ||
        err?.message?.includes("DATABASE_URL");

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
          <div className="max-w-2xl w-full">
            <Alert className="border-red-500/50 bg-red-950/30">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <AlertTitle className="text-red-300">
                Application Error
              </AlertTitle>
              <AlertDescription className="mt-2 space-y-3">
                <p className="text-slate-300">
                  The app encountered a client-side error. This is usually
 caused by one of:
                </p>
                <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
                  <li>Missing or incorrect environment variables</li>
                  <li>Database not yet initialized (schema not pushed)</li>
                  <li>Network issue reaching an API endpoint</li>
                  <li>Browser extension interfering with React hydration</li>
                </ul>

                {isDbError && (
                  <div className="mt-3 p-3 rounded bg-amber-950/40 border border-amber-700/40 text-amber-200 text-sm">
                    <strong>Database issue detected.</strong> If you just
 deployed to Vercel, you need to push the Prisma schema to your
 database. Run locally:
                    <pre className="mt-2 p-2 rounded bg-slate-900 overflow-x-auto text-xs">
                      <code>
                        DATABASE_URL="postgresql://user:pass@host/db?sslmode=require" bun run db:push
                      </code>
                    </pre>
                  </div>
                )}

                {err?.message && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-200">
                      Show error details
                    </summary>
                    <pre className="mt-2 p-3 rounded bg-slate-900 overflow-x-auto text-xs text-red-300">
                      <code>{err.message}</code>
                    </pre>
                    {err.stack && (
                      <pre className="mt-2 p-3 rounded bg-slate-900 overflow-x-auto text-xs text-slate-500 max-h-48">
                        <code>{err.stack}</code>
                      </pre>
                    )}
                  </details>
                )}

                <div className="flex gap-2 mt-4">
                  <Button onClick={this.handleReload} size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload page
                  </Button>
                  <Button
                    onClick={this.handleReset}
                    size="sm"
                    variant="outline"
                  >
                    Try again
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
