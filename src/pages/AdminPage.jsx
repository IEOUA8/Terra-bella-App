import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { LogOut, PlusCircle, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminDashboard from '@/components/admin/AdminDashboard';
import StaffReservationDialog from '@/components/staff/StaffReservationDialog';
import QuickReservationModal from '@/components/QuickReservationModal';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import useReservations from '@/hooks/useReservations';
import NotificationBadge from '@/components/NotificationBadge'; 

const AdminPage = ({ onLogout }) => {
  const { profile } = useAuth();
  const [isStaffReservationOpen, setStaffReservationOpen] = useState(false);
  const [isQuickReservationOpen, setQuickReservationOpen] = useState(false);
  const { reservations, loading, handleReservation, cancelReservationWithReason, isTimeSlotTaken } = useReservations(profile);

  // Wrapper for staff dialog which collects complex resident details
  const handleStaffReservation = async (area, date, time, residentDetails) => {
    const reservationData = {
      ...residentDetails,
      id: profile.id, // Using admin's ID for auth context, but data has resident info
      name: residentDetails.name,
    };
    const result = await handleReservation(area, date, time, reservationData);
    return result;
  };

  return (
    <>
      <Helmet>
        <title>Panel de Administrador - Terra Bella</title>
        <meta name="description" content="Gestión administrativa de Terra Bella." />
      </Helmet>
      
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"
        >
          <div className="flex items-center gap-4">
            <img 
               src="https://images.unsplash.com/photo-1525280996482-4beab0fdd409" 
               alt="TerraBell Logo" 
               className="h-14 w-14 rounded-lg object-cover border-2 border-brand-500 shadow-xl" 
            />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-300 to-white bg-clip-text text-transparent">
                Panel de Administrador
              </h1>
              <p className="text-brand-200/80 mt-1">Bienvenido, {profile?.full_name || 'Admin'}.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" className="bg-brand-500/10 border-brand-500/30 text-brand-300 hover:bg-brand-500/20 hover:text-white" onClick={() => setQuickReservationOpen(true)}>
              <Zap className="mr-2 h-4 w-4" />
              Reserva Rápida
            </Button>
            <Button variant="outline" className="bg-white/10 hover:bg-white/20 border-white/10" onClick={() => setStaffReservationOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Reserva
            </Button>
            <NotificationBadge />
            <Button variant="ghost" onClick={onLogout} className="hover:bg-red-500/20 hover:text-red-200">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </motion.header>

        <main>
          <AdminDashboard 
            reservations={reservations} 
            onCancelReservation={cancelReservationWithReason}
            loading={loading}
          />
        </main>
      </div>
      
      <StaffReservationDialog
        isOpen={isStaffReservationOpen}
        onClose={() => setStaffReservationOpen(false)}
        onConfirmReservation={handleStaffReservation}
        isTimeSlotTaken={isTimeSlotTaken}
      />

      <QuickReservationModal
        isOpen={isQuickReservationOpen}
        onClose={() => setQuickReservationOpen(false)}
        onCreateReservation={handleReservation}
        isTimeSlotTaken={isTimeSlotTaken}
        onSuccess={(reservation) => {
            console.log('Quick reservation created:', reservation);
        }}
      />
    </>
  );
};

export default AdminPage;