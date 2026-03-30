import React from "react";

import { errorReporter } from "./reporter";

interface ErrorBoundaryProps {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    errorReporter.report(error, {
      componentStack: errorInfo.componentStack ?? undefined,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }

      return React.createElement(
        "div",
        {
          style: {
            padding: "40px",
            textAlign: "center" as const,
          },
        },
        React.createElement(
          "h2",
          { style: { marginBottom: "8px" } },
          "Something went wrong",
        ),
        React.createElement(
          "p",
          { style: { color: "#666" } },
          "An unexpected error occurred. Please try refreshing the page.",
        ),
      );
    }

    return this.props.children;
  }
}
