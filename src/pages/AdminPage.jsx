import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { LogOut, PlusCircle, Zap, UserPlus, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminDashboard from '@/components/admin/AdminDashboard';
import StaffReservationDialog from '@/components/staff/StaffReservationDialog';
import QuickReservationModal from '@/components/QuickReservationModal';
import CreateResidentDialog from '@/components/staff/CreateResidentDialog';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import useReservations from '@/hooks/useReservations';
import NotificationBadge from '@/components/NotificationBadge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const AdminPage = ({ onLogout }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isStaffReservationOpen, setStaffReservationOpen] = useState(false);
  const [isQuickReservationOpen, setQuickReservationOpen] = useState(false);
  const [isCreateResidentOpen, setCreateResidentOpen] = useState(false);
  const { reservations, loading, handleReservation, cancelReservationWithReason, isTimeSlotTaken } = useReservations(profile);

  const handleCreateResident = async (residentData) => {
    const { data, error } = await supabase.functions.invoke('admin-create-resident', { body: residentData });
    if (error || data?.error) {
      toast({ variant: 'destructive', title: 'Error al crear residente', description: data?.error || error?.message });
    } else {
      toast({ title: 'Residente creado', description: `Invitación enviada a ${residentData.email}.` });
    }
  };

  const handleStaffReservation = async (area, date, time, residentDetails) => {
    return await handleReservation(area, date, time, { ...residentDetails, id: profile.id });
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'Admin';

  return (
    <>
      <Helmet>
        <title>Panel Admin - Terra Bella</title>
        <meta name="description" content="Gestión administrativa de Terra Bella." />
      </Helmet>

      <div className="min-h-screen bg-[#0C1412] text-white">
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-30 bg-[#0C1412]/95 backdrop-blur-sm border-b border-surface-border px-4 md:px-8 h-14 flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <img
              src="/icons/icon-192x192.png"
              alt="Terra Bella"
              className="h-8 w-8 rounded-lg object-cover border border-brand-700/50"
            />
            <div className="leading-tight">
              <p className="text-white font-semibold text-sm">Panel Admin</p>
              <p className="text-brand-400 text-xs">{firstName}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Desktop action buttons */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-brand-700/50 text-brand-300 hover:bg-brand-900/40"
                onClick={() => setQuickReservationOpen(true)}
              >
                <Zap className="h-3.5 w-3.5 mr-1.5" /> Reserva Rápida
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-surface-border text-gray-300 hover:bg-surface-raised"
                onClick={() => setStaffReservationOpen(true)}
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Nueva Reserva
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-green-700/50 text-green-300 hover:bg-green-900/30"
                onClick={() => setCreateResidentOpen(true)}
              >
                <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Crear Residente
              </Button>
            </div>

            {/* Mobile: overflow menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white px-2">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-surface-card border-surface-border text-white z-50 w-52">
                  <DropdownMenuItem onClick={() => setQuickReservationOpen(true)} className="hover:bg-surface-raised cursor-pointer gap-2">
                    <Zap className="h-4 w-4 text-brand-400" /> Reserva Rápida
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStaffReservationOpen(true)} className="hover:bg-surface-raised cursor-pointer gap-2">
                    <PlusCircle className="h-4 w-4 text-gray-400" /> Nueva Reserva
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCreateResidentOpen(true)} className="hover:bg-surface-raised cursor-pointer gap-2">
                    <UserPlus className="h-4 w-4 text-green-400" /> Crear Residente
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <NotificationBadge />

            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-gray-400 hover:text-red-300 px-2"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </motion.header>

        {/* ── Main ────────────────────────────────────────────────────────────── */}
        <main className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
          <AdminDashboard
            reservations={reservations}
            onCancelReservation={cancelReservationWithReason}
            loading={loading}
          />
        </main>
      </div>

      <StaffReservationDialog
        isOpen={isStaffReservationOpen}
        onClose={() => setStaffReservationOpen(false)}
        onConfirmReservation={handleStaffReservation}
        isTimeSlotTaken={isTimeSlotTaken}
      />
      <QuickReservationModal
        isOpen={isQuickReservationOpen}
        onClose={() => setQuickReservationOpen(false)}
        onCreateReservation={handleReservation}
        isTimeSlotTaken={isTimeSlotTaken}
        onSuccess={() => {}}
      />
      <CreateResidentDialog
        isOpen={isCreateResidentOpen}
        onClose={() => setCreateResidentOpen(false)}
        onCreateResident={handleCreateResident}
      />
    </>
  );
};

export default AdminPage;
