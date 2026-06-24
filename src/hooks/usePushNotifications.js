import { useState, useEffect } from 'react';
import { messaging } from '@/lib/firebase';
import { getToken } from 'firebase/messaging';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';

// Named export to match usage in components (e.g., { usePushNotifications })
export const usePushNotifications = () => {
  const { user, profile } = useAuth();
  const [permission, setPermission] = useState('default');
  const [fcmToken, setFcmToken] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const saveTokenToDatabase = async (token) => {
    if (!user || !profile) return;

    try {
      if (profile.role === 'guardia') {
        const { error } = await supabase
          .from('tokens_fcm_guardias')
          .upsert({
            user_id: user.id,
            fcm_token: token,
            device_type: 'web',
            is_active: true,
            updated_at: new Date().toISOString(),
            guardia_id: user.id
          }, { onConflict: 'user_id' });

        if (error) throw error;
        console.log('✅ Token de Guardia guardado.');
      } else {
        const { error } = await supabase
          .from('user_profiles')
          .update({ fcm_token: token })
          .eq('id', user.id);

        if (error) throw error;
        console.log('✅ Token de Usuario guardado.');
      }
    } catch (error) {
      console.error('❌ Error saving token to DB:', error);
    }
  };

  const requestPermission = async () => {
    if (!isSupported) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult === 'granted') {
        if (!messaging) {
            console.warn('Firebase messaging not initialized');
            return false;
        }
        
        // Get Token
        const currentToken = await getToken(messaging, {
          vapidKey: 'BMwB7n-A1gHkCg_Kz3k5x9q1z3k5x9q1z3k5x9q1'
        });

        if (currentToken) {
          setFcmToken(currentToken);
          await saveTokenToDatabase(currentToken);
          return true;
        }
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast({
        title: "Error",
        description: "No se pudieron activar las notificaciones.",
        variant: "destructive"
      });
    }
    return false;
  };

  return {
    permission,
    fcmToken,
    requestPermission,
    isSupported
  };
};