import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const HandoverDialog = ({ isOpen, onClose, onConfirm, reservation, type }) => {
  const [condition, setCondition] = useState('');
  const [observations, setObservations] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setCondition('');
      setObservations('');
    }
  }, [isOpen, type]);

  const handleConfirm = () => {
    if (!condition) {
      toast({
        title: "Condición requerida",
        description: "Por favor, selecciona el estado del área.",
        variant: "destructive",
      });
      return;
    }
    if (onConfirm) {
        onConfirm({ condition, observations });
    }
    onClose();
  };

  if (!isOpen || !type) return null;

  const title = type === 'handover' ? 'Entregar Área' : 'Recibir Área';
  const description = `Registra el estado del área ${reservation?.area_name} al ${type === 'handover' ? 'entregarla' : 'recibirla'} del residente ${reservation?.user_name}.`;
  const buttonLabel = type === 'handover' ? 'Confirmar Entrega' : 'Confirmar Recepción';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="condition" className="text-left mb-2 block text-slate-200">
              Estado del Área
            </Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger id="condition" className="w-full bg-slate-800 border-slate-700 text-white focus:ring-blue-500">
                <SelectValue placeholder="Selecciona una condición" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 text-white border-slate-700">
                <SelectItem value="bueno">Buen estado</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="malo">Mal estado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="observations" className="text-left mb-2 block text-slate-200">
              Observaciones (opcional)
            </Label>
            <Textarea
              id="observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ej: Todo en orden, se encontró un objeto olvidado..."
              className="bg-slate-800 border-slate-700 text-white focus:ring-blue-500 min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="hover:bg-slate-800 text-slate-300">
            Cancelar
          </Button>
          <Button 
            className={type === 'handover' ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
            onClick={handleConfirm}
            disabled={!condition}
          >
            {buttonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HandoverDialog;