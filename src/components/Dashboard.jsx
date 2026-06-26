import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AreaCard from '@/components/AreaCard';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { socialAreas } from '@/data/socialAreas';
import MyReservations from '@/components/MyReservations';
import useReservations from '@/hooks/useReservations';

const Dashboard = ({ onSelectArea, onShowMyReservations }) => {
  const { profile } = useAuth();
  const { getUserReservations, cancelReservation, loading } = useReservations(profile);
  const [activeTab, setActiveTab] = useState('areas');
  const userReservations = getUserReservations();
  
  const handleTabChange = (value) => {
    setActiveTab(value);
  };

  const renderContent = () => {
    if (!profile?.apartment || !profile?.tower) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center terra-card p-8"
        >
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">Perfil Incompleto</h2>
          <p className="text-lg text-slate-300">
            Para poder realizar una reserva, por favor completa la información de tu perfil indicando tu <strong>torre</strong> y <strong>apartamento</strong>.
          </p>
           <p className="text-sm text-slate-400 mt-4">
            (Esta información es necesaria para la gestión y seguridad de las áreas comunes.)
          </p>
        </motion.div>
      );
    }
    
    return (
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 p-1 rounded-lg">
          <TabsTrigger value="areas">Reservar Área</TabsTrigger>
          <TabsTrigger value="myReservations">Mis Reservas ({userReservations.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="areas" className="mt-6">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.05, duration: 0.3 }}
          >
            {socialAreas.map((area, index) => (
              <AreaCard key={area.id} area={area} onSelect={onSelectArea} index={index} />
            ))}
          </motion.div>
        </TabsContent>
        <TabsContent value="myReservations" className="mt-6">
           <MyReservations 
              reservations={userReservations} 
              onCancel={cancelReservation} 
              loading={loading}
              onNewReservation={() => handleTabChange('areas')}
            />
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <main>
      {renderContent()}
    </main>
  );
};

export default Dashboard;