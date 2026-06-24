import React, { useEffect } from 'react';
import { messaging } from '@/lib/firebase';
import { onMessage } from 'firebase/messaging';
import { useToast } from '@/components/ui/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const NotificationInitializer = () => {
  const { toast } = useToast();
  const { isSupported, permission } = usePushNotifications();

  // Log status for debugging
  useEffect(() => {
    if (isSupported) {
      console.log('✅ Notificaciones Push soportadas. Estado:', permission);
    }
  }, [isSupported, permission]);

  // Global listener for foreground messages
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('📩 Mensaje en primer plano recibido:', payload);
      
      // Show Toast
      toast({
        title: payload.notification?.title || 'Nueva Notificación',
        description: payload.notification?.body,
      });

      // Dispatch custom event for specific app logic (e.g., refreshing tables)
      if (payload.data?.type === 'nueva_reserva') {
        window.dispatchEvent(new CustomEvent('new-reservation-notification', { detail: payload.data }));
      }
    });

    return () => unsubscribe && unsubscribe();
  }, [toast]);

  return null;
};

export default NotificationInitializer;