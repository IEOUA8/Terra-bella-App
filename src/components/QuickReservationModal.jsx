import React, { useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Zap } from 'lucide-react';
import { socialAreas } from '@/data/socialAreas';

// Now accepts onCreateReservation and isTimeSlotTaken from parent to ensure unified logic and notifications
export default function QuickReservationModal({ isOpen, onClose, onSuccess, onCreateReservation, isTimeSlotTaken }) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    area_id: '',
    date: '',
    time: '',
    user_name: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Generate slots from 07:00 to 23:00
  const timeSlots = Array.from({ length: 17 }, (_, i) => {
    const hour = i + 7;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!profile) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo identificar al administrador.',
      });
      return;
    }

    const selectedArea = socialAreas.find(area => area.id === formData.area_id);
    if (!selectedArea) {
       toast({ variant: 'destructive', title: 'Error', description: 'Área inválida.' });
       return;
    }

    // Client-side availability check using the passed function (if available)
    // This prevents unnecessary API calls if we already know it's taken locally
    if (isTimeSlotTaken && isTimeSlotTaken(formData.area_id, formData.date, formData.time)) {
       toast({ 
         variant: 'destructive', 
         title: 'Horario no disponible', 
         description: 'Ya existe una reserva confirmada para este horario.' 
       });
       return;
    }

    setSubmitting(true);
    try {
       // Prepare custom details for the reservation
       const customDetails = {
          id: profile.id, // Admin acts as the 'owner' of the record in DB relations
          name: formData.user_name || 'Reserva Administrativa',
          tower: 'ADMIN',
          apartment: 'ADMIN'
      };

      // Use the centralized creator function. This ensures:
      // 1. Validation 2. DB Insertion 3. Push Notification Trigger 4. Refetching
      const result = await onCreateReservation(selectedArea, formData.date, formData.time, customDetails);

      if (result) {
        if(onSuccess) onSuccess(result);
        toast({
          title: '¡Reserva Creada!',
          description: 'La reserva rápida se ha registrado y notificado con éxito.',
        });
        onClose();
        // Reset form partially
        setFormData(prev => ({ ...prev, time: '', user_name: '' }));
      }
    } catch (error) {
      console.error("Quick reservation error:", error);
      // Toast is usually handled by hook, but safety net here
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900/80 border-slate-700 text-white backdrop-blur-sm sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Zap className="text-yellow-400" />
            Reserva Rápida Administrativa
          </DialogTitle>
          <DialogDescription>
            Crea una reserva instantánea. Se enviarán notificaciones automáticamente.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="area">Área Social</Label>
            <Select 
              onValueChange={(value) => setFormData({...formData, area_id: value})}
              required
            >
              <SelectTrigger id="area" className="bg-slate-800 border-slate-600">
                <SelectValue placeholder="Seleccionar área" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600 text-white">
                {socialAreas.map(area => (
                  <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input 
                id="date"
                type="date" 
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="bg-slate-800 border-slate-600"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Hora</Label>
              <Select
                onValueChange={(value) => setFormData({ ...formData, time: value })}
                value={formData.time}
                required
              >
                <SelectTrigger id="time" className="bg-slate-800 border-slate-600">
                  <SelectValue placeholder="Seleccionar hora" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 text-white max-h-[200px]">
                  {timeSlots.map((slot) => {
                     const isTaken = isTimeSlotTaken && isTimeSlotTaken(formData.area_id, formData.date, slot);
                     return (
                      <SelectItem key={slot} value={slot} disabled={isTaken} className={isTaken ? "text-red-400 line-through decoration-red-400" : ""}>
                        {slot} {isTaken ? '(Ocupado)' : ''}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-name">Nombre del Evento o Residente</Label>
            <Input 
              id="event-name"
              type="text" 
              placeholder="Ej: Mantenimiento, Juan Pérez (T1-101)..."
              value={formData.user_name}
              onChange={(e) => setFormData({...formData, user_name: e.target.value})}
              className="bg-slate-800 border-slate-600"
            />
             <p className="text-xs text-slate-400">Si se deja en blanco: "Reserva Administrativa"</p>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting} className="bg-yellow-500 hover:bg-yellow-600 text-slate-900">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              Crear Reserva Rápida
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}