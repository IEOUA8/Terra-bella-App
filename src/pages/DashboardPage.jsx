import React, { useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { Helmet } from 'react-helmet';
import ReservationForm from '@/components/ReservationForm';
import Dashboard from '@/components/Dashboard';
import useReservations from '@/hooks/useReservations';
import { useToast } from "@/components/ui/use-toast";
import MyReservations from '@/components/MyReservations';

const DashboardPage = ({ onLogout }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const { 
    handleReservation, 
    cancelReservation, 
    getUserReservations,
    loading: reservationsLoading,
    isTimeSlotTaken,
    refetch
  } = useReservations(profile);
  
  const [view, setView] = useState('dashboard'); // 'dashboard', 'form', 'myReservations'
  const [selectedArea, setSelectedArea] = useState(null);
  
  const userReservations = getUserReservations();

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
        title: "🎉 ¡Reservación Exitosa!",
        description: `Tu reservación para ${newReservation.area_name} ha sido confirmada.`,
        duration: 5000,
      });
      handleBackToDashboard();
    }
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

    if(view === 'myReservations') {
      return(
        <MyReservations 
          reservations={userReservations} 
          onCancel={cancelReservation} 
          onNewReservation={() => setView('dashboard')} 
          loading={reservationsLoading}
        />
      )
    }

    return (
      <Dashboard 
        onSelectArea={handleSelectArea} 
        onShowMyReservations={handleShowMyReservations}
      />
    );
  };

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
               src="https://images.unsplash.com/photo-1525280996482-4beab0fdd409" 
               alt="TerraBell Logo" 
               className="h-12 w-12 rounded-lg object-cover border-2 border-brand-500 shadow-lg shadow-brand-500/20" 
             />
             <div>
               <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-brand-300">
                 Bienvenido, {profile?.full_name || user?.email}
               </h1>
               <p className="text-brand-200">Aquí puedes gestionar tus reservaciones.</p>
             </div>
          </motion.div>
          <Button onClick={onLogout} variant="ghost" className="text-brand-300 hover:text-white hover:bg-brand-500/20">
            <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
          </Button>
        </header>

        <main>
          {renderContent()}
        </main>
      </div>
    </>
  );
};

export default DashboardPage;