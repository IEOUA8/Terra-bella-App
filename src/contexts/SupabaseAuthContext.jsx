import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkApartmentAvailability = useCallback(async (tower, apartment) => {
    try {
      const { data, error } = await supabase.rpc('check_apartment_available', {
        p_tower: tower,
        p_apartment: apartment,
      });
      if (error) {
        console.error('Error checking apartment:', error);
        return { available: false, error: 'Error verificando disponibilidad del apartamento' };
      }
      if (data === false) {
        return {
          available: false,
          error: `El apartamento Torre ${tower} - Apto ${apartment} ya está registrado`,
        };
      }
      return { available: true };
    } catch (error) {
      console.error('Error in checkApartmentAvailability:', error);
      return { available: false, error: 'Error verificando disponibilidad' };
    }
  }, []);

  const checkEmailAvailability = useCallback(async (email) => {
    try {
      const { data, error } = await supabase.rpc('check_email_available', {
        p_email: email,
      });
      if (error) {
        console.error('Error checking email:', error);
        return { available: false, error: 'Error verificando disponibilidad del correo' };
      }
      if (data === false) {
        return { available: false, error: 'El correo electrónico ya está registrado' };
      }
      return { available: true };
    } catch (error) {
      console.error('Error in checkEmailAvailability:', error);
      return { available: false, error: 'Error verificando disponibilidad del correo' };
    }
  }, []);

  const fetchProfile = useCallback(async (user) => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist - trigger might have failed
          console.warn('Profile not found for user:', user.id);
          return null;
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error.message);
      return null;
    }
  }, []);

  const handleSession = useCallback(async (session) => {
    setSession(session);
    setUser(session?.user ?? null);
    
    if (session?.user) {
      const userProfile = await fetchProfile(session.user);
      setProfile(userProfile);
      
      // If profile doesn't exist, try to create it
      if (!userProfile && session.user) {
        console.log('Attempting to create missing profile...');
        // You might want to manually create the profile here
      }
    } else {
      setProfile(null);
    }
    setLoading(false);
  }, [fetchProfile]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } = {} } = await supabase.auth.getSession();
      await handleSession(session);
    };

    getSession();

    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        await handleSession(session);
      }
    );

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [handleSession]);

  // UPDATED: signUp function with apartment and email validation
  const signUp = useCallback(async (email, password, userData) => {
    try {
      const { tower, apartment, phone, name } = userData;

      // First check email availability
      const emailCheck = await checkEmailAvailability(email);
      if (!emailCheck.available) {
        toast({
          variant: "destructive",
          title: "Correo ya registrado",
          description: emailCheck.error,
        });
        return { error: new Error(emailCheck.error) };
      }

      // Then check apartment availability
      const apartmentCheck = await checkApartmentAvailability(tower, apartment);
      if (!apartmentCheck.available) {
        toast({
          variant: "destructive",
          title: "Apartamento ya registrado",
          description: apartmentCheck.error,
        });
        return { error: new Error(apartmentCheck.error) };
      }

      // Only proceed with registration if both checks pass
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            apartment: apartment,
            tower: tower,
            phone: phone,
            full_name: name,
          }
        }
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error en el registro",
          description: error.message,
        });
        return { error };
      }

      // Trigger on auth.users handles profile creation automatically.
      if (data.user) {
        setTimeout(async () => {
          const existingProfile = await fetchProfile(data.user);
          if (!existingProfile) {
            console.warn('Profile not found after signup for user:', data.user.id, '- trigger may have failed');
          }
        }, 2000);
      }

      toast({
        variant: "default",
        title: "Registro exitoso",
        description: "Usuario creado correctamente. Revisa tu correo para la confirmación.",
      });

      return { data, error: null };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error en el registro",
        description: error.message,
      });
      return { error };
    }
  }, [toast, fetchProfile, checkApartmentAvailability, checkEmailAvailability]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message === 'Email not confirmed') {
        toast({ 
          variant: 'destructive', 
          title: 'Correo no confirmado', 
          description: 'Por favor, revisa tu bandeja de entrada y confirma tu correo electrónico antes de iniciar sesión.' 
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error en el inicio de sesión",
          description: error.message,
        });
      }
    }

    return { error };
  }, [toast]);

  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error al enviar correo',
        description: error.message,
      });
    } else {
      toast({
        title: 'Correo enviado',
        description: 'Revisa tu bandeja de entrada para el enlace de recuperación.',
      });
    }
    return { error };
  }, [toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      if (error.message !== 'Session from session_id claim in JWT does not exist' && error.code !== 'session_not_found') {
        toast({
          variant: "destructive",
          title: "Error al cerrar sesión",
          description: error.message,
        });
      }
    }
    setProfile(null);
    return { error };
  }, [toast]);
  
  const value = useMemo(() => ({
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    displayToast: toast,
    checkApartmentAvailability,
    checkEmailAvailability,
  }), [user, profile, session, loading, signUp, signIn, signOut, resetPassword, toast, checkApartmentAvailability, checkEmailAvailability]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};