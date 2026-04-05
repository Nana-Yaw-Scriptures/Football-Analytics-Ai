import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[Scorina AI] App error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#050810',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Outfit', sans-serif",
          padding: '24px',
          textAlign: 'center',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'rgba(34,211,238,0.1)',
            border: '1px solid rgba(34,211,238,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 24, fontSize: 28,
          }}>⚽</div>
          <h1 style={{ color: 'white', fontSize: 24, fontWeight: 900, marginBottom: 8 }}>
            Scorina AI
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24, maxWidth: 320 }}>
            Something went wrong loading the app. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #22d3ee, #0891b2)',
              color: 'white',
              fontWeight: 700,
              fontSize: 14,
              border: 'none',
              cursor: 'pointer',
            }}>
            Refresh Page
          </button>
          <p style={{ color: '#334155', fontSize: 12, marginTop: 16 }}>
            scorinai.com
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
