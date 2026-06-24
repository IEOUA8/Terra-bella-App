import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Inbox, Calendar, User, Building, Home, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNotifications } from '@/hooks/useNotifications';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { convertToAmPm } from '@/lib/utils';

const NotificationCard = ({ notification, onMarkAsRead }) => {
  const { title, body, created_at, read_at, metadata } = notification;
  const isRead = !!read_at;

  const reservationDetails = useMemo(() => {
    // Attempt to extract details from metadata first
    if (metadata && metadata.reservation_id) {
      return {
        area: notification.title.replace('Nueva Reserva: ', ''),
        user: body.match(/^(.*?)\s\(/)?.[1] || 'N/A',
        tower: body.match(/T(.*?)-/)?.[1] || 'N/A',
        apartment: body.match(/-Apto\s(.*?)\)/)?.[1] || 'N/A',
        date: body.match(/para el\s(.*?)\s/)?.[1] || 'N/A',
        time: convertToAmPm(body.match(/a las\s(.*?)\./)?.[1] || 'N/A'),
      };
    }
    // Fallback for older notifications or different formats
    return { area: title, user: 'Ver detalles', tower: '?', apartment: '?', date: '?', time: '?' };
  }, [notification]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`transition-all ${isRead ? 'bg-slate-800/50 border-slate-700' : 'bg-blue-900/30 border-blue-500'}`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className={`h-5 w-5 ${isRead ? 'text-slate-400' : 'text-blue-400'}`} />
                {reservationDetails.area}
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs mt-1">
                {formatDistanceToNow(new Date(created_at), { addSuffix: true, locale: es })}
              </CardDescription>
            </div>
            {!isRead && <Badge variant="secondary" className="bg-blue-500 text-white border-blue-400">NUEVA</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-white"> {/* Added text-white here */}
            <div className="flex items-center gap-2"><User className="h-4 w-4 text-slate-400" /> <span>{reservationDetails.user}</span></div>
            <div className="flex items-center gap-2"><Building className="h-4 w-4 text-slate-400" /> <span>Torre {reservationDetails.tower}</span></div>
            <div className="flex items-center gap-2"><Home className="h-4 w-4 text-slate-400" /> <span>Apto {reservationDetails.apartment}</span></div>
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-slate-400" /> <span>{reservationDetails.date}</span></div>
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-slate-400" /> <span>{reservationDetails.time}</span></div>
          </div>
          {!isRead && (
            <Button
              size="sm"
              className="w-full mt-4 bg-slate-700 hover:bg-slate-600"
              onClick={() => onMarkAsRead(notification.id)}
            >
              <Check className="mr-2 h-4 w-4" />
              Marcar como Leído
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const GuardiaNotificationPanel = () => {
  const { notifications, unreadCount, markAsRead, loading } = useNotifications();
  const [filter, setFilter] = useState('unread');

  const filteredNotifications = useMemo(() => {
    const guardiaNotifications = notifications.filter(n => n.recipient_role === 'guardia');
    if (filter === 'unread') {
      return guardiaNotifications.filter(n => !n.read_at);
    }
    return guardiaNotifications;
  }, [notifications, filter]);

  return (
    <div className="h-full flex flex-col">
      <header className="p-4 border-b border-slate-700">
        <h2 className="text-xl font-bold flex items-center gap-3 text-white">
          <Bell className="text-yellow-400" />
          Centro de Alertas de Guardia
          {unreadCount > 0 && (
            <Badge variant="destructive" className="animate-bounce">{unreadCount}</Badge>
          )}
        </h2>
      </header>

      <div className="p-4">
        <Tabs value={filter} onValueChange={setFilter} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800">
            <TabsTrigger value="unread">No Leídas</TabsTrigger>
            <TabsTrigger value="all">Todas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-grow overflow-y-auto px-4 pb-4 space-y-4">
        <AnimatePresence>
          {loading && filteredNotifications.length === 0 ? (
             <p className="text-center text-slate-400 pt-10">Cargando notificaciones...</p>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map(notification => (
              <NotificationCard key={notification.id} notification={notification} onMarkAsRead={markAsRead} />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center text-center h-full text-slate-500"
            >
              <Inbox className="h-12 w-12 mb-4" />
              <p className="font-semibold">Todo está en orden</p>
              <p>No hay notificaciones {filter === 'unread' ? 'no leídas' : 'que mostrar'}.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GuardiaNotificationPanel;