import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, Building2, Phone, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

const ProfileModal = ({ isOpen, onClose, profile, onProfileUpdated }) => {
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [isOpen, profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast({ variant: 'destructive', title: 'Nombre requerido', description: 'Por favor ingresa tu nombre.' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.rpc('update_my_profile', {
      p_full_name: fullName.trim(),
      p_phone: phone.trim(),
    });
    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Error al guardar', description: error.message });
    } else {
      toast({ title: 'Perfil actualizado', description: 'Tus datos han sido guardados.' });
      onProfileUpdated?.({ ...profile, full_name: fullName.trim(), phone: phone.trim() });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-5 w-5 text-brand-400" />
            Mi Perfil
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          {/* Read-only fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-gray-400 text-xs flex items-center gap-1">
                <Building2 className="h-3 w-3" /> Torre
              </Label>
              <Input value={profile?.tower || '—'} readOnly className="bg-slate-800/50 border-slate-600 text-gray-400 cursor-not-allowed" />
            </div>
            <div className="space-y-1">
              <Label className="text-gray-400 text-xs">Apartamento</Label>
              <Input value={profile?.apartment || '—'} readOnly className="bg-slate-800/50 border-slate-600 text-gray-400 cursor-not-allowed" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-gray-400 text-xs flex items-center gap-1">
              <Mail className="h-3 w-3" /> Correo electrónico
            </Label>
            <Input value={profile?.email || '—'} readOnly className="bg-slate-800/50 border-slate-600 text-gray-400 cursor-not-allowed" />
          </div>

          {/* Editable fields */}
          <div className="border-t border-slate-700 pt-4 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre"
                className="bg-slate-800 border-slate-600"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone" className="flex items-center gap-1">
                <Phone className="h-3 w-3" /> Teléfono
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Número de contacto"
                className="bg-slate-800 border-slate-600"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-slate-600">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="bg-brand-600 hover:bg-brand-700">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
