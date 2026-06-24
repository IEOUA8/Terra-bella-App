import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNotificationLogs } from '@/hooks/useNotificationLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from './DatePickerWithRange';
import { Loader2, AlertCircle, CheckCircle, BarChart, Download } from 'lucide-react';

const StatCard = ({ title, value, icon, rate }) => (
  <Card className="bg-slate-800/50 border-slate-700 text-white">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-slate-300">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-4xl font-bold">{rate ? `${value}%` : value}</div>
    </CardContent>
  </Card>
);

const NotificationAuditDashboard = () => {
  const {
    logs,
    stats,
    loading,
    page,
    totalPages,
    filters,
    setPage,
    handleFilterChange,
    exportToCSV,
  } = useNotificationLogs();

  const successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total de Envíos" value={stats.total} icon={<BarChart className="h-5 w-5 text-blue-400" />} />
        <StatCard title="Tasa de Éxito" value={successRate} rate={true} icon={<CheckCircle className="h-5 w-5 text-green-400" />} />
        <StatCard title="Envíos Fallidos" value={stats.error} icon={<AlertCircle className="h-5 w-5 text-red-400" />} />
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-white">Filtros de Auditoría</CardTitle>
            <Button onClick={exportToCSV} variant="outline" className="bg-slate-700 border-slate-600 hover:bg-slate-600">
              <Download className="mr-2 h-4 w-4" />
              Exportar a CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <DatePickerWithRange date={filters.dateRange} setDate={(value) => handleFilterChange('dateRange', value)} />
          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 text-white border-slate-700">
              <SelectItem value="all">Todos los Estados</SelectItem>
              <SelectItem value="success">Éxito</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.source} onValueChange={(value) => handleFilterChange('source', value)}>
            <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
              <SelectValue placeholder="Origen" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 text-white border-slate-700">
              <SelectItem value="all">Todos los Orígenes</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="fcm">FCM</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="system">Sistema</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead className="text-white">Timestamp</TableHead>
              <TableHead className="text-white">Origen</TableHead>
              <TableHead className="text-white">Estado</TableHead>
              <TableHead className="text-white">Detalles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : logs.length > 0 ? (
              logs.map((log) => (
                <TableRow key={log.id} className="border-slate-800">
                  <TableCell>{format(new Date(log.created_at), 'dd MMM yyyy, HH:mm:ss', { locale: es })}</TableCell>
                  <TableCell>{log.source}</TableCell>
                  <TableCell>
                    <Badge variant={log.status === 'error' ? 'destructive' : 'default'} className={log.status === 'success' ? 'bg-green-600' : ''}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-400 max-w-xs truncate">{log.error_message || 'N/A'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-slate-400">
                  No se encontraron logs con los filtros seleccionados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <span className="text-sm text-slate-400">
          Página {page} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="bg-slate-800 border-slate-700"
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="bg-slate-800 border-slate-700"
        >
          Siguiente
        </Button>
      </div>
    </motion.div>
  );
};

export default NotificationAuditDashboard;