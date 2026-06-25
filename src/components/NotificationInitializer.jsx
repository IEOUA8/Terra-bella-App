import React, { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';

// Escucha notificaciones en tiempo real vía Supabase Realtime y muestra toasts.
// Las push notifications en background se gestionan directamente en el service-worker.
const NotificationInitializer = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { isSupported, permission } = usePushNotifications();

  useEffect(() => {
    if (isSupported) {
      console.log('[Notifications] Push soportadas. Estado:', permission);
    }
  }, [isSupported, permission]);

  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel(`realtime-toasts-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_role=eq.${profile.role}`,
        },
        (payload) => {
          const n = payload.new;
          toast({
            title: n.title || 'Nueva notificación',
            description: n.body || '',
          });

          if (n.type === 'nueva_reserva') {
            window.dispatchEvent(
              new CustomEvent('new-reservation-notification', { detail: n.metadata })
            );
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [profile, toast]);

  return null;
};

export default NotificationInitializer;
