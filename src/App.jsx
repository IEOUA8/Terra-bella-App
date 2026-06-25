import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import AuthPage from '@/pages/AuthPage';
import DashboardPage from '@/pages/DashboardPage';
import AdminPage from '@/pages/AdminPage';
import GuardiaPage from '@/pages/GuardiaPage';
import GuardiaLandingPage from '@/pages/GuardiaLandingPage';
import PWAStatus from '@/components/PWAStatus';
import { Loader2, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

// 1. Reusable Loading Screen Component
const LoadingScreen = ({ text = "" }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-900 to-indigo-950 flex flex-col items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-brand-400 mb-2" />
    {text && <span className="text-white text-xl">{text}</span>}
  </div>
);

// 2. Protected Route Component
const ProtectedRoute = ({ children, roles }) => {
  const { session, profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!session) {
    return <Navigate to="/" replace />;
  }

  // If specific roles are required, check against user profile role
  if (roles && profile && !roles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// 3. PWA Install Prompt Component
const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show install button
      setShowInstallPrompt(true);
      console.log('[PWA] Install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      toast({
        title: "¡App Instalada!",
        description: "TerraBellapp se ha instalado correctamente en tu dispositivo.",
        duration: 5000,
      });
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [toast]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`[PWA] User response: ${outcome}`);

    if (outcome === 'accepted') {
      toast({
        title: "Instalando...",
        description: "La aplicación se está instalando en tu dispositivo.",
        duration: 3000,
      });
    } else {
      toast({
        title: "Instalación cancelada",
        description: "Puedes instalar la app más tarde desde el menú del navegador.",
        duration: 3000,
      });
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    toast({
      title: "Recordatorio guardado",
      description: "Puedes instalar la app más tarde desde el menú del navegador.",
      duration: 3000,
    });
  };

  if (!showInstallPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
      >
        <div className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-lg shadow-2xl p-4 text-white border border-brand-400/20">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="bg-white/20 rounded-full p-3">
              <Download className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">Instalar TerraBellapp</h3>
              <p className="text-sm text-white/90 mb-3">
                Instala nuestra app para acceso rápido, notificaciones push y uso offline.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleInstallClick}
                  className="flex-1 bg-white text-brand-700 hover:bg-gray-100 font-semibold"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Instalar Ahora
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                >
                  Más Tarde
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// 4. Main App Component
function App() {
  const { session, loading, signOut, profile } = useAuth();

  if (loading) {
    return <LoadingScreen text="Cargando..." />;
  }

  // Redirect logic based on user role
  const renderRedirect = () => {
    if (!session) return <AuthPage />;

    // If session exists but profile hasn't loaded yet, keep loading
    if (!profile) return <LoadingScreen />;

    const userRole = profile?.role;

    if (userRole === 'admin' || userRole === 'super_admin') {
      return <Navigate to="/admin" replace />;
    }
    if (userRole === 'guardia') {
      return <Navigate to="/guardia-bienvenida" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-900 to-slate-950 text-white">
        {/* PWA Status Indicator */}
        <PWAStatus />

        {/* PWA Install Prompt */}
        <PWAInstallPrompt />

        <Routes>
          {/* Root Route: Decides whether to show Login or Redirect based on Role */}
          <Route path="/" element={renderRedirect()} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['resident']}>
                <DashboardPage onLogout={signOut} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin', 'super_admin']}>
                <AdminPage onLogout={signOut} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/guardia-bienvenida"
            element={
              <ProtectedRoute roles={['guardia']}>
                <GuardiaLandingPage onLogout={signOut} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/guardia"
            element={
              <ProtectedRoute roles={['guardia']}>
                <GuardiaPage onLogout={signOut} />
              </ProtectedRoute>
            }
          />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;