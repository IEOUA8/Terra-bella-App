import React from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { LogOut, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';

const GuardiaLandingPage = ({ onLogout }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Bienvenido, Guardia - Terra Bella</title>
        <meta name="description" content="Página de inicio para el personal de seguridad de Terra Bella." />
      </Helmet>

      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="terra-card w-full max-w-sm p-8 shadow-2xl shadow-black/50 text-center"
        >
          {/* Icon */}
          <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-accent-700/30 border border-accent-600/40 flex items-center justify-center">
            <ShieldCheck className="h-10 w-10 text-accent-400" />
          </div>

          {/* Greeting */}
          <p className="text-sm text-gray-500 uppercase tracking-widest font-medium mb-1">
            Personal de seguridad
          </p>
          <h1 className="text-2xl font-bold text-white mb-1">
            {profile?.full_name || 'Guardia'}
          </h1>
          <p className="text-gray-400 text-sm mb-8">
            Terra Bella · Turno activo
          </p>

          {/* Actions */}
          <Button
            size="lg"
            className="w-full h-12 text-base font-semibold bg-brand-600 hover:bg-brand-700 text-white gap-2"
            onClick={() => navigate('/guardia')}
          >
            Ingresar al tablero
            <ArrowRight className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="mt-5 text-gray-500 hover:text-gray-300 w-full"
            onClick={onLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </Button>
        </motion.div>
      </div>
    </>
  );
};

export default GuardiaLandingPage;
