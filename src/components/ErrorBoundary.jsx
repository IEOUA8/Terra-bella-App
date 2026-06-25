import React from 'react';
import { Button } from '@/components/ui/button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-white bg-gradient-to-br from-slate-900 via-brand-900 to-slate-950">
          <p className="text-lg text-gray-300">No se pudo cargar esta sección.</p>
          <Button onClick={() => window.location.reload()} className="bg-brand-600 hover:bg-brand-700">
            Recargar
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
