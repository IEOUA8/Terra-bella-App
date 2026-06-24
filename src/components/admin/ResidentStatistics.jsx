import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, User } from 'lucide-react';

const ResidentStatistics = ({ reservations }) => {
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
    const residentData = filteredReservations.reduce((acc, res) => {
      const key = res.user_name || 'Residente Desconocido';
      if (!acc[key]) {
        acc[key] = {
          name: key,
          tower: res.tower,
          apartment: res.apartment,
          total: 0,
          confirmed: 0,
          cancelled: 0,
        };
      }
      acc[key].total += 1;
      if (res.status === 'confirmed' || res.status === 'completed' || res.status === 'in_progress') {
        acc[key].confirmed += 1;
      } else if (res.status === 'cancelled') {
        acc[key].cancelled += 1;
      }
      return acc;
    }, {});

    return Object.values(residentData).sort((a, b) => b.total - a.total);
  }, [filteredReservations]);

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
            <CardTitle>Estadísticas por Residente</CardTitle>
            <CardDescription className="text-gray-400">Actividad de los residentes ({getFilterTitle()})</CardDescription>
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
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
          {stats.length > 0 ? (
            stats.map((resident, index) => (
              <div key={resident.name} className="flex items-center">
                <div className="flex-shrink-0 mr-4">
                  {index === 0 && <Crown className="w-6 h-6 text-yellow-400" />}
                  {index > 0 && <User className="w-6 h-6 text-gray-400" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold">{resident.name}</p>
                    <p className="text-xs text-gray-400">T{resident.tower} - A{resident.apartment}</p>
                  </div>
                  <div className="flex items-center gap-x-3 text-sm mt-1">
                    <span className="text-green-400">Confirmadas: {resident.confirmed}</span>
                    <span className="text-red-400">Canceladas: {resident.cancelled}</span>
                    <span className="font-bold">Total: {resident.total}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400 py-8">No hay datos de residentes para el período seleccionado.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ResidentStatistics;