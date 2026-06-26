import React, { useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { LogOut, User, Bell, BellOff, Home, CalendarCheck, List } from 'lucide-react';
import { Helmet } from 'react-helmet';
import ReservationForm from '@/components/ReservationForm';
import Dashboard from '@/components/Dashboard';
import useReservations from '@/hooks/useReservations';
import { useToast } from '@/components/ui/use-toast';
import MyReservations from '@/components/MyReservations';
import ProfileModal from '@/components/ProfileModal';
import { usePushNotifications } from '@/hooks/usePushNotifications';

// ── Bottom navigation — visible only on mobile ────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard',      icon: Home,          label: 'Inicio'    },
  { id: 'myReservations', icon: CalendarCheck, label: 'Reservas'  },
  { id: 'profile',        icon: User,          label: 'Mi Perfil' },
];

const BottomNav = ({ view, onChangeView }) => (
  <nav
    className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-surface-border bg-[#0C1412]"
    style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
  >
    <div className="flex items-center justify-around h-16">
      {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
        const active = view === id;
        return (
          <button
            key={id}
            onClick={() => onChangeView(id)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
          >
            <Icon className={`h-5 w-5 transition-colors ${active ? 'text-brand-400' : 'text-gray-500'}`} />
            <span className={`text-[10px] font-medium transition-colors ${active ? 'text-brand-400' : 'text-gray-500'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  </nav>
);

// ── Page ──────────────────────────────────────────────────────────────────────
const DashboardPage = ({ onLogout }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const {
    handleReservation,
    cancelReservation,
    getAllUserReservations,
    loading: reservationsLoading,
    refetch,
  } = useReservations(profile);

  const [view, setView] = useState('dashboard');
  const [selectedArea, setSelectedArea] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [localProfile, setLocalProfile] = useState(profile);
  const { isSupported: pushSupported, permission, isSubscribed, requestPermission, unsubscribe } = usePushNotifications();

  const allUserReservations = getAllUserReservations();

  // ── Nav routing ─────────────────────────────────────────────────────────────
  const handleNavChange = (id) => {
    if (id === 'profile') { setIsProfileOpen(true); return; }
    if (id === 'dashboard') { setSelectedArea(null); }
    setView(id);
  };

  const handleSelectArea = (area) => {
    setSelectedArea(area);
    setView('form');
  };

  const handleBackToDashboard = () => {
    setSelectedArea(null);
    setView('dashboard');
    refetch();
  };

  const handleConfirmReservation = async (area, date, time) => {
    const newReservation = await handleReservation(area, date, time);
    if (newReservation) {
      toast({
        title: 'Reservación exitosa',
        description: `${newReservation.area_name} confirmada.`,
        duration: 4000,
      });
      handleBackToDashboard();
    }
  };

  const displayProfile = localProfile || profile;
  const firstName = displayProfile?.full_name?.split(' ')[0] || 'Residente';

  // ── Nav view for BottomNav (maps 'form' → 'dashboard') ─────────────────────
  const bottomNavView = view === 'form' ? 'dashboard' : view;

  // ── Content ─────────────────────────────────────────────────────────────────
  const renderContent = () => {
    if (view === 'form' && selectedArea) {
      return (
        <ReservationForm
          selectedArea={selectedArea}
          onBack={handleBackToDashboard}
          onConfirmReservation={handleConfirmReservation}
        />
      );
    }
    if (view === 'myReservations') {
      return (
        <MyReservations
          reservations={allUserReservations}
          onCancel={cancelReservation}
          onNewReservation={() => setView('dashboard')}
          loading={reservationsLoading}
        />
      );
    }
    return (
      <Dashboard
        onSelectArea={handleSelectArea}
        onShowMyReservations={() => setView('myReservations')}
      />
    );
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - Terra Bella</title>
        <meta name="description" content="Gestiona tus reservaciones de áreas comunes." />
      </Helmet>

      <div className="min-h-screen pb-16 md:pb-0">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 bg-[#0C1412]/95 backdrop-blur-sm border-b border-surface-border px-4 md:px-8 h-14 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2.5"
          >
            <img
              src="/icons/icon-192x192.png"
              alt="Terra Bella"
              className="h-8 w-8 rounded-lg object-cover border border-brand-700/50"
            />
            <div className="leading-tight">
              <p className="text-white font-semibold text-sm">Hola, {firstName}</p>
              {displayProfile?.tower && (
                <p className="text-brand-400 text-xs">T{displayProfile.tower} · Apto {displayProfile.apartment}</p>
              )}
            </div>
          </motion.div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            {pushSupported && permission !== 'denied' && (
              <Button
                onClick={isSubscribed ? unsubscribe : requestPermission}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-brand-300"
                title={isSubscribed ? 'Desactivar notificaciones' : 'Activar notificaciones push'}
              >
                {isSubscribed ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              </Button>
            )}
            <Button
              onClick={() => setIsProfileOpen(true)}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <User className="h-4 w-4 mr-1.5" /> Mi Perfil
            </Button>
            <Button
              onClick={onLogout}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-red-300"
            >
              <LogOut className="h-4 w-4 mr-1.5" /> Salir
            </Button>
          </div>

          {/* Mobile: only push bell + logout icon */}
          <div className="flex md:hidden items-center gap-1">
            {pushSupported && permission !== 'denied' && (
              <button
                onClick={isSubscribed ? unsubscribe : requestPermission}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-brand-300"
              >
                {isSubscribed ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
              </button>
            )}
            <button
              onClick={onLogout}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-300"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* ── Main content ───────────────────────────────────────────────────── */}
        <main className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
          {renderContent()}
        </main>
      </div>

      {/* ── Bottom nav (mobile) ────────────────────────────────────────────── */}
      <BottomNav view={bottomNavView} onChangeView={handleNavChange} />

      {/* ── Profile modal ──────────────────────────────────────────────────── */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={displayProfile}
        onProfileUpdated={(updated) => setLocalProfile(updated)}
      />
    </>
  );
};

export default DashboardPage;
