import React, { useState, useEffect } from 'react';
import { Bell, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import NotificationCenter from '@/components/NotificationCenter';

const NotificationPreviewItem = ({ notification }) => (
  <div className="flex items-start gap-3 py-2 border-b border-slate-700 last:border-b-0">
    {!notification.read_at && <div className="w-2 h-2 mt-1.5 bg-blue-400 rounded-full flex-shrink-0"></div>}
    <div className={`flex-grow ${notification.read_at ? 'pl-5' : ''}`}>
      <p className="text-sm font-medium text-slate-100 leading-tight">{notification.title}</p>
      <p className="text-xs text-slate-400">
        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
      </p>
    </div>
  </div>
);

const NotificationBadge = () => {
  const { unreadCount, notifications } = useNotifications();
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (unreadCount > 0) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 1000); // Pulse for 1 second
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  const latestNotifications = notifications.slice(0, 3);

  return (
    <Sheet>
      <HoverCard openDelay={100} closeDelay={100}>
        <HoverCardTrigger asChild>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-cyan-400 hover:bg-cyan-400/10 hover:text-cyan-300 rounded-full"
            >
              <Bell className="h-6 w-6" />
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute -top-1 -right-1"
                  >
                    <Badge
                      variant="destructive"
                      className={`h-5 min-w-[1.25rem] flex items-center justify-center p-1 ${pulse ? 'animate-pulse' : ''}`}
                    >
                      {unreadCount}
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </SheetTrigger>
        </HoverCardTrigger>
        <HoverCardContent className="w-80 bg-slate-800 border-slate-700 text-white p-0">
          <div className="p-4">
            <h4 className="font-semibold">Últimas Notificaciones</h4>
          </div>
          {latestNotifications.length > 0 ? (
            <div className="px-4 pb-2">
              {latestNotifications.map((n) => (
                <NotificationPreviewItem key={n.id} notification={n} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Inbox className="w-8 h-8 mb-2" />
              <p className="text-sm">No hay notificaciones nuevas.</p>
            </div>
          )}
           <div className="p-2 text-center text-xs text-blue-400 border-t border-slate-700">
              Haz clic para ver todas
            </div>
        </HoverCardContent>
      </HoverCard>
      <SheetContent className="p-0 w-full md:w-[450px] bg-slate-950 border-slate-800 text-white">
        <NotificationCenter />
      </SheetContent>
    </Sheet>
  );
};

export default NotificationBadge;