import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export const usePushNotifications = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [permission, setPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window;
    setIsSupported(supported);
    if (supported) setPermission(Notification.permission);
  }, []);

  const saveSubscription = useCallback(async (subscription) => {
    if (!user || !profile) return;
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          role: profile.role,
          subscription: subscription.toJSON(),
          device_type: 'web',
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
    if (error) console.error('Error guardando suscripción push:', error);
  }, [user, profile]);

  const removeSubscription = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase
      .from('push_subscriptions')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
    if (error) console.error('Error desactivando suscripción push:', error);
  }, [user]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    if (!VAPID_PUBLIC_KEY) {
      console.warn('VITE_VAPID_PUBLIC_KEY no configurada.');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') return false;

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      await saveSubscription(subscription);
      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error('Error activando push notifications:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron activar las notificaciones push.',
        variant: 'destructive',
      });
      return false;
    }
  }, [isSupported, saveSubscription, toast]);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) await subscription.unsubscribe();
      await removeSubscription();
      setIsSubscribed(false);
    } catch (error) {
      console.error('Error al cancelar suscripción push:', error);
    }
  }, [removeSubscription]);

  useEffect(() => {
    if (!isSupported || !user) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setIsSubscribed(!!sub));
  }, [isSupported, user]);

  return { permission, isSupported, isSubscribed, requestPermission, unsubscribe };
};
