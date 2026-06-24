import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, BellRing, Bell } from 'lucide-react';
import useReservations from '@/hooks/useReservations';
import GuardiaDashboard from '@/components/guardia/GuardiaDashboard';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import GuardiaNotificationPanel from '@/components/guardia/GuardiaNotificationPanel';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const GuardiaPage = ({ onLogout }) => {
  const { profile } = useAuth();
  const {
    reservations,
    loading,
    cancelReservationWithReason,
    updateReservationStatus,
    refetch,
  } = useReservations(profile);

  const { requestPermission, permission } = usePushNotifications();

  const handleActivateNotifications = async () => {
    if (permission === 'granted') {
      alert('Las notificaciones ya están activadas. ¡Recibirás alertas automáticamente! ✨');
      return;
    }
    const success = await requestPermission();
    if (success) {
      alert('¡Genial! Notificaciones activadas correctamente. 🔔');
    } else {
      // Alert is handled in hook via toast
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-900/20 to-slate-900 text-white p-4 md:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <img 
               src="https://images.unsplash.com/photo-1525280996482-4beab0fdd409" 
               alt="TerraBell Logo" 
               className="h-12 w-12 rounded-lg object-cover border-2 border-brand-500 shadow-lg" 
          />
          <div>
            <h1 className="text-3xl font-bold text-brand-300">Portal de Guardia</h1>
            <p className="text-slate-400">Gestión de entrega y recepción de áreas sociales.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="relative bg-transparent border-brand-400 text-brand-300 hover:bg-brand-500 hover:text-white"
              >
                <Bell className="mr-2 h-4 w-4"/>
                Alertas
              </Button>
            </SheetTrigger>
            <SheetContent className="p-0 w-full md:w-[450px] bg-slate-900/95 backdrop-blur-sm border-slate-700 text-white">
               <GuardiaNotificationPanel />
            </SheetContent>
          </Sheet>

          <Button
            variant="outline"
            className="hidden sm:inline-flex bg-transparent border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white"
            onClick={handleActivateNotifications}
            disabled={permission === 'denied'}
          >
            <BellRing className="mr-2 h-4 w-4" />
            {permission === 'granted' ? 'Notifs. Activas' : 'Activar Notifs.'}
          </Button>

          <Button variant="ghost" onClick={onLogout} className="hover:bg-slate-700">
            <LogOut className="mr-2 h-4 w-4" />
            Salir
          </Button>
        </div>
      </header>

      <main>
        <GuardiaDashboard 
          reservations={reservations} 
          loading={loading}
          onCancelReservation={cancelReservationWithReason}
          onUpdateReservation={updateReservationStatus}
          onRefresh={refetch}
        />
        <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4 text-white">Panel de Alertas Recientes</h3>
            <div className="max-h-[600px] overflow-y-auto rounded-lg bg-slate-900/50 p-1 border border-brand-500/20">
                <GuardiaNotificationPanel />
            </div>
        </div>
      </main>
    </div>
  );
};

export default GuardiaPage;