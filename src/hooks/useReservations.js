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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
        refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const createReservation = useCallback(async (area, date, time, customDetails = null) => {
    // 1. Validation: Check for required basic fields
    if (!area || !date || !time) {
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
      const { data: newReservation, error } = await supabase
        .from('reservations')
        .insert(newReservationData)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase Insert Error:', error);
        throw error;
      }
      
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
        title: "Reserva Cancelada",
        description: "La reserva ha sido cancelada y se notificará al residente.",
      });

      // Notify resident via Edge Function
      supabase.functions.invoke('send-push-notification', {
        body: { reservaData: { ...cancelledReservation, cancellation_reason: reason } },
      }).catch((e) => console.error('Error sending resident notification:', e));

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

  const getAllUserReservations = useCallback(() => {
    if (!userInfo?.id) return [];
    return reservations.filter(r => r.user_id === userInfo.id);
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
    getAllUserReservations,
  };
};

export default useReservations;