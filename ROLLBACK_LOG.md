# Registro de Migración y Rollback del Sistema de Notificaciones de Terra Bella

Este documento detalla la transición del sistema de notificaciones antiguo al nuevo, incluyendo los componentes reemplazados, la nueva arquitectura implementada y los pasos para una eventual restauración al estado previo a esta migración.

**Fecha de la Migración/Implementación:** 2025-11-14

---

## 1. Componentes del Sistema de Notificaciones Reemplazados/Deshabilitados

El sistema de notificaciones previo era rudimentario y se basaba principalmente en el envío directo de notificaciones push a través de una función `send-push-notification` que fue completamente reescrita, y en la gestión de tokens FCM a través de una tabla que ahora se considera obsoleta.

*   **Lógica de Notificaciones Push (Función Edge)**: La implementación inicial y cualquier lógica previa en la función `send-push-notification` (si existía) ha sido completamente reemplazada por una versión más robusta que gestiona la autenticación de Firebase de forma más segura y envía payloads de notificación más estructurados.
*   **Gestión de Tokens FCM (Tabla)**: La tabla `tokens_fcm_guardias_old` se considera **DEPRECADA**. Aunque no se ha eliminado para preservar el historial, la lógica actual de la aplicación interactúa exclusivamente con la tabla `tokens_fcm_guardias`.

---

## 2. Old Edge Functions o Webhooks que ya no están activos

*   **Función Edge `send-push-notification` (Versión Antigua)**: Cualquier versión anterior de esta función ha sido reemplazada por la versión actualizada que incorpora mejor gestión de autenticación con Firebase y un formato de notificación más detallado.
*   **Webhooks de `reservations` (Antiguos)**: Si existían webhooks previos en la tabla `reservations` para manejar notificaciones, estos han sido reemplazados por el nuevo webhook que invoca la `Edge Function` `on-reserva-created`.

---

## 3. Variables de Entorno Deprecadas

Las siguientes variables de entorno podrían haber sido utilizadas en configuraciones previas y ya no son activamente utilizadas por el nuevo sistema en las Edge Functions relacionadas con notificaciones (aunque `FCM_SERVER_KEY` sigue siendo relevante para algunas implementaciones).

*   **`FCM_PRIVATE_KEY_ID`**: Ya no se utiliza directamente en el nuevo método de autenticación JWT para FCM.
*   **`GCP_SA_KEY`**: Si se usaba para la autenticación de Google Cloud, ha sido reemplazada por `FCM_CLIENT_EMAIL` y `FCM_PRIVATE_KEY`.

---

## 4. Ruta de Migración del Sistema Antiguo al Nuevo

La migración se realizó de la siguiente manera:

1.  **Diseño de Nuevas Tablas**: Se crearon las tablas `notifications` y `notification_logs` para un sistema de notificaciones centralizado y auditable.
2.  **Implementación de RLS**: Se definieron políticas de Row Level Security (RLS) exhaustivas para la tabla `notifications` para asegurar que cada usuario/rol solo vea sus notificaciones pertinentes.
3.  **Creación de `Edge Function` para Eventos de Reserva**:
    *   Se desarrolló `on-reserva-created.ts` para actuar como un listener a eventos `INSERT` en la tabla `reservations`.
    *   Esta función es responsable de crear entradas en la tabla `notifications` para `admin` y `guardia`, y de enviar correos electrónicos a `terrabella.juntad@gmail.com`.
4.  **Actualización de `Edge Function` de Notificaciones Push**: La función `send-push-notification.ts` fue reescrita para usar un método de autenticación más robusto con FCM y enviar datos más completos.
5.  **Desarrollo del Frontend**:
    *   Se crearon componentes (`NotificationCenter`, `NotificationBadge`, `GuardiaNotificationPanel`) y un hook (`useNotifications`) para visualizar y gestionar las notificaciones en tiempo real.
    *   Se integró la funcionalidad de notificaciones push en el frontend (`usePushNotifications` hook y `NotificationInitializer` component).
6.  **Depuración y Pruebas**: Se creó un script de pruebas (`test-notifications.js`) para verificar la funcionalidad completa del nuevo sistema.

---

## 5. Cómo Restaurar el Sistema Antiguo (Información de Backup)

La restauración al sistema "antiguo" implicaría deshacer las implementaciones actuales y reactivar la lógica previa. Dado que el sistema anterior era menos formalizado, la restauración es un proceso manual:

1.  **Desactivar Webhooks Actuales**:
    *   En el Dashboard de Supabase, navegar a `Database > Webhooks`.
    *   Eliminar o deshabilitar el webhook configurado para la tabla `public.reservations` en el evento `INSERT` (que llama a `on-reserva-created`).
2.  **Deshabilitar/Eliminar `Edge Functions` Nuevas**:
    *   En el Dashboard de Supabase, navegar a `Edge Functions`.
    *   Desplegar o eliminar las funciones `on-reserva-created` y `send-push-notification`. Si se tiene una versión anterior de `send-push-notification`, se debería redeployar.
3.  **Revertir Migración de Base de Datos**:
    *   Si se tienen backups de la base de datos previos a la creación de las tablas `notifications` y `notification_logs`, restaurar dichos backups.
    *   Alternativamente, eliminar las tablas `notifications` y `notification_logs` (y las funciones asociadas `mark_notification_as_read`, `get_unread_notifications_count`, `log_notification_attempt`).
4.  **Revertir Cambios en el Frontend**:
    *   Eliminar el hook `useNotifications.js`.
    *   Eliminar los componentes `NotificationCenter.jsx`, `NotificationBadge.jsx`, `GuardiaNotificationPanel.jsx`, `HoverCard.jsx`.
    *   Revertir los cambios en `AdminPage.jsx` y `GuardiaPage.jsx` relacionados con la integración de estos componentes.
    *   Revertir cualquier modificación en `useReservations.js` que invoque a `send-push-notification` o a la creación de notificaciones en DB.
5.  **Restaurar Variables de Entorno Antiguas**: Si se habían usado variables de entorno específicas para el sistema antiguo, reintroducirlas.

**Nota Importante**: No se mantienen backups automáticos del código de las funciones Edge. Cualquier código de función Edge anterior debe ser almacenado en control de versiones (Git) para su recuperación.

---

## 6. Componentes Nuevos Creados en el Nuevo Sistema

Los siguientes componentes fueron creados o sustancialmente modificados como parte de esta migración para construir el nuevo sistema de notificaciones:

### Frontend
*   `src/hooks/useNotifications.js`: Hook React para gestionar el estado, carga y actualizaciones en tiempo real de las notificaciones.
*   `src/components/NotificationCenter.jsx`: Componente UI principal para mostrar y gestionar la lista completa de notificaciones.
*   `src/components/NotificationBadge.jsx`: Componente UI para mostrar un ícono de campana con contador de no leídas y previsualización al pasar el ratón.
*   `src/components/guardia/GuardiaNotificationPanel.jsx`: Componente UI específico para guardias, mostrando notificaciones de reservas con detalles y acciones.
*   `src/components/ui/hover-card.jsx`: Componente de UI básico de shadcn/ui para la funcionalidad de hovercard.
*   `src/components/NotificationInitializer.jsx`: Componente invisible que inicializa listeners globales para notificaciones FCM.
*   `src/hooks/usePushNotifications.js`: Hook actualizado para gestionar el registro de tokens FCM y permisos.
*   **Modificaciones Integradas**: `AdminPage.jsx`, `GuardiaPage.jsx`, `App.jsx` (para `NotificationInitializer`).

### Backend (Supabase Edge Functions)
*   `supabase/functions/on-reserva-created.ts`: Edge Function que se activa con la creación de reservas, inserta notificaciones en DB y envía emails.
*   `supabase/functions/send-push-notification.ts`: Edge Function completamente reescrita para enviar notificaciones push a dispositivos (guardias) vía FCM.

### Base de Datos (SQL Migrations)
*   Tabla `public.notifications`: Para almacenar todas las notificaciones del sistema.
*   Tabla `public.notification_logs`: Para auditar los intentos de envío de notificaciones.
*   Políticas RLS para `public.notifications` y `public.notification_logs`.
*   Funciones SQL: `public.send_email`, `public.mark_notification_as_read`, `public.get_unread_notifications_count`, `public.log_notification_attempt`.

### Scripts
*   `scripts/test-notifications.js`: Script Node.js para probar la funcionalidad end-to-end del sistema de notificaciones.

### Documentación
*   `NOTIFICATIONS_SETUP.md`: Documentación detallada para la configuración del nuevo sistema de notificaciones.

---