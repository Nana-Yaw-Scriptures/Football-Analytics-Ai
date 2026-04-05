import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import reportWebVitals from './reportWebVitals';

// ── Capacitor native app initialization ──
const initApp = async () => {
  // Only run native code if inside Capacitor (not web browser)
  if (window.Capacitor) {
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      const { SplashScreen } = await import('@capacitor/splash-screen');

      // Dark status bar matching app theme
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#050810' });

      // Hide splash screen after app loads
      await SplashScreen.hide();
    } catch (e) {
      // Silently fail if plugins not available
    }
  }
};

initApp();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

reportWebVitals();
