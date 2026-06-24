import React, { useMemo } from 'react';
import GuardiaReservationsTable from './GuardiaReservationsTable';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const GuardiaDashboard = ({ reservations, onCancelReservation, onUpdateReservation, loading }) => {
  const upcomingReservations = useMemo(() => {
    const now = new Date();
    // Cutoff is 24 hours in the past
    const cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); 

    return reservations.filter(r => {
      if (!r.date || !r.time) return false;

      const [hours, minutes] = r.time.split(':').map(Number);
      
      // Create a date object from YYYY-MM-DD string, treating it as local date
      const reservationDateParts = r.date.split('-').map(Number);
      const reservationEndDate = new Date(reservationDateParts[0], reservationDateParts[1] - 1, reservationDateParts[2], hours, minutes);

      // The reservation is considered "past" after its end time. We show it for 24h after that.
      return reservationEndDate > cutoffDate;
    }).filter(r => r.status === 'confirmed' || r.status === 'in_progress');
  }, [reservations]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-white">Reservas Próximas y en Curso</h2>
        <GuardiaReservationsTable 
          reservations={upcomingReservations} 
          onCancel={onCancelReservation}
          onUpdate={onUpdateReservation}
        />
      </div>
    </motion.div>
  );
};

export default GuardiaDashboard;