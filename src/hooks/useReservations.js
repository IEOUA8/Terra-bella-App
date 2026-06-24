import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

const useReservations = (userInfo) => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error("Failed to load reservations from Supabase", error);
      toast({
        title: "Error de Carga",
        description: "No se pudieron cargar las reservaciones.",
        variant: "destructive",
      });
      setReservations([]);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userInfo?.id) {
        refetch();
    } else {
        setLoading(false);
    }
  }, [refetch, userInfo?.id]);
  
  useEffect(() => {
    const channel = supabase.channel('realtime-reservations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, (payload) => {
        console.log('Change received!', payload)
        refetch();
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel);
    }
  }, [refetch]);

  // The sendPushNotification and sendCancellationNotification functions are no longer needed
  // as notifications are now handled by Supabase webhooks/Edge Functions.
  // Keeping them commented out for reference or potential future use if needed,
  // but their calls are removed from the reservation flow.

  /*
  const sendPushNotification = async (reservaData) => {
    try {
      const payload = { reservaData };
      console.log('DEBUG: Sending payload to Edge Function:', payload);

      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (error) {
        throw new Error(`Error invoking Edge Function: ${error.message}`);
      }

      console.log('📅 Push notification function invoked successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
      // We don't throw here to prevent blocking the reservation success flow
      return { success: false, error: error.message };
    }
  };

  const sendCancellationNotification = async (reservaData) => {
    try {
      const payload = { reservaData };
      console.log('DEBUG: Sending cancellation payload to Edge Function:', payload);

      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (error) {
         throw new Error(`Error invoking Edge Function: ${error.message}`);
      }

      console.log('🗑️ Cancellation notification function invoked successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error sending cancellation notification:', error);
    }
  };
  */

  const createReservation = useCallback(async (area, date, time, customDetails = null) => {
    // Debug log for guide verification
    console.log('🚀 Starting createReservation:', { area: area?.name, date, time, customDetails, currentUser: userInfo?.id });

    // 1. Validation: Check for required basic fields
    if (!area || !date || !time) {
      console.warn('⚠️ Reservation failed: Missing required fields');
      toast({
        title: "Información incompleta",
        description: "Por favor selecciona un área, fecha y hora para reservar.",
        variant: "destructive"
      });
      return null;
    }

    // 2. Determine user details (Handles Staff/Admin creating reservations for others)
    const userId = customDetails?.id || userInfo?.id;
    
    // Note: user_profiles table uses 'full_name', but customDetails might use 'name'
    const userName = customDetails?.name || userInfo?.full_name || userInfo?.name || 'Usuario Desconocido';
    const userApartment = customDetails?.apartment || userInfo?.apartment;
    const userTower = customDetails?.tower || userInfo?.tower;

    // 3. Validation: User ID is strictly required for RLS and relations
    if (!userId) {
        console.error("❌ Attempted to create reservation without User ID");
        toast({
            title: "Error de Usuario",
            description: "No se pudo identificar al usuario para la reserva.",
            variant: "destructive"
        });
        return null;
    }

    const newReservationData = {
      area_id: area.id,
      area_name: area.name,
      date: date,
      time: time,
      user_id: userId,
      user_name: userName,
      apartment: userApartment,
      tower: userTower,
      status: 'confirmed',
      created_at: new Date().toISOString() 
    };

    try {
      // 4. Database Interaction
      console.log('💾 Inserting reservation into Supabase:', newReservationData);
      const { data: newReservation, error } = await supabase
        .from('reservations')
        .insert(newReservationData)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase Insert Error:', error);
        throw error;
      }
      
      console.log('✅ Reservation created successfully:', newReservation);

      // 5. Post-creation side effects (Notifications, refetch)
      // await sendPushNotification(newReservation); // Removed as requested by the user
      refetch(); 
      return newReservation;

    } catch (error) {
      console.error("❌ Error creating reservation in Supabase:", error);
      toast({
        title: "Error al Reservar",
        description: error.message || "No se pudo crear la reserva. Inténtalo de nuevo.",
        variant: "destructive",
      });
      return null;
    }
  }, [userInfo, refetch]);

  const cancelReservation = useCallback(async (reservationId) => {
     try {
      const { data: cancelledReservation, error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled', cancellation_reason: 'Cancelado por el usuario' })
        .eq('id', reservationId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Reserva cancelada",
        description: "Tu reserva ha sido cancelada exitosamente",
      });
      // await sendCancellationNotification(cancelledReservation); // Removed as requested by the user
      refetch();
    } catch (error) {
       console.error("Error canceling reservation in Supabase", error);
      toast({
        title: "Error al Cancelar",
        description: "No se pudo cancelar la reserva. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  }, [refetch]);

  const cancelReservationWithReason = useCallback(async (reservationId, reason) => {
    if (!reason) {
      toast({ title: "Error", description: "Se requiere un motivo para la cancelación.", variant: "destructive" });
      return;
    }
     try {
      const { data: cancelledReservation, error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled', cancellation_reason: reason })
        .eq('id', reservationId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Reserva Cancelada por Admin",
        description: "La reserva ha sido cancelada.",
      });
      // await sendCancellationNotification(cancelledReservation); // Removed as requested by the user
      refetch();
    } catch (error) {
       console.error("Error canceling reservation by admin", error);
      toast({
        title: "Error al Cancelar",
        description: "No se pudo cancelar la reserva.",
        variant: "destructive",
      });
    }
  }, [refetch]);

  const updateReservationStatus = useCallback(async (reservationId, status, details) => {
    try {
      const { data: updatedReservation, error } = await supabase
        .from('reservations')
        .update({ status, ...details })
        .eq('id', reservationId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Reserva Actualizada",
        description: `El estado de la reserva ahora es: ${status}`,
      });
      refetch();
    } catch (error) {
      console.error("Error updating reservation status", error);
      toast({
        title: "Error al Actualizar",
        description: "No se pudo actualizar el estado de la reserva.",
        variant: "destructive",
      });
    }
  }, [refetch]);

  const isTimeSlotTaken = useCallback((areaId, date, time) => {
    return reservations.some(r => 
      r.area_id === areaId && 
      r.date === date && 
      r.time === time && 
      (r.status === 'confirmed' || r.status === 'in_progress')
    );
  }, [reservations]);

  const getUserReservations = useCallback(() => {
    if (!userInfo?.id) return [];
    return reservations.filter(r => r.user_id === userInfo.id && (r.status === 'confirmed' || r.status === 'in_progress'));
  }, [reservations, userInfo]);

  return {
    reservations,
    loading,
    refetch,
    handleReservation: createReservation,
    createReservation, 
    cancelReservation,
    cancelReservationWithReason,
    updateReservationStatus,
    isTimeSlotTaken,
    getUserReservations,
  };
};

export default useReservations;