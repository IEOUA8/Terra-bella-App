import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles, requiredPermission }) => {
  const { session, profile, loading: authLoading } = useAuth();
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  const isLoading = authLoading || (session && (!profile || permissionsLoading));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white flex flex-col items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-2xl font-bold">Verificando acceso...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && (!profile?.role || !allowedRoles.includes(profile.role))) {
    // Redirect to a default authenticated page if role doesn't match
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    // Redirect if specific permission is missing
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;