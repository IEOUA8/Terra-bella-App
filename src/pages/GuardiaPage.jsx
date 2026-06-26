import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, BellRing, Bell, BellOff, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import useReservations from '@/hooks/useReservations';
import GuardiaDashboard from '@/components/guardia/GuardiaDashboard';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import GuardiaNotificationPanel from '@/components/guardia/GuardiaNotificationPanel';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import NotificationBadge from '@/components/NotificationBadge';

const GuardiaPage = ({ onLogout }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const {
    reservations,
    loading,
    cancelReservationWithReason,
    updateReservationStatus,
    refetch,
  } = useReservations(profile);

  const { requestPermission, permission, isSubscribed, unsubscribe } = usePushNotifications();

  const handleToggleNotifications = async () => {
    if (permission === 'denied') return;
    if (isSubscribed) { await unsubscribe(); return; }
    if (permission === 'granted') {
      toast({ title: 'Notificaciones activas', description: 'Ya estás suscrito a las alertas.' });
      return;
    }
    await requestPermission();
  };

  return (
    <div className="min-h-screen bg-[#0C1412] text-white">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#0C1412]/95 backdrop-blur-sm border-b border-surface-border px-4 md:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent-700/30 border border-accent-600/40 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-accent-400" />
          </div>
          <div className="leading-tight">
            <p className="text-white font-semibold text-sm">Portal de Guardia</p>
            <p className="text-gray-500 text-xs">{profile?.full_name || 'Guardia'}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Push toggle */}
          {permission !== 'denied' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleNotifications}
              title={isSubscribed ? 'Desactivar notificaciones' : 'Activar notificaciones'}
              className="text-gray-400 hover:text-accent-300 px-2"
            >
              {isSubscribed
                ? <BellOff className="h-5 w-5" />
                : <Bell className="h-5 w-5" />
              }
            </Button>
          )}

          {/* Alerts sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white px-2 relative">
                <BellRing className="h-5 w-5" />
                <span className="sr-only">Alertas</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="p-0 w-full sm:w-[400px] bg-surface-DEFAULT border-surface-border text-white z-[100]"
            >
              <GuardiaNotificationPanel />
            </SheetContent>
          </Sheet>

          {/* Notification badge (desktop) */}
          <div className="hidden md:block">
            <NotificationBadge />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-gray-400 hover:text-red-300 px-2"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <main className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-white">Reservas próximas</h1>
          <p className="text-sm text-gray-400">Gestiona la entrega y recepción de áreas sociales.</p>
        </div>

        <GuardiaDashboard
          reservations={reservations}
          loading={loading}
          onCancelReservation={cancelReservationWithReason}
          onUpdateReservation={updateReservationStatus}
          onRefresh={refetch}
        />
      </main>
    </div>
  );
};

export default GuardiaPage;
