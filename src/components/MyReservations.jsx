import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, PlusCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_CONFIG = {
  confirmed:   { label: 'Confirmada',  icon: CheckCircle, color: 'bg-green-500' },
  in_progress: { label: 'En curso',    icon: Clock,       color: 'bg-blue-500'  },
  cancelled:   { label: 'Cancelada',   icon: XCircle,     color: 'bg-red-500'   },
  completed:   { label: 'Completada',  icon: CheckCircle, color: 'bg-gray-500'  },
};

const ReservationCard = ({ reservation, onCancelRequest, showCancel }) => {
  const cfg = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.confirmed;
  const Icon = cfg.icon;

  return (
    <div className="flex items-center justify-between bg-white/5 rounded-lg p-4 gap-3">
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{reservation.area_name}</div>
        <div className="text-sm text-gray-400">
          {format(new Date(reservation.date + 'T00:00:00'), 'EEE, dd MMM yyyy', { locale: es })} · {reservation.time}
        </div>
        {reservation.cancellation_reason && (
          <div className="text-xs text-red-400 mt-1">Motivo: {reservation.cancellation_reason}</div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge className={`${cfg.color} text-white text-xs flex items-center gap-1`}>
          <Icon className="h-3 w-3" />
          {cfg.label}
        </Badge>
        {showCancel && (
          <Button variant="destructive" size="sm" onClick={() => onCancelRequest(reservation)}>
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
};

const CardSkeleton = () => (
  <div className="flex items-center justify-between bg-white/5 rounded-lg p-4 gap-3">
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-40 bg-white/10" />
      <Skeleton className="h-3 w-56 bg-white/10" />
    </div>
    <Skeleton className="h-6 w-24 bg-white/10 rounded-full" />
  </div>
);

const EmptyState = ({ onNewReservation, message }) => (
  <div className="text-center py-8">
    <p className="text-gray-400">{message}</p>
    {onNewReservation && (
      <Button
        onClick={onNewReservation}
        className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white"
      >
        <PlusCircle className="w-5 h-5 mr-2" />
        Hacer una reserva
      </Button>
    )}
  </div>
);

const MyReservations = ({ reservations, onCancel, onNewReservation, loading }) => {
  const [pendingCancel, setPendingCancel] = useState(null);

  const active  = reservations.filter(r => r.status === 'confirmed' || r.status === 'in_progress');
  const history = reservations.filter(r => r.status === 'cancelled' || r.status === 'completed');

  const handleConfirmCancel = async () => {
    if (!pendingCancel) return;
    await onCancel(pendingCancel.id);
    setPendingCancel(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="terra-card p-6"
    >
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <Calendar className="w-5 h-5 mr-2" />
        Mis Reservas
      </h3>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 mb-4">
          <TabsTrigger value="active">
            Activas
            {active.length > 0 && (
              <span className="ml-2 bg-brand-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {active.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <CardSkeleton key={i} />)}
            </div>
          ) : active.length === 0 ? (
            <EmptyState onNewReservation={onNewReservation} message="No tienes reservas activas" />
          ) : (
            <div className="space-y-3">
              {active.map(r => (
                <ReservationCard key={r.id} reservation={r} onCancelRequest={setPendingCancel} showCancel />
              ))}
            </div>
          )}
          <div className="mt-4 text-center">
            <Button onClick={onNewReservation} variant="ghost" className="text-brand-300 hover:text-white">
              <PlusCircle className="w-4 h-4 mr-2" /> Nueva reserva
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="history">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
            </div>
          ) : history.length === 0 ? (
            <EmptyState message="No tienes reservas en el historial" />
          ) : (
            <div className="space-y-3">
              {history.map(r => (
                <ReservationCard key={r.id} reservation={r} showCancel={false} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!pendingCancel} onOpenChange={(open) => !open && setPendingCancel(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar esta reserva?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {pendingCancel && (
                <>
                  <strong className="text-white">{pendingCancel.area_name}</strong> —{' '}
                  {format(new Date(pendingCancel.date + 'T00:00:00'), 'EEEE dd MMM yyyy', { locale: es })} a las {pendingCancel.time}.
                  <br />Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-gray-300 hover:bg-slate-800">
              Volver
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sí, cancelar reserva
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default MyReservations;
