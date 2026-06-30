import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary — catches React render crashes and shows a friendly
 * fallback UI instead of a blank white screen.
 *
 * Wraps the entire app in App.tsx. If any component throws during
 * render, the user sees a recovery screen with:
 * - Error message (truncated)
 * - "Reload" button (window.location.reload)
 * - "Home" button (navigate to /)
 * - Console error for debugging
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Caught:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Nekaj je šlo narobe
            </h1>
            <p className="text-sm text-gray-500 mb-1">
              Prišlo je do napake pri nalaganju strani.
            </p>
            {this.state.error && (
              <p className="text-xs text-gray-400 font-mono mb-4 p-2 bg-gray-50 rounded">
                {this.state.error.message.slice(0, 150)}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleHome}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Home className="h-4 w-4" />
                Domov
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-white text-sm font-medium hover:bg-secondary/90 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Ponovno naloži
              </button>
            </div>
            <p className="text-xs text-gray-300 mt-6">
              Noro Lep POS v2.0 · Če se napaka ponavlja, kontaktirajte podporo.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
