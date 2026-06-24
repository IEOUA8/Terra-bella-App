import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const PermissionsContext = createContext({
  permissions: new Set(),
  loading: true,
  hasPermission: () => false,
});

export const PermissionsProvider = ({ children }) => {
  const { session } = useAuth();
  const [permissions, setPermissions] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!session?.user?.id) {
        setPermissions(new Set());
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Llamamos a la nueva función RPC que obtiene los permisos del usuario.
        const { data, error } = await supabase.rpc('get_user_permissions', {
          p_user_id: session.user.id
        });
        
        if (error) {
          console.error("Error fetching permissions via RPC:", error);
          toast({
            title: "Error de Permisos",
            description: "No se pudieron cargar los permisos del usuario.",
            variant: "destructive",
          });
          setPermissions(new Set());
        } else {
          // La data de un RPC exitoso está en `data`.
          // La nueva función devuelve un objeto: { permissions: [...] }
          setPermissions(new Set(data.permissions || []));
        }
      } catch (err) {
        console.error("Unexpected error fetching permissions:", err);
        toast({
            title: "Error Inesperado de Permisos",
            description: "Ocurrió un error inesperado al buscar los permisos.",
            variant: "destructive",
        });
        setPermissions(new Set());
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [session, toast]);

  const hasPermission = (requiredPermission) => {
    return permissions.has(requiredPermission);
  };
  
  const value = useMemo(() => ({
    permissions,
    loading,
    hasPermission,
  }), [permissions, loading]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};