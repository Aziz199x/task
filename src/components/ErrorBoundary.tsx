import React, { Component, ErrorInfo, ReactNode } from "react";
import { toast } from "sonner";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    
    // Show a toast notification instead of a fallback UI
    toast.error("Something went wrong. Please try again.", {
      action: {
        label: "Try Again",
        onClick: () => {
          this.setState({ hasError: false });
          window.location.reload();
        },
      },
      duration: 10000, // Keep the toast visible for longer
    });
  }

  public render() {
    // If an error occurred, we render nothing and let the toast handle the user feedback.
    // The rest of the UI remains interactive where possible.
    if (this.state.hasError) {
      // You can render a minimal fallback here if you want, 
      // but for a toast-based approach, rendering children can sometimes be better
      // if the error was localized and didn't break the whole app.
      // For a full crash, we reset state and allow the user to reload via the toast.
      return null;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;