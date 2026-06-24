import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea }
 from '@/components/ui/textarea';

const CancelReservationDialog = ({ isOpen, onClose, onConfirm, reservation }) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason || 'Cancelado por personal');
    setReason('');
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Cancelar Reserva</DialogTitle>
          <DialogDescription>
            Estás a punto de cancelar la reserva para{' '}
            <span className="font-bold">{reservation?.area_name}</span> el{' '}
            <span className="font-bold">{reservation?.date}</span> del residente{' '}
            <span className="font-bold">{reservation?.user_name} (T{reservation?.tower}/{reservation?.apartment})</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="reason" className="text-left mb-2 block">
            Motivo de la cancelación (opcional)
          </Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: Mantenimiento del área, no pago de cuotas..."
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          <Button variant="destructive" onClick={handleConfirm}>Confirmar Cancelación</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelReservationDialog;