import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const UsageStatistics = ({ reservations, areas }) => {
  const [filter, setFilter] = useState('all');

  const filteredReservations = useMemo(() => {
    const now = new Date();
    if (filter === 'all') {
      return reservations;
    }
    return reservations.filter(r => {
      const reservationDate = new Date(r.date);
      if (filter === 'day') {
        return (
          reservationDate.getDate() === now.getDate() &&
          reservationDate.getMonth() === now.getMonth() &&
          reservationDate.getFullYear() === now.getFullYear()
        );
      }
      if (filter === 'month') {
        return (
          reservationDate.getMonth() === now.getMonth() &&
          reservationDate.getFullYear() === now.getFullYear()
        );
      }
      if (filter === 'year') {
        return reservationDate.getFullYear() === now.getFullYear();
      }
      return false;
    });
  }, [reservations, filter]);

  const stats = useMemo(() => {
    const usageCount = filteredReservations.reduce((acc, reservation) => {
      acc[reservation.area_name] = (acc[reservation.area_name] || 0) + 1;
      return acc;
    }, {});

    const confirmedCount = filteredReservations
      .filter(r => r.status === 'confirmed')
      .reduce((acc, reservation) => {
        acc[reservation.area_name] = (acc[reservation.area_name] || 0) + 1;
        return acc;
      }, {});

    const cancelledCount = filteredReservations
      .filter(r => r.status === 'cancelled')
      .reduce((acc, reservation) => {
        acc[reservation.area_name] = (acc[reservation.area_name] || 0) + 1;
        return acc;
      }, {});
    
    return areas
      .map(area => ({
        name: area.name,
        icon: area.icon,
        total: usageCount[area.name] || 0,
        confirmed: confirmedCount[area.name] || 0,
        cancelled: cancelledCount[area.name] || 0,
      }))
      .sort((a, b) => b.total - a.total);

  }, [filteredReservations, areas]);
  
  const totalReservations = stats.reduce((sum, area) => sum + area.total, 0);

  const getFilterTitle = () => {
    switch (filter) {
      case 'day': return 'Hoy';
      case 'month': return 'Este Mes';
      case 'year': return 'Este Año';
      default: return 'Historial Completo';
    }
  };

  return (
    <Card className="bg-white/5 border-white/10 text-white">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Estadísticas de Uso por Área</CardTitle>
            <CardDescription className="text-gray-400">Demanda de áreas sociales ({getFilterTitle()})</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button size="sm" variant={filter === 'day' ? 'default' : 'outline'} onClick={() => setFilter('day')} className={`${filter === 'day' ? 'bg-white/20' : 'bg-transparent border-white/30'} text-white`}>Día</Button>
            <Button size="sm" variant={filter === 'month' ? 'default' : 'outline'} onClick={() => setFilter('month')} className={`${filter === 'month' ? 'bg-white/20' : 'bg-transparent border-white/30'} text-white`}>Mes</Button>
            <Button size="sm" variant={filter === 'year' ? 'default' : 'outline'} onClick={() => setFilter('year')} className={`${filter === 'year' ? 'bg-white/20' : 'bg-transparent border-white/30'} text-white`}>Año</Button>
            <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')} className={`${filter === 'all' ? 'bg-white/20' : 'bg-transparent border-white/30'} text-white`}>Total</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {stats.map(area => (
            <div key={area.name} className="flex items-center">
              <span className="text-2xl mr-4">{area.icon}</span>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <p className="font-medium">{area.name}</p>
                  <div className="flex items-center gap-x-3 text-sm">
                    <span className="text-green-400">Confirmadas: {area.confirmed}</span>
                    <span className="text-red-400">Canceladas: {area.cancelled}</span>
                    <span className="font-bold text-lg">Total: {area.total}</span>
                  </div>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full" 
                    style={{ width: `${totalReservations > 0 ? (area.total / totalReservations) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UsageStatistics;