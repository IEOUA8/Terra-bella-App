import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CancelReservationDialog from '@/components/admin/CancelReservationDialog';

const ReservationsTable = ({ reservations, onCancelReservation }) => {
  const [reservationToCancel, setReservationToCancel] = useState(null);

  const handleCancelClick = (reservation) => {
    setReservationToCancel(reservation);
  };

  const handleConfirmCancel = (reason) => {
    if (reservationToCancel) {
      onCancelReservation(reservationToCancel.id, reason);
      setReservationToCancel(null);
    }
  };

  const upcomingReservations = useMemo(() => {
    const now = new Date();
    // Cutoff is 24 hours in the past from now.
    const cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return reservations
      .filter(reservation => {
        if (!reservation.date || !reservation.time) return false;

        const [hours, minutes] = reservation.time.split(':').map(Number);
        
        // Create a date object from YYYY-MM-DD string, treating it as local date
        const reservationDateParts = reservation.date.split('-').map(Number);
        const reservationEndDate = new Date(reservationDateParts[0], reservationDateParts[1] - 1, reservationDateParts[2], hours, minutes);

        // Show reservation if its end time is after the 24-hour cutoff
        return reservationEndDate >= cutoffDate;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date) || a.time.localeCompare(b.time));
  }, [reservations]);


  return (
    <>
      <Card className="bg-white/5 border-white/10 text-white">
        <CardHeader>
          <CardTitle>Reservas Actuales y Próximas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 uppercase bg-white/10">
                <tr>
                  <th scope="col" className="px-6 py-3">Área</th>
                  <th scope="col" className="px-6 py-3">Residente</th>
                  <th scope="col" className="px-6 py-3">Torre / Apto</th>
                  <th scope="col" className="px-6 py-3">Fecha y Hora</th>
                  <th scope="col" className="px-6 py-3">Estado</th>
                  <th scope="col" className="px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {upcomingReservations.length > 0 ? (
                  upcomingReservations.map((reservation, index) => (
                    <motion.tr
                      key={reservation.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-white/10 hover:bg-white/5"
                    >
                      <td className="px-6 py-4 font-medium">{reservation.area_name}</td>
                      <td className="px-6 py-4">{reservation.user_name || 'N/A'}</td>
                      <td className="px-6 py-4">{reservation.tower} / {reservation.apartment}</td>
                      <td className="px-6 py-4">{reservation.date} @ {reservation.time}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          reservation.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 
                          reservation.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                          reservation.status === 'completed' ? 'bg-gray-500/20 text-gray-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {reservation.status === 'confirmed' ? 'Confirmada' :
                           reservation.status === 'in_progress' ? 'En Curso' :
                           reservation.status === 'completed' ? 'Completada' : 'Cancelada'
                          }
                        </span>
                        {reservation.status === 'cancelled' && reservation.cancellation_reason && (
                          <p className="text-xs text-gray-400 mt-1 italic">"{reservation.cancellation_reason}"</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {reservation.status === 'confirmed' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelClick(reservation)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-400">
                      No hay reservas actuales o futuras.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <CancelReservationDialog
        isOpen={!!reservationToCancel}
        onClose={() => setReservationToCancel(null)}
        onConfirm={handleConfirmCancel}
        reservation={reservationToCancel}
      />
    </>
  );
};

export default ReservationsTable;