import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { socialAreas } from '@/data/socialAreas';
import { convertToAmPm } from '@/lib/utils';


const StaffReservationDialog = ({ isOpen, onClose, onConfirmReservation, isTimeSlotTaken }) => {
  const [step, setStep] = useState(1);
  const [residentName, setResidentName] = useState('');
  const [tower, setTower] = useState('');
  const [apartment, setApartment] = useState('');
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset state when dialog opens
      setStep(1);
      setResidentName('');
      setTower('');
      setApartment('');
      setSelectedArea(null);
      setSelectedDate('');
      setSelectedTime('');
    }
  }, [isOpen]);

  const handleAreaSelect = (area) => {
    setSelectedArea(area);
    const today = new Date();
    today.setDate(today.getDate() + (area.minNoticeDays || 0));
    setSelectedDate(today.toISOString().split('T')[0]);
    setSelectedTime(''); // Reset time when area changes
    setStep(2);
  };

  const handleDateTimeSelect = () => {
    if (!selectedTime) {
      toast({ title: "Seleccione una hora", variant: "destructive" });
      return;
    }
    setStep(3);
  };

  const handleConfirm = async () => {
    if (!residentName || !tower || !apartment) {
       toast({ title: "Información del residente incompleta", variant: "destructive" });
       return;
    }
    const residentDetails = { name: residentName, tower, apartment };
    const newReservation = await onConfirmReservation(selectedArea, selectedDate, selectedTime, residentDetails);
    if (newReservation) {
      onClose();
    }
  };
  
  const getMinDate = () => {
    if (!selectedArea) return new Date().toISOString().split('T')[0];
    const today = new Date();
    today.setDate(today.getDate() + (selectedArea.minNoticeDays || 0));
    return today.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva Reserva para Residente</DialogTitle>
          <DialogDescription>
            {step === 1 && "Seleccione el área social a reservar."}
            {step === 2 && `Seleccione fecha y hora para ${selectedArea?.name}.`}
            {step === 3 && "Ingrese los datos del residente."}
          </DialogDescription>
        </DialogHeader>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="py-4"
        >
          {step === 1 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {socialAreas.map(area => (
                <Button key={area.id} variant="outline" className="h-24 flex-col gap-2 bg-slate-800 hover:bg-slate-700 text-white" onClick={() => handleAreaSelect(area)}>
                   <span className="text-3xl">{area.icon}</span>
                  <span className="text-center">{area.name}</span>
                </Button>
              ))}
            </div>
          )}

          {step === 2 && selectedArea && (
            <div className="space-y-4">
               <div>
                  <Label htmlFor="date">Fecha</Label>
                  <Input id="date" type="date" value={selectedDate} min={getMinDate()} onChange={e => setSelectedDate(e.target.value)} className="bg-slate-800 border-slate-700"/>
               </div>
               <div>
                  <Label>Hora</Label>
                   <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-2">
                    {selectedArea.timeSlots.map(time => {
                      const isTaken = isTimeSlotTaken(selectedArea.id, selectedDate, time);
                      return (
                        <Button
                          key={time}
                          variant={selectedTime === time ? 'default' : isTaken ? 'destructive' : 'secondary'}
                          disabled={isTaken}
                          onClick={() => !isTaken && setSelectedTime(time)}
                          className={isTaken ? "cursor-not-allowed" : ""}
                        >
                          {convertToAmPm(time)}
                        </Button>
                      )
                    })}
                   </div>
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="resident-name">Nombre del Residente</Label>
                <Input id="resident-name" value={residentName} onChange={e => setResidentName(e.target.value)} placeholder="Ej: Jorge González" className="bg-slate-800 border-slate-700"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <Label htmlFor="tower">Torre</Label>
                   <Input id="tower" value={tower} onChange={e => setTower(e.target.value)} placeholder="Ej: 1" className="bg-slate-800 border-slate-700"/>
                </div>
                 <div>
                   <Label htmlFor="apartment">Apartamento</Label>
                   <Input id="apartment" value={apartment} onChange={e => setApartment(e.target.value)} placeholder="Ej: 202" className="bg-slate-800 border-slate-700"/>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        <DialogFooter className="justify-between mt-4">
           <div>
            {step > 1 && <Button variant="ghost" onClick={() => setStep(s => s - 1)}>Anterior</Button>}
           </div>
           <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              {step === 2 && <Button onClick={handleDateTimeSelect} disabled={!selectedTime}>Siguiente</Button>}
              {step === 3 && <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">Confirmar Reserva</Button>}
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StaffReservationDialog;