# Resumen del Sistema (SYSTEM_SUMMARY)

Este documento ofrece una visión general y una guía de referencia rápida para el sistema de notificaciones de Terra Bella, destacando los nuevos componentes, la estructura de la base de datos, el flujo de trabajo de las Edge Functions, y las interacciones frontend.

---

## 1. Visión General de los Archivos Nuevos Creados

Se han creado y modificado una serie de archivos para implementar el robusto sistema de notificaciones:

*   **Archivos Markdown de Documentación**:
    *   `NOTIFICATIONS_SETUP.md`
    *   `ROLLBACK_LOG.md`
    *   `IMPLEMENTATION_CHECKLIST.md`
    *   `ARCHITECTURE.md`
    *   `FAQ_NOTIFICATIONS.md`
*   **Scripts**:
    *   `scripts/test-notifications.js`
*   **Archivos de Configuración de Entorno**:
    *   `.env.example`
*   **Componentes React y Hooks**:
    *   `src/components/admin/DatePickerWithRange.jsx`
    *   `src/components/admin/NotificationAuditDashboard.jsx`
    *   `src/components/guardia/GuardiaNotificationPanel.jsx`
    *   `src/components/NotificationBadge.jsx`
    *   `src/components/NotificationCenter.jsx`
    *   `src/components/NotificationInitializer.jsx`
    *   `src/components/ui/calendar.jsx`
    *   `src/components/ui/hover-card.jsx`
    *   `src/components/ui/popover.jsx`
    *   `src/hooks/useNotificationLogs.js`
    *   `src/hooks/useNotifications.js`
    *   `src/hooks/usePushNotifications.js` (Modificado)
*   **Supabase Edge Functions**:
    *   `supabase/functions/on-reserva-created.ts`
    *   `supabase/functions/send-push-notification.ts` (Modificado sustancialmente)

---

## 2. Nuevas Tablas de Base de Datos y Propósito

Se han añadido dos nuevas tablas para gestionar las notificaciones y sus logs, con sus respectivas políticas de RLS y funciones auxiliares.

*   **`public.notifications`**
    *   **Propósito**: Almacena todas las notificaciones del sistema destinadas a roles (`admin`, `guardia`) o usuarios específicos (`recipient_user_id`). Permite la entrega en la aplicación (Realtime) y gestiona el estado de lectura.
    *   **Columnas Clave**: `id`, `type`, `title`, `body`, `recipient_role`, `recipient_user_id`, `metadata` (JSONB), `read_at`, `created_at`.
*   **`public.notification_logs`**
    *   **Propósito**: Registra cada intento de envío de una notificación a través de diferentes canales (email, FCM, sistema). Útil para auditoría, depuración y monitoreo del rendimiento de las notificaciones.
    *   **Columnas Clave**: `id`, `notification_id` (FK a `notifications`), `source`, `status`, `error_message`, `metadata` (JSONB), `created_at`.

---

## 3. Nuevos Componentes React y sus Funciones

*   **`NotificationInitializer.jsx`**:
    *   **Función**: Componente invisible que se inicializa una vez en `App.jsx`. Se encarga de suscribirse a mensajes FCM globales (`onMessage`) y de disparar `toast` para notificaciones push en primer plano.
*   **`NotificationBadge.jsx`**:
    *   **Función**: Muestra un ícono de campana con un contador de notificaciones no leídas. Al pasar el ratón, muestra un `HoverCard` con una vista previa de las 3 notificaciones más recientes. Al hacer clic, abre el `NotificationCenter` en un `Sheet`.
*   **`NotificationCenter.jsx`**:
    *   **Función**: El panel principal para usuarios `admin`. Muestra una lista completa de notificaciones, permite filtrarlas por "Todas" o "No Leídas", y marcar notificaciones individualmente o todas como leídas. Se actualiza en tiempo real.
*   **`GuardiaNotificationPanel.jsx`**:
    *   **Función**: Un panel similar al `NotificationCenter` pero adaptado para guardias. Muestra notificaciones con detalles de reservas (área, residente, torre, apartamento) en un formato de tarjeta. Permite marcar como leídas y se actualiza en tiempo real.
*   **`NotificationAuditDashboard.jsx`**:
    *   **Función**: Un dashboard en el `AdminPage` que muestra un resumen estadístico (total, éxito, fallos) y una tabla paginada de los logs de notificaciones (`notification_logs`). Incluye filtros por fecha, estado y origen, y permite exportar a CSV.
*   **`DatePickerWithRange.jsx`**:
    *   **Función**: Componente reutilizable para seleccionar un rango de fechas, utilizado en el `NotificationAuditDashboard`.
*   **`HoverCard.jsx` / `Popover.jsx` / `Calendar.jsx`**:
    *   **Función**: Componentes de UI de `shadcn/ui` utilizados para construir `NotificationBadge` y `DatePickerWithRange`.
*   **Modificaciones en `AdminPage.jsx`**:
    *   Se integró `NotificationBadge` en la cabecera y `NotificationAuditDashboard` como una nueva pestaña en `AdminDashboard`.
*   **Modificaciones en `GuardiaPage.jsx`**:
    *   Se integró `GuardiaNotificationPanel` en un `Sheet` y también directamente en la página para visibilidad constante.
*   **Modificaciones en `AdminDashboard.jsx`**:
    *   Se añadió una nueva pestaña "Auditoría de Notificaciones" para integrar `NotificationAuditDashboard`.

---

## 4. Nuevos Hooks y Utilidades

*   **`useNotifications.js`**:
    *   **Función**: Hook centralizado para la gestión de notificaciones. Se encarga de cargar notificaciones desde Supabase, mantener el `unreadCount`, manejar la paginación, y suscribirse a actualizaciones en tiempo real de la tabla `notifications`. Provee funciones para marcar como leídas (individualmente o todas).
*   **`useNotificationLogs.js`**:
    *   **Función**: Hook para la gestión de los logs de notificaciones. Carga datos de la tabla `notification_logs`, aplica filtros (rango de fechas, estado, origen), calcula estadísticas y maneja la paginación. Incluye funcionalidad para exportar a CSV.
*   **`usePushNotifications.js`** (Actualizado):
    *   **Función**: Se actualizó para utilizar las credenciales correctas de Firebase (`firebaseConfig`, `VAPID_KEY`) y para guardar el token FCM asociado al `guardia_id` en la tabla `tokens_fcm_guardias`. Gestiona la solicitud de permisos y la escucha de mensajes FCM.
*   **`convertToAmPm`** (Utilidad):
    *   **Función**: Función auxiliar en `src/lib/utils.js` para convertir formatos de hora de 24 horas a AM/PM.

---

## 5. Nuevas Edge Functions

*   **`supabase/functions/on-reserva-created.ts`**:
    *   **Propósito**: Se activa mediante un webhook cuando una nueva reserva se inserta en la tabla `reservations`. Extrae los datos de la reserva, crea dos registros de notificación en `public.notifications` (uno para `admin` y otro para `guardia`), y envía un correo electrónico al administrador central (`NOTIFICATION_EMAIL_TO`). Implementa lógica de reintentos para el envío de email.
*   **`supabase/functions/send-push-notification.ts`**:
    *   **Propósito**: Reescrita para enviar notificaciones push a los dispositivos de los guardias. Autentica con Firebase Cloud Messaging (FCM) usando `FCM_CLIENT_EMAIL` y `FCM_PRIVATE_KEY`, y envía un payload estructurado a los `fcm_token` registrados en `tokens_fcm_guardias`.

---

## 6. Resumen de Archivos de Configuración

*   **`package.json`**:
    *   Define las dependencias del proyecto, incluyendo `react-day-picker` y `framer-motion` para el frontend, y `@supabase/supabase-js`, `firebase`, `lucide-react` para iconos, y `shadcn/ui` para componentes de UI.
*   **`.env.example`**:
    *   Proporciona una plantilla con todas las variables de entorno necesarias para la configuración de Supabase, SMTP (o proveedor de correo como Resend), y Firebase Cloud Messaging (FCM). Incluye `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `NOTIFICATION_EMAIL_TO`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY`, `FCM_SERVER_KEY`, `FIREBASE_PROJECT_ID`.

---

## 7. Resumen de Archivos de Documentación

Se han creado varios archivos Markdown para documentar exhaustivamente el sistema:

*   **`NOTIFICATIONS_SETUP.md`**:
    *   Instrucciones paso a paso para configurar el webhook de Supabase, las Edge Functions, las variables de entorno SMTP y las credenciales de Firebase.
*   **`ROLLBACK_LOG.md`**:
    *   Registra los componentes deshabilitados/reemplazados, las Edge Functions antiguas, las variables de entorno deprecadas, la ruta de migración al nuevo sistema y cómo restaurar el sistema antiguo si es necesario.
*   **`IMPLEMENTATION_CHECKLIST.md`**:
    *   Un checklist detallado para el despliegue del sistema, con pasos para la configuración de la base de datos, despliegue de Edge Functions, configuración de webhooks, pruebas de notificación y correo electrónico, y verificación de RLS.
*   **`ARCHITECTURE.md`**:
    *   Describe la arquitectura completa del sistema de notificaciones, el flujo de datos, el control de acceso basado en roles, el esquema de la base de datos, el flujo de trabajo de las Edge Functions, el proceso de entrega de correo electrónico SMTP, los componentes del frontend, el mecanismo de suscripción en tiempo real, el manejo de errores y las consideraciones de seguridad.
*   **`FAQ_NOTIFICATIONS.md`**:
    *   Preguntas frecuentes sobre el sistema de notificaciones, abordando temas como la visibilidad de las notificaciones, pruebas de correo electrónico, logs, personalización, nuevos tipos de notificación, manejo de fallos, deshabilitación temporal, notificaciones push para guardias y exportación de historial.

---

## 8. Guía de Referencia Rápida para Desarrolladores

*   **Conexión Supabase**: `src/lib/supabase.js`
*   **Autenticación**: `src/contexts/SupabaseAuthContext.jsx` (`useAuth` hook).
*   **Manejo de Notificaciones (Frontend)**: Utilizar `useNotifications` en componentes de UI.
*   **Registro FCM**: `usePushNotifications` para solicitar permisos y obtener/guardar el token FCM.
*   **Envío de Emails Transaccionales**: Las Edge Functions (`welcome-email.ts`, `reservation-confirmation-email.ts`) utilizan `npm:resend`. La `on-reserva-created.ts` utiliza un RPC `send_email` que debe ser compatible con un proveedor SMTP/API.
*   **Logs**: `useNotificationLogs` hook para el dashboard de auditoría.
*   **Despliegue de Edge Functions**: Subir `*.ts` a Supabase Dashboard -> Edge Functions.
*   **Configuración de Webhooks**: Supabase Dashboard -> Database -> Webhooks.
*   **Variables de Entorno**: Configurar en `.env.example` y como Supabase Secrets.

---

## 9. Estructura del Árbol de Archivos