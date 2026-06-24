import React from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { LogOut, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';

const GuardiaLandingPage = ({ onLogout }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleEnterDashboard = () => {
    navigate('/guardia');
  };

  return (
    <>
      <Helmet>
        <title>Bienvenido, Guardia - Terra Bella</title>
        <meta name="description" content="Página de inicio para el personal de seguridad de Terra Bella." />
      </Helmet>
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, type: 'spring', bounce: 0.4 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 sm:p-12 shadow-2xl max-w-md w-full"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
            className="mx-auto mb-6 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full h-24 w-24 flex items-center justify-center"
          >
            <ShieldCheck className="h-12 w-12 text-white" />
          </motion.div>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            ¡Bienvenido de vuelta!
          </h1>
          <p className="text-lg text-gray-300 mb-8">
            {profile?.full_name || 'Guardia'}
          </p>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              size="lg" 
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 ease-in-out transform hover:-translate-y-1"
              onClick={handleEnterDashboard}
            >
              Ingresar a Tablero de Guardia
            </Button>
          </motion.div>

          <Button 
            variant="ghost" 
            className="mt-8 text-gray-400 hover:text-white"
            onClick={onLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </motion.div>
      </div>
    </>
  );
};

export default GuardiaLandingPage;