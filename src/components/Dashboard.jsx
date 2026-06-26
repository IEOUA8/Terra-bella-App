import React from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AreaCard from '@/components/AreaCard';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { socialAreas } from '@/data/socialAreas';

const Dashboard = ({ onSelectArea, onShowMyReservations }) => {
  const { profile } = useAuth();

  if (!profile?.apartment || !profile?.tower) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="terra-card p-8 text-center"
      >
        <h2 className="text-xl font-semibold text-yellow-400 mb-3">Perfil incompleto</h2>
        <p className="text-gray-300 leading-relaxed">
          Para realizar reservas necesitamos tu <strong>torre</strong> y <strong>apartamento</strong>.
          Completa tu perfil desde el menú.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Desktop: "Ver mis reservas" shortcut */}
      <div className="hidden md:flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Áreas disponibles</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-brand-400 hover:text-brand-300 gap-1.5"
          onClick={onShowMyReservations}
        >
          <CalendarCheck className="h-4 w-4" />
          Ver mis reservas
        </Button>
      </div>

      <motion.div
        className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {socialAreas.map((area, index) => (
          <AreaCard key={area.id} area={area} onSelect={onSelectArea} index={index} />
        ))}
      </motion.div>
    </div>
  );
};

export default Dashboard;
