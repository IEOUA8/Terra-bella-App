import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Pencil, Search, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const ROLE_LABELS = { resident: 'Residente', admin: 'Admin', super_admin: 'Super Admin', guardia: 'Guardia' };
const ROLE_COLORS = { resident: 'bg-blue-500', admin: 'bg-purple-500', super_admin: 'bg-red-500', guardia: 'bg-amber-500' };

const EditProfileDialog = ({ profile, isOpen, onClose, onSaved }) => {
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setRole(profile.role || 'resident');
    }
  }, [isOpen, profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.rpc('admin_update_profile', {
      p_user_id: profile.id,
      p_full_name: fullName.trim(),
      p_phone: phone.trim(),
      p_role: role,
    });
    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Error al guardar', description: error.message });
    } else {
      toast({ title: 'Perfil actualizado' });
      onSaved?.({ ...profile, full_name: fullName.trim(), phone: phone.trim(), role });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 py-2">
          <div className="text-sm text-gray-400">
            {profile?.email} — Torre {profile?.tower}, Apto {profile?.apartment}
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-name">Nombre completo</Label>
            <Input id="edit-name" value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="bg-slate-800 border-slate-600" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-phone">Teléfono</Label>
            <Input id="edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="Número de contacto" className="bg-slate-800 border-slate-600" />
          </div>
          <div className="space-y-1">
            <Label>Rol</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 text-white border-slate-700">
                <SelectItem value="resident">Residente</SelectItem>
                <SelectItem value="guardia">Guardia</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-slate-600">Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-brand-600 hover:bg-brand-700">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ResidentsPanel = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingProfile, setEditingProfile] = useState(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role, tower, apartment, phone')
      .order('full_name', { ascending: true });
    if (error) {
      toast({ variant: 'destructive', title: 'Error al cargar residentes', description: error.message });
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const handleSaved = (updated) => {
    setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.apartment?.toLowerCase().includes(q) ||
      p.tower?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-5 w-36 bg-slate-700" />
          <Skeleton className="h-9 w-64 bg-slate-700 rounded-md" />
        </div>
        <div className="rounded-lg border border-slate-700 overflow-hidden">
          <div className="bg-slate-800/60 px-4 py-3 grid grid-cols-6 gap-4">
            {[140, 180, 120, 100, 80, 32].map((w, i) => (
              <Skeleton key={i} className="h-4 bg-slate-700" style={{ width: w }} />
            ))}
          </div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="px-4 py-3 grid grid-cols-6 gap-4 border-t border-slate-700/50">
              {[140, 180, 120, 100, 80, 32].map((w, j) => (
                <Skeleton key={j} className="h-4 bg-slate-700/50" style={{ width: w }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-gray-300">
          <Users className="h-5 w-5" />
          <span className="text-sm">{profiles.length} usuarios registrados</span>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre, email, apto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-800 border-slate-600 text-white placeholder:text-gray-500"
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-800/60">
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead className="text-gray-400">Nombre</TableHead>
              <TableHead className="text-gray-400">Correo</TableHead>
              <TableHead className="text-gray-400">Torre / Apto</TableHead>
              <TableHead className="text-gray-400">Teléfono</TableHead>
              <TableHead className="text-gray-400">Rol</TableHead>
              <TableHead className="text-gray-400 w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  No se encontraron usuarios
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id} className="border-slate-700/50 hover:bg-slate-800/30 text-white">
                  <TableCell className="font-medium">{p.full_name || '—'}</TableCell>
                  <TableCell className="text-gray-400 text-sm">{p.email}</TableCell>
                  <TableCell className="text-sm">
                    {p.tower ? `T${p.tower} – Apto ${p.apartment}` : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-400">{p.phone || '—'}</TableCell>
                  <TableCell>
                    <Badge className={`${ROLE_COLORS[p.role] || 'bg-gray-500'} text-white text-xs`}>
                      {ROLE_LABELS[p.role] || p.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-slate-700 text-gray-400 hover:text-white"
                      onClick={() => setEditingProfile(p)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EditProfileDialog
        profile={editingProfile}
        isOpen={!!editingProfile}
        onClose={() => setEditingProfile(null)}
        onSaved={handleSaved}
      />
    </div>
  );
};

export default ResidentsPanel;
