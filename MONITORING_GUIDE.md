# Guía de Monitoreo del Sistema de Notificaciones

Este documento proporciona una guía completa sobre cómo monitorear, depurar y optimizar el sistema de notificaciones de Terra Bella.

---

## 1. Monitoreo en Tiempo Real de la Entrega de Notificaciones

El sistema de notificaciones de Terra Bella ofrece varias capas de monitoreo para asegurar la entrega oportuna y precisa:

*   **Frontend (Componentes de Notificación)**:
    *   **AdminPage (`NotificationBadge`, `NotificationCenter`)**: Los administradores verán un contador de notificaciones no leídas (`unreadCount`) en el `NotificationBadge`. Al abrir el `NotificationCenter`, pueden ver una lista en tiempo real de todas las notificaciones recibidas, su estado de lectura y detalles. La suscripción a Supabase Realtime garantiza que las nuevas notificaciones aparezcan casi instantáneamente.
    *   **GuardiaPage (`GuardiaNotificationPanel`)**: Los guardias tienen su propio panel donde las nuevas notificaciones de reservas aparecen en tiempo real, destacadas visualmente si no han sido leídas.
    *   **Toasts (Notificaciones Push en el Navegador)**: Para notificaciones push en primer plano, el `NotificationInitializer` dispara un `toast` visible al usuario.
*   **Base de Datos (`public.notifications`)**:
    *   Puedes monitorear directamente la tabla `public.notifications` en el Supabase Table Editor. Nuevas filas deberían aparecer cuando la `Edge Function` `on-reserva-created` las inserta. Puedes filtrar por `created_at` para ver las más recientes.

---

## 2. Métricas Clave a Rastreaar

El `NotificationAuditDashboard` (`src/components/admin/NotificationAuditDashboard.jsx`) es tu herramienta principal para esto:

*   **Total de Envíos**: Número total de intentos de notificación registrados (email, FCM, sistema).
*   **Tasa de Éxito**: Porcentaje de notificaciones enviadas con éxito.
    *   `stats.success / stats.total * 100`
*   **Conteo de Fallos**: Número total de notificaciones que no se pudieron enviar.
    *   `stats.error`
*   **Desglose por Origen**: El dashboard te permite filtrar por `source` (email, fcm, system) para ver el rendimiento de cada canal individualmente.
*   **Errores Específicos**: Los mensajes de error en los logs proporcionan detalles sobre la causa de los fallos.

**Cómo acceder**:
1.  Inicia sesión como `admin`.
2.  Navega a la `AdminPage`.
3.  Haz clic en la pestaña **"Auditoría de Notificaciones"**.

---

## 3. Configuración de Alertas para Fallos de Notificación

Actualmente, el sistema no tiene un mecanismo de alerta automático integrado con Supabase. Sin embargo, puedes implementar uno:

*   **Supabase Custom Alerts**:
    1.  **Consulta SQL de Fallos**: Configura una consulta SQL que identifique fallos en `public.notification_logs` en un período de tiempo determinado.