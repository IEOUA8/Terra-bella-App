import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, X, Check, Hand, ArrowRightLeft, Calendar, Clock, Home } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import CancelReservationDialog from '@/components/admin/CancelReservationDialog';
import HandoverDialog from './HandoverDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { convertToAmPm } from '@/lib/utils';

const STATUS_CONFIG = {
  confirmed:   { label: 'Confirmada', color: 'bg-blue-500',   icon: Check         },
  in_progress: { label: 'En Curso',   color: 'bg-amber-500',  icon: ArrowRightLeft },
  completed:   { label: 'Completada', color: 'bg-green-500',  icon: Check         },
  cancelled:   { label: 'Cancelada',  color: 'bg-red-500',    icon: X             },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: 'Desconocido', color: 'bg-gray-500', icon: null };
  const Icon = cfg.icon;
  return (
    <Badge className={`${cfg.color} text-white text-xs`}>
      {Icon && <Icon className="mr-1 h-3 w-3" />}
      {cfg.label}
    </Badge>
  );
};

// ── Shared actions state + dialogs ───────────────────────────────────────────
const ActionsMenu = ({ reservation, onCancel, onUpdate, inline = false }) => {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [dialogState, setDialogState] = useState({ isOpen: false, type: null });
  const { hasPermission } = usePermissions();

  const canCancel   = hasPermission('reservations:cancel');
  const canHandover = hasPermission('reservations:handover');
  const canReceive  = hasPermission('reservations:receive');

  const openDialog  = (type) => setDialogState({ isOpen: true, type });
  const closeDialog = () => setDialogState({ isOpen: false, type: null });
  const handleConfirm = (data) => { if (dialogState.type) onUpdate(reservation.id, dialogState.type, data); };

  const showHandover = canHandover && reservation.status === 'confirmed';
  const showReceive  = canReceive  && reservation.status === 'in_progress';
  const showCancel   = canCancel   && !['completed', 'cancelled'].includes(reservation.status);

  return (
    <>
      {inline ? (
        // Mobile: inline action buttons
        <div className="flex gap-2 flex-wrap">
          {showHandover && (
            <Button size="sm" variant="outline" className="border-cyan-700 text-cyan-300 hover:bg-cyan-900/30 h-9 text-xs"
              onClick={() => openDialog('handover')}>
              <Hand className="h-3.5 w-3.5 mr-1" /> Entregar
            </Button>
          )}
          {showReceive && (
            <Button size="sm" variant="outline" className="border-green-700 text-green-300 hover:bg-green-900/30 h-9 text-xs"
              onClick={() => openDialog('receive')}>
              <Check className="h-3.5 w-3.5 mr-1" /> Recibir
            </Button>
          )}
          {showCancel && (
            <Button size="sm" variant="outline" className="border-red-700 text-red-400 hover:bg-red-900/30 h-9 text-xs"
              onClick={() => setCancelOpen(true)}>
              <X className="h-3.5 w-3.5 mr-1" /> Cancelar
            </Button>
          )}
        </div>
      ) : (
        // Desktop: dropdown
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-white/10 text-white">
              <span className="sr-only">Acciones</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-surface-card border-surface-border text-white z-50">
            {showHandover && (
              <DropdownMenuItem onClick={() => openDialog('handover')} className="hover:bg-surface-raised cursor-pointer">
                <Hand className="mr-2 h-4 w-4 text-cyan-400" /> Entregar Área
              </DropdownMenuItem>
            )}
            {showReceive && (
              <DropdownMenuItem onClick={() => openDialog('receive')} className="hover:bg-surface-raised cursor-pointer">
                <Check className="mr-2 h-4 w-4 text-green-400" /> Recibir Área
              </DropdownMenuItem>
            )}
            {showCancel && (
              <DropdownMenuItem className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                onClick={() => setCancelOpen(true)}>
                <X className="mr-2 h-4 w-4" /> Cancelar Reserva
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <CancelReservationDialog
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={(reason) => onCancel(reservation.id, reason)}
        reservation={reservation}
      />
      <HandoverDialog
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        onConfirm={handleConfirm}
        type={dialogState.type}
        reservation={reservation}
      />
    </>
  );
};

// ── Mobile card ──────────────────────────────────────────────────────────────
const ReservationCard = ({ reservation, onCancel, onUpdate, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.04 }}
    className="terra-card p-4 space-y-3"
  >
    <div className="flex items-start justify-between gap-2">
      <h3 className="font-semibold text-white text-base">{reservation.area_name}</h3>
      <StatusBadge status={reservation.status} />
    </div>

    <div className="space-y-1.5 text-sm text-gray-400">
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-200">{reservation.user_name}</span>
      </div>
      <div className="flex items-center gap-2">
        <Home className="h-3.5 w-3.5 shrink-0" />
        Torre {reservation.tower} · Apto {reservation.apartment}
      </div>
      <div className="flex items-center gap-2">
        <Calendar className="h-3.5 w-3.5 shrink-0" />
        {format(new Date(reservation.date + 'T00:00:00'), 'EEE dd MMM yyyy', { locale: es })}
        <Clock className="h-3.5 w-3.5 shrink-0 ml-1" />
        {convertToAmPm(reservation.time)}
      </div>
    </div>

    <div className="pt-1 border-t border-surface-border">
      <ActionsMenu reservation={reservation} onCancel={onCancel} onUpdate={onUpdate} inline />
    </div>
  </motion.div>
);

// ── Main component ────────────────────────────────────────────────────────────
const GuardiaReservationsTable = ({ reservations, onCancel, onUpdate }) => {
  if (!reservations.length) {
    return (
      <div className="terra-card p-12 text-center text-gray-500">
        No hay reservaciones próximas.
      </div>
    );
  }

  return (
    <>
      {/* Mobile: card list */}
      <div className="md:hidden space-y-3">
        {reservations.map((r, i) => (
          <ReservationCard key={r.id} reservation={r} onCancel={onCancel} onUpdate={onUpdate} index={i} />
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block terra-card overflow-hidden">
        <Table>
          <TableHeader className="bg-surface-card/60">
            <TableRow className="border-surface-border hover:bg-transparent">
              {['Área', 'Residente', 'Apto.', 'Fecha y Hora', 'Estado', ''].map(h => (
                <TableHead key={h} className="text-gray-400 font-medium">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.map((r, i) => (
              <motion.tr
                key={r.id}
                className="border-surface-border/50 hover:bg-surface-raised/30 transition-colors text-white"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <TableCell className="font-medium">{r.area_name}</TableCell>
                <TableCell>{r.user_name}</TableCell>
                <TableCell>
                  <div className="flex flex-col leading-tight">
                    <span>T{r.tower}</span>
                    <span className="text-xs text-gray-400">Apto {r.apartment}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col leading-tight">
                    <span>{format(new Date(r.date + 'T00:00:00'), 'EEE dd MMM', { locale: es })}</span>
                    <span className="text-xs text-gray-400">{convertToAmPm(r.time)}</span>
                  </div>
                </TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
                <TableCell className="text-right">
                  <ActionsMenu reservation={r} onCancel={onCancel} onUpdate={onUpdate} />
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default GuardiaReservationsTable;
