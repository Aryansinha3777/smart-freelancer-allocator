import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-md text-center">
            <p className="text-lg font-semibold text-slate-800 mb-2">
              Something went wrong
            </p>
            <p className="text-sm text-slate-500 mb-6">{this.state.message}</p>
            <button
              onClick={() => {
                this.setState({ hasError: false, message: "" });
                window.location.href = "/";
              }}
              className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700"
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;