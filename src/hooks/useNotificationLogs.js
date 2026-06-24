import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

const LOGS_PER_PAGE = 20;

export const useNotificationLogs = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, success: 0, error: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    dateRange: null,
    status: 'all',
    source: 'all',
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('notification_logs').select('*', { count: 'exact' });

      // Apply filters
      if (filters.dateRange?.from) {
        query = query.gte('created_at', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        const toDate = new Date(filters.dateRange.to);
        toDate.setHours(23, 59, 59, 999); // Include the whole day
        query = query.lte('created_at', toDate.toISOString());
      }
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.source !== 'all') {
        query = query.eq('source', filters.source);
      }

      // Pagination
      const from = (page - 1) * LOGS_PER_PAGE;
      const to = from + LOGS_PER_PAGE - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      setLogs(data || []);
      setTotalPages(Math.ceil((count || 0) / LOGS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching notification logs:', error);
      toast({
        variant: 'destructive',
        title: 'Error al cargar logs',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [page, filters, toast]);

  const fetchStats = useCallback(async () => {
    try {
        let totalQuery = supabase.from('notification_logs').select('id', { count: 'exact', head: true });
        let successQuery = supabase.from('notification_logs').select('id', { count: 'exact', head: true }).eq('status', 'success');
        let errorQuery = supabase.from('notification_logs').select('id', { count: 'exact', head: true }).eq('status', 'error');

        // Apply filters to stats queries
        [totalQuery, successQuery, errorQuery].forEach(q => {
            if (filters.dateRange?.from) q.gte('created_at', filters.dateRange.from.toISOString());
            if (filters.dateRange?.to) {
                const toDate = new Date(filters.dateRange.to);
                toDate.setHours(23, 59, 59, 999);
                q.lte('created_at', toDate.toISOString());
            }
            if (filters.source !== 'all') q.eq('source', filters.source);
        });

        const [
            { count: totalCount },
            { count: successCount },
            { count: errorCount }
        ] = await Promise.all([
            totalQuery,
            successQuery,
            errorQuery
        ]);

        setStats({
            total: totalCount || 0,
            success: successCount || 0,
            error: errorCount || 0,
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [fetchLogs, fetchStats]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setPage(1); // Reset to first page on filter change
  };

  const exportToCSV = () => {
    if (logs.length === 0) {
      toast({ title: 'No hay datos para exportar.' });
      return;
    }
    const headers = ['ID', 'Timestamp', 'Source', 'Status', 'Error Message', 'Metadata'];
    const rows = logs.map(log => [
      log.id,
      new Date(log.created_at).toLocaleString(),
      log.source,
      log.status,
      `"${(log.error_message || '').replace(/"/g, '""')}"`,
      `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"`
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "notification_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    logs,
    stats,
    loading,
    page,
    totalPages,
    filters,
    setPage,
    handleFilterChange,
    exportToCSV,
  };
};