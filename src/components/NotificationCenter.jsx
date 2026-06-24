import React, { useState, useMemo } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCheck, Loader2, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const isRead = !!notification.read_at;

  const getIcon = (type) => {
    switch (type) {
      case 'reservation_created':
        return <Bell className="h-5 w-5 text-blue-400" />;
      case 'reservation_cancelled':
        return <Bell className="h-5 w-5 text-red-400" />;
      default:
        return <Bell className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      onClick={() => onMarkAsRead(notification.id)}
      className={`flex items-start gap-4 p-4 border-b border-slate-800 cursor-pointer transition-colors ${
        isRead ? 'opacity-60 hover:bg-slate-800/30' : 'bg-blue-500/10 hover:bg-blue-500/20'
      }`}
    >
      <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>
      <div className="flex-grow">
        <p className={`font-semibold ${isRead ? 'text-slate-300' : 'text-white'}`}>{notification.title}</p>
        <p className="text-sm text-slate-400">{notification.body}</p>
        <p className="text-xs text-slate-500 mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
        </p>
      </div>
      {!isRead && (
        <div className="flex-shrink-0 self-center">
          <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse"></div>
        </div>
      )}
    </motion.div>
  );
};

const NotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const [filter, setFilter] = useState('all');

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter(n => !n.read_at);
    }
    return notifications;
  }, [notifications, filter]);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      <header className="p-4 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Notificaciones</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="animate-bounce">{unreadCount}</Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
          <CheckCheck className="mr-2 h-4 w-4" />
          Marcar todas como leídas
        </Button>
      </header>

      <Tabs value={filter} onValueChange={setFilter} className="p-4">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="unread">No Leídas</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex-grow overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-slate-500">
            <Inbox className="w-16 h-16 mb-4" />
            <p className="text-lg font-semibold">Todo al día</p>
            <p>No tienes notificaciones {filter === 'unread' ? 'no leídas' : ''}.</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredNotifications.map(notification => (
              <NotificationItem key={notification.id} notification={notification} onMarkAsRead={markAsRead} />
            ))}
          </AnimatePresence>
        )}

        {hasMore && !loading && (
          <div className="p-4 flex justify-center">
            <Button onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Cargar más
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;