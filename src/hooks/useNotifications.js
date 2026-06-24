import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const NOTIFICATIONS_PER_PAGE = 15;

export const useNotifications = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!profile) return;
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .is('read_at', null)
        .or(`recipient_role.eq.${profile.role},recipient_user_id.eq.${profile.id}`);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [profile]);

  const fetchNotifications = useCallback(async (currentPage) => {
    if (!profile) {
      setLoading(false);
      return;
    }
    
    currentPage === 0 ? setLoading(true) : setLoadingMore(true);

    try {
      const from = currentPage * NOTIFICATIONS_PER_PAGE;
      const to = from + NOTIFICATIONS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`recipient_role.eq.${profile.role},recipient_user_id.eq.${profile.id}`)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setNotifications(prev => currentPage === 0 ? data : [...prev, ...data]);
      setHasMore(data.length === NOTIFICATIONS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        variant: 'destructive',
        title: 'Error al cargar notificaciones',
        description: error.message,
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [profile, toast]);

  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications(0);
  }, [fetchUnreadCount, fetchNotifications]);

  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_role=eq.${profile.role}`,
        },
        (payload) => {
          console.log('Realtime notification change received:', payload);
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new, ...prev]);
            setUnreadCount(prev => prev + 1);
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev =>
              prev.map(n => (n.id === payload.new.id ? payload.new : n))
            );
            // If it was marked as read
            if (payload.old.read_at === null && payload.new.read_at !== null) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage);
    }
  };

  const markAsRead = async (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification || notification.read_at) return;

    // Optimistic UI update
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        // Revert optimistic update on error
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, read_at: null } : n))
        );
        setUnreadCount(prev => prev + 1);
        throw error;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo marcar la notificación como leída.',
      });
    }
  };

  const markAllAsRead = async () => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
    setUnreadCount(0);

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .is('read_at', null)
        .or(`recipient_role.eq.${profile.role},recipient_user_id.eq.${profile.id}`);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking all as read:', error);
      // Revert would be complex, refetching is safer
      fetchNotifications(0);
      fetchUnreadCount();
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron marcar todas las notificaciones.',
      });
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
  };
};