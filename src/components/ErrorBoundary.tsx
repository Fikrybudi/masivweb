import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            width: '100%',
            background: '#090d16',
            color: '#f8fafc',
            padding: '24px',
            textAlign: 'center',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '24px 32px',
              maxWidth: '540px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            <AlertTriangle size={42} color="#f87171" style={{ marginBottom: '12px' }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#fca5a5' }}>
              {this.props.fallbackTitle || 'Terjadi Masalah Tampilan'}
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
              Komponen peta mengalami kendala saat memuat salah satu titik koordinat survey.
              {this.state.error?.message ? ` (${this.state.error.message})` : ''}
            </p>
            <button
              onClick={this.handleReload}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#0284c7',
                color: 'white',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={15} /> Muat Ulang Peta
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
