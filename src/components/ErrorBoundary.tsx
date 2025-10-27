"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // You can also log error messages to an error reporting service here
  }

  public render() {
    if (this.state.hasError) {
      // Fallback UI when an error occurs
      return (
        <div className="min-h-screen flex items-center justify-center bg-destructive-foreground text-destructive p-4 text-center">
          <div className="space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto" />
            <h1 className="text-2xl font-bold">Oops! Something went wrong.</h1>
            <p className="text-lg">We're sorry, but an unexpected error occurred.</p>
            {this.state.error && (
              <div className="bg-destructive text-destructive-foreground p-4 rounded-md text-left max-w-lg mx-auto overflow-auto">
                <p className="font-semibold">Error Details:</p>
                <pre className="whitespace-pre-wrap text-sm">{this.state.error.message}</pre>
                {/* Optionally, show stack trace in development */}
                {/* {process.env.NODE_ENV === 'development' && <pre className="whitespace-pre-wrap text-xs mt-2">{this.state.error.stack}</pre>} */}
              </div>
            )}
            <p className="text-sm">Please try refreshing the page or contact support if the issue persists.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Create a functional component wrapper to use useTranslation hook
const ErrorBoundaryWithTranslation: React.FC<ErrorBoundaryProps> = ({ children }) => {
  const { t } = useTranslation(); // This will ensure translations are available inside the ErrorBoundary

  // Pass the translation function or translated strings as props if needed,
  // or simply rely on the ErrorBoundary's internal static content for critical errors.
  // For simplicity, I'll keep the ErrorBoundary's text static for now,
  // as a critical error might prevent i18n from loading correctly.
  // However, wrapping it ensures i18n context is available for children.
  return <ErrorBoundary>{children}</ErrorBoundary>;
};

export default ErrorBoundaryWithTranslation;