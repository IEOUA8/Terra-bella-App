import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const MyReservations = ({ reservations, onCancel, onNewReservation }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
    >
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <Calendar className="w-5 h-5 mr-2" />
        Mis Reservas Activas
      </h3>
      {reservations.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-400">No tienes reservas activas</p>
          <Button
            onClick={onNewReservation}
            className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Hacer una reserva
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((reservation) => (
            <div key={reservation.id} className="flex items-center justify-between bg-white/5 rounded-lg p-4">
              <div>
                <div className="font-medium">{reservation.area_name}</div>
                <div className="text-sm text-gray-400">
                  {format(new Date(reservation.date + 'T00:00:00'), 'EEE, dd MMM yyyy', { locale: es })} a las {reservation.time}
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onCancel(reservation.id)}
              >
                Cancelar
              </Button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default MyReservations;