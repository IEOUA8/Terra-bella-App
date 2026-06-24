import React from 'react';
import { motion } from 'framer-motion';
import { Check, Mail, Home, Calendar, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const ReservationConfirmationModal = ({ isOpen, onOpenChange, reservation, userEmail }) => {
  if (!reservation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-950 border-purple-500/50 text-white">
        <DialogHeader>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500"
          >
            <Check className="h-6 w-6 text-white" />
          </motion.div>
          <DialogTitle className="text-center text-2xl font-bold mt-4">¡Reserva Confirmada!</DialogTitle>
          <DialogDescription className="text-center text-slate-400 mt-2">
            Tu reserva ha sido procesada exitosamente.
          </DialogDescription>
        </DialogHeader>
        <div className="my-6 space-y-4 text-sm">
          <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
            <Home className="h-5 w-5 text-purple-400" />
            <span className="font-semibold">{reservation.areaName}</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
            <Calendar className="h-5 w-5 text-purple-400" />
            <span>{new Date(reservation.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
            <Clock className="h-5 w-5 text-purple-400" />
            <span>{reservation.time}</span>
          </div>
        </div>
        <div className="mt-4 flex items-start space-x-3 text-xs text-slate-400 bg-white/5 p-3 rounded-lg">
          <Mail className="h-4 w-4 mt-0.5 text-green-400 flex-shrink-0" />
          <p>
            Hemos enviado una copia de la confirmación a tu correo electrónico{' '}
            <span className="font-semibold text-green-400">{userEmail}</span> para tus registros.
          </p>
        </div>
        <Button onClick={() => onOpenChange(false)} className="w-full mt-6 bg-purple-600 hover:bg-purple-700">
          Entendido
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ReservationConfirmationModal;