import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Check for sw.js first to avoid unhandled registration errors when missing on host
      const head = await fetch('/sw.js', { method: 'HEAD' });
      if (head.ok) {
        await navigator.serviceWorker.register('/sw.js');
        console.log('Service worker registered');
      } else {
        console.warn('No service worker found at /sw.js (status ' + head.status + ')');
      }
    } catch (err) {
      console.warn('Service worker registration skipped', err);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);