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
    if (!profile) return;

    const handleNotification = (payload) => {
      const n = payload.new;
      toast({
        title: n.title || 'Nueva notificación',
        description: n.body || '',
      });
      if (n.type === 'nueva_reserva') {
        window.dispatchEvent(new CustomEvent('new-reservation-notification', { detail: n.metadata }));
      }
    };

    // Listen by role (guardias/admins) AND by user_id (resident personal notifications)
    const channel = supabase
      .channel(`realtime-toasts-${profile.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_role=eq.${profile.role}`,
      }, handleNotification)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_user_id=eq.${profile.id}`,
      }, handleNotification)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [profile, toast]);

  return null;
};

export default NotificationInitializer;
