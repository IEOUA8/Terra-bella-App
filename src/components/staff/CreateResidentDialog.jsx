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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CreateResidentDialog = ({ isOpen, onClose, onCreateResident }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tower, setTower] = useState('');
  const [apartment, setApartment] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setTower('');
      setApartment('');
      setPhone('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!name || !email || !tower || !apartment) {
       toast({ title: "Información incompleta", description: "Nombre, correo, torre y apartamento son obligatorios.", variant: "destructive" });
       return;
    }
    onCreateResident({ name, email, tower, apartment, phone });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Residente</DialogTitle>
          <DialogDescription>
            Añade un nuevo residente al sistema. Se enviará un correo para que establezca su contraseña.
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="py-4 space-y-4"
        >
          <div>
            <Label htmlFor="resident-name">Nombre Completo</Label>
            <Input id="resident-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Jorge González" className="bg-slate-800 border-slate-700"/>
          </div>
          <div>
            <Label htmlFor="resident-email">Correo Electrónico</Label>
            <Input id="resident-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Ej: jorge.g@email.com" className="bg-slate-800 border-slate-700"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tower">Torre</Label>
              <Select value={tower} onValueChange={setTower}>
                  <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 text-white border-slate-700">
                    <SelectItem value="1">Torre 1</SelectItem>
                    <SelectItem value="2">Torre 2</SelectItem>
                    <SelectItem value="3">Torre 3</SelectItem>
                  </SelectContent>
              </Select>
            </div>
             <div>
               <Label htmlFor="apartment">Apartamento</Label>
               <Input id="apartment" value={apartment} onChange={e => setApartment(e.target.value)} placeholder="Ej: 202" className="bg-slate-800 border-slate-700"/>
            </div>
          </div>
           <div>
            <Label htmlFor="resident-phone">Teléfono (Opcional)</Label>
            <Input id="resident-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Número de contacto" className="bg-slate-800 border-slate-700"/>
          </div>
        </motion.div>

        <DialogFooter>
           <Button variant="outline" onClick={onClose}>Cancelar</Button>
           <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">Crear Residente</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateResidentDialog;