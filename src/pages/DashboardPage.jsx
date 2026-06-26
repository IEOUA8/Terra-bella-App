import React, { useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { LogOut, User, Bell, BellOff } from 'lucide-react';
import { Helmet } from 'react-helmet';
import ReservationForm from '@/components/ReservationForm';
import Dashboard from '@/components/Dashboard';
import useReservations from '@/hooks/useReservations';
import { useToast } from "@/components/ui/use-toast";
import MyReservations from '@/components/MyReservations';
import ProfileModal from '@/components/ProfileModal';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const DashboardPage = ({ onLogout }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const {
    handleReservation,
    cancelReservation,
    getUserReservations,
    getAllUserReservations,
    loading: reservationsLoading,
    isTimeSlotTaken,
    refetch
  } = useReservations(profile);

  const [view, setView] = useState('dashboard'); // 'dashboard', 'form', 'myReservations'
  const [selectedArea, setSelectedArea] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [localProfile, setLocalProfile] = useState(profile);
  const { isSupported: pushSupported, permission, isSubscribed, requestPermission, unsubscribe } = usePushNotifications();

  const allUserReservations = getAllUserReservations();

  const handleSelectArea = (area) => {
    setSelectedArea(area);
    setView('form');
  };

  const handleBackToDashboard = () => {
    setSelectedArea(null);
    setView('dashboard');
    refetch();
  };
  
  const handleShowMyReservations = () => {
    setView('myReservations');
  };

  const handleConfirmReservation = async (area, date, time) => {
    const newReservation = await handleReservation(area, date, time);
    if (newReservation) {
      toast({
        title: "Reservacion Exitosa",
        description: `Tu reservación para ${newReservation.area_name} ha sido confirmada.`,
        duration: 5000,
      });
      handleBackToDashboard();
    }
  };

  const handleProfileUpdated = (updated) => {
    setLocalProfile(updated);
  };

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
        onShowMyReservations={handleShowMyReservations}
      />
    );
  };

  const displayProfile = localProfile || profile;

  return (
    <>
      <Helmet>
        <title>Dashboard de Residente - TerraBella</title>
        <meta name="description" content="Gestiona tus reservaciones de áreas comunes y revisa tu historial." />
      </Helmet>
      <div className="min-h-screen p-4 md:p-8">
        <header className="flex justify-between items-center mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <img
              src="/icons/icon-192x192.png"
              alt="TerraBell Logo"
              className="h-12 w-12 rounded-lg object-cover border-2 border-brand-500 shadow-lg shadow-brand-500/20"
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Hola, {displayProfile?.full_name?.split(' ')[0] || 'Residente'}
              </h1>
              <p className="text-brand-400 text-sm">Terra Bella · Torre {displayProfile?.tower} · Apto {displayProfile?.apartment}</p>
            </div>
          </motion.div>
          <div className="flex items-center gap-2">
            {pushSupported && permission !== 'denied' && (
              <Button
                onClick={isSubscribed ? unsubscribe : requestPermission}
                variant="ghost"
                size="sm"
                className="text-brand-300 hover:text-white hover:bg-brand-500/20"
                title={isSubscribed ? 'Desactivar notificaciones' : 'Activar notificaciones push'}
              >
                {isSubscribed ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              </Button>
            )}
            <Button
              onClick={() => setIsProfileOpen(true)}
              variant="ghost"
              className="text-brand-300 hover:text-white hover:bg-brand-500/20"
            >
              <User className="mr-2 h-4 w-4" /> Mi Perfil
            </Button>
            <Button onClick={onLogout} variant="ghost" className="text-brand-300 hover:text-white hover:bg-brand-500/20">
              <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
            </Button>
          </div>
        </header>

        <main>
          {renderContent()}
        </main>
      </div>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={displayProfile}
        onProfileUpdated={handleProfileUpdated}
      />
    </>
  );
};

export default DashboardPage;