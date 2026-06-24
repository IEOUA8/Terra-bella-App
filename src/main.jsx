import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { PermissionsProvider } from '@/hooks/usePermissions';
import { Toaster } from "@/components/ui/toaster";

// Service Worker Registration (Production Only)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered successfully:', registration.scope);
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New content available, please refresh.');
              // Optionally show a notification to user about update
            }
          });
        });
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  });
} else if (!import.meta.env.PROD) {
  console.log('[PWA] Service Worker not registered (development mode)');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <AuthProvider>
      <PermissionsProvider>
        <App />
        <Toaster />
      </PermissionsProvider>
    </AuthProvider>
  </>
);