import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CalendarCheck, CalendarX, Loader2, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReservationsTable from '@/components/admin/ReservationsTable';
import UsageStatistics from '@/components/admin/UsageStatistics';
import ResidentStatistics from '@/components/admin/ResidentStatistics';
import { socialAreas } from '@/data/socialAreas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NotificationAuditDashboard from './NotificationAuditDashboard';

const AdminDashboard = ({ reservations, onCancelReservation, loading }) => {
  const [timeFilter, setTimeFilter] = useState('all');

  const filteredReservations = useMemo(() => {
    const now = new Date();
    if (timeFilter === 'all') {
      return reservations;
    }
    return reservations.filter(r => {
      const reservationDate = new Date(r.date);
      if (timeFilter === 'day') {
        return (
          reservationDate.getDate() === now.getDate() &&
          reservationDate.getMonth() === now.getMonth() &&
          reservationDate.getFullYear() === now.getFullYear()
        );
      }
      if (timeFilter === 'month') {
        return (
          reservationDate.getMonth() === now.getMonth() &&
          reservationDate.getFullYear() === now.getFullYear()
        );
      }
      if (timeFilter === 'year') {
        return reservationDate.getFullYear() === now.getFullYear();
      }
      return false;
    });
  }, [reservations, timeFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2 text-lg">Cargando datos...</span>
      </div>
    );
  }

  const confirmedReservationsCount = filteredReservations.filter(r => r.status === 'confirmed').length;
  const cancelledReservationsCount = filteredReservations.filter(r => r.status === 'cancelled').length;
  const totalReservationsCount = filteredReservations.length;

  const stats = [
    { title: 'Reservas Totales', value: totalReservationsCount, icon: <Users className="h-6 w-6 text-blue-400" /> },
    { title: 'Reservas Activas', value: confirmedReservationsCount, icon: <CalendarCheck className="h-6 w-6 text-green-400" /> },
    { title: 'Reservas Canceladas', value: cancelledReservationsCount, icon: <CalendarX className="h-6 w-6 text-red-400" /> },
  ];

  const getFilterTitle = () => {
    switch (timeFilter) {
      case 'day': return 'Hoy';
      case 'month': return 'Este Mes';
      case 'year': return 'Este Año';
      default: return 'Historial';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
          <TabsTrigger value="dashboard">
            <CalendarCheck className="mr-2 h-4 w-4" />
            Dashboard de Reservas
          </TabsTrigger>
          <TabsTrigger value="audit">
            <ListChecks className="mr-2 h-4 w-4" />
            Auditoría de Notificaciones
          </TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="mt-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Resumen de {getFilterTitle()}</h2>
              <div className="flex space-x-2">
                <Button size="sm" variant={timeFilter === 'day' ? 'default' : 'outline'} onClick={() => setTimeFilter('day')} className={`${timeFilter === 'day' ? 'bg-white/20' : 'bg-transparent border-white/30'} text-white`}>Día</Button>
                <Button size="sm" variant={timeFilter === 'month' ? 'default' : 'outline'} onClick={() => setTimeFilter('month')} className={`${timeFilter === 'month' ? 'bg-white/20' : 'bg-transparent border-white/30'} text-white`}>Mes</Button>
                <Button size="sm" variant={timeFilter === 'year' ? 'default' : 'outline'} onClick={() => setTimeFilter('year')} className={`${timeFilter === 'year' ? 'bg-white/20' : 'bg-transparent border-white/30'} text-white`}>Año</Button>
                <Button size="sm" variant={timeFilter === 'all' ? 'default' : 'outline'} onClick={() => setTimeFilter('all')} className={`${timeFilter === 'all' ? 'bg-white/20' : 'bg-transparent border-white/30'} text-white`}>Total</Button>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/5 border-white/10 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-300">{stat.title}</CardTitle>
                      {stat.icon}
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold">{stat.value}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <UsageStatistics reservations={reservations} areas={socialAreas} />
            <ResidentStatistics reservations={reservations} />
          </div>

          <div className="mt-8">
            <ReservationsTable reservations={reservations} onCancelReservation={onCancelReservation} />
          </div>
        </TabsContent>
        <TabsContent value="audit" className="mt-6">
          <NotificationAuditDashboard />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default AdminDashboard;