import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, X, Check, Hand, ArrowRightLeft } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import CancelReservationDialog from '@/components/admin/CancelReservationDialog';
import HandoverDialog from './HandoverDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { convertToAmPm } from '@/lib/utils';

const statusConfig = {
  confirmed: { label: "Confirmada", color: "bg-blue-500", icon: Check },
  in_progress: { label: "En Curso", color: "bg-yellow-500", icon: ArrowRightLeft },
  completed: { label: "Completada", color: "bg-green-500", icon: Check },
  cancelled: { label: "Cancelada", color: "bg-red-500", icon: X },
};

const getStatusBadge = (status) => {
  const config = statusConfig[status] || { label: "Desconocido", color: "bg-gray-500" };
  const Icon = config.icon;
  return (
    <Badge className={`${config.color} hover:${config.color} text-white`}>
      {Icon && <Icon className="mr-1 h-3 w-3" />}
      {config.label}
    </Badge>
  );
};

const ActionsMenu = ({ reservation, onCancel, onUpdate }) => {
  const [isCancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [dialogState, setDialogState] = useState({ isOpen: false, type: null });
  const { hasPermission } = usePermissions();
  
  const canCancel = hasPermission('reservations:cancel');
  const canHandover = hasPermission('reservations:handover');
  const canReceive = hasPermission('reservations:receive');

  const openDialog = (type) => setDialogState({ isOpen: true, type });
  const closeDialog = () => setDialogState({ isOpen: false, type: null });

  const handleConfirm = (data) => {
    if (dialogState.type) {
      onUpdate(reservation.id, dialogState.type, data);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-white/10 text-white">
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-slate-800 text-white border-slate-700">
          {/* Handover Action (For Confirmed/Upcoming) */}
          {canHandover && reservation.status === 'confirmed' && (
            <DropdownMenuItem onClick={() => openDialog('handover')} className="hover:bg-slate-700 cursor-pointer">
              <Hand className="mr-2 h-4 w-4 text-cyan-400" />
              Entregar Área
            </DropdownMenuItem>
          )}
          
          {/* Receive Action (For In Progress) */}
          {canReceive && reservation.status === 'in_progress' && (
            <DropdownMenuItem onClick={() => openDialog('receive')} className="hover:bg-slate-700 cursor-pointer">
              <Check className="mr-2 h-4 w-4 text-emerald-400" />
              Recibir Área
            </DropdownMenuItem>
          )}
          
          {/* Cancel Action */}
          {canCancel && !['completed', 'cancelled'].includes(reservation.status) && (
            <DropdownMenuItem className="text-red-400 focus:text-red-400 focus:bg-red-500/20 cursor-pointer" onClick={() => setCancelDialogOpen(true)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar Reserva
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CancelReservationDialog
        isOpen={isCancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
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

const GuardiaReservationsTable = ({ reservations, onCancel, onUpdate }) => {
  const MotionTableRow = motion(TableRow);

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-4 text-white">
      <Table>
        <TableHeader>
          <TableRow className="border-white/20 hover:bg-transparent">
            <TableHead className="text-white font-bold">Área</TableHead>
            <TableHead className="text-white font-bold">Residente</TableHead>
            <TableHead className="text-white font-bold">Apto.</TableHead>
            <TableHead className="text-white font-bold">Fecha y Hora</TableHead>
            <TableHead className="text-white font-bold">Estado</TableHead>
            <TableHead className="text-white font-bold text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations.map((reservation, index) => (
            <MotionTableRow
              key={reservation.id}
              className="border-white/20 hover:bg-white/5 transition-colors"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <TableCell className="font-medium">{reservation.area_name}</TableCell>
              <TableCell>{reservation.user_name}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>Torre {reservation.tower}</span>
                  <span className="text-xs text-gray-400">Apto {reservation.apartment}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{format(new Date(reservation.date + 'T00:00:00'), 'EEE, dd MMM', { locale: es })}</span>
                  <span className="text-gray-400 text-xs">{convertToAmPm(reservation.time)}</span>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(reservation.status)}</TableCell>
              <TableCell className="text-right">
                <ActionsMenu reservation={reservation} onCancel={onCancel} onUpdate={onUpdate} />
              </TableCell>
            </MotionTableRow>
          ))}
        </TableBody>
      </Table>
       {reservations.length === 0 && (
        <div className="text-center py-12 text-gray-400 flex flex-col items-center">
           <p>No se encontraron reservaciones.</p>
        </div>
      )}
    </div>
  );
};

export default GuardiaReservationsTable;