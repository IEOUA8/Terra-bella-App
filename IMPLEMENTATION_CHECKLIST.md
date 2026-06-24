# Checklist de Implementación del Nuevo Sistema de Notificaciones de Terra Bella

Este documento proporciona una guía paso a paso para desplegar y verificar el nuevo sistema de notificaciones de Terra Bella. Cada paso incluye una casilla de verificación y un tiempo estimado para su ejecución.

---

## 🚀 Despliegue del Sistema de Notificaciones

### 1. Configuración de Base de Datos (Migrations)
Ejecutar la migración SQL para crear las tablas `notifications`, `notification_logs`, definir las políticas RLS y las funciones auxiliares.

- [ ] **Acción**: Ejecutar el script SQL proporcionado en `ROLLBACK_LOG.md` (o la migración de la base de datos).
  - **Ubicación**: Supabase Dashboard -> SQL Editor
  - **Script**: `CREATE TABLE IF NOT EXISTS public.notifications (...)`, `CREATE TABLE IF NOT EXISTS public.notification_logs (...)` y las sentencias `CREATE POLICY` y `CREATE FUNCTION` asociadas.
- [ ] **Verificación**: Asegurarse de que las tablas `notifications` y `notification_logs` existen, las políticas RLS están habilitadas y las funciones (`send_email`, `mark_notification_as_read`, `get_unread_notifications_count`, `log_notification_attempt`) están creadas.
- [ ] **Tiempo Estimado**: 5-10 minutos

---

### 2. Configurar Supabase Secrets y Environment Variables
Establecer las variables de entorno necesarias para la aplicación y las Edge Functions.

- [ ] **Acción**: Añadir las siguientes variables de entorno como Supabase Secrets.
  - **Ubicación**: Supabase Dashboard -> Project Settings (icono de engranaje) -> Secrets
  - **Variables**:
    - `SUPABASE_URL`: (ya debería existir)
    - `SUPABASE_ANON_KEY`: (ya debería existir)
    - `SUPABASE_SERVICE_ROLE_KEY`: Clave de rol de servicio (se encuentra en `Project Settings -> API`). **CRÍTICO: No exponer en el frontend.**
    - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: (Si se usa un proveedor SMTP directo desde las Edge Functions; si se usa Resend o similar, estas no son necesarias, pero `RESEND_API_KEY` sí lo es).
    - `NOTIFICATION_EMAIL_TO`: `terrabella.juntad@gmail.com` (o la dirección deseada para recibir alertas).
    - `RESEND_API_KEY`: Tu clave API de Resend (si utilizas Resend para emails transaccionales).
    - `FCM_CLIENT_EMAIL`: Correo electrónico de la cuenta de servicio de Firebase (para `send-push-notification`).
    - `FCM_PRIVATE_KEY`: Clave privada de la cuenta de servicio de Firebase (para `send-push-notification`).
    - `FCM_SERVER_KEY`: Clave del servidor de Firebase (para `send-push-notification`).
    - `FIREBASE_PROJECT_ID`: ID de tu proyecto de Firebase (para `send-push-notification`).
- [ ] **Verificación**: Todas las variables listadas deben estar presentes y configuradas correctamente.
- [ ] **Tiempo Estimado**: 10-15 minutos

---

### 3. Desplegar Edge Functions
Desplegar las Edge Functions actualizadas.

- [ ] **Acción**: Desplegar la Edge Function `on-reserva-created.ts`.
  - **Ubicación**: Supabase Dashboard -> Edge Functions -> Click en "New Function" o actualizar existente.
  - **Nombre del archivo/slug**: `on-reserva-created`
  - **Archivo de código**: El contenido proporcionado para `on-reserva-created.ts`.
- [ ] **Acción**: Desplegar la Edge Function `send-push-notification.ts`.
  - **Ubicación**: Supabase Dashboard -> Edge Functions -> Click en "New Function" o actualizar existente.
  - **Nombre del archivo/slug**: `send-push-notification`
  - **Archivo de código**: El contenido proporcionado para `send-push-notification.ts`.
- [ ] **Verificación**: Ambas funciones deben aparecer como desplegadas y activas en el Dashboard de Supabase.
- [ ] **Tiempo Estimado**: 5 minutos

---

### 4. Crear Database Webhook para `reservations.insert`
Configurar el webhook para que la Edge Function `on-reserva-created` se dispare automáticamente.

- [ ] **Acción**: Crear un nuevo Database Webhook.
  - **Ubicación**: Supabase Dashboard -> Database -> Webhooks
  - **Nombre**: `on_reserva_created_webhook` (o un nombre descriptivo).
  - **Tabla**: `public.reservations`
  - **Evento**: `INSERT` (solo para INSERT).
  - **URL**: La URL de tu Edge Function `on-reserva-created`. Generalmente es `https://<YOUR-PROJECT-REF>.supabase.co/functions/v1/on-reserva-created`.
  - **Headers**: Puedes dejarlo vacío por defecto.
  - **Trigger**: `AFTER`
- [ ] **Verificación**: El webhook debe aparecer listado y activo en el Dashboard de Supabase.
- [ ] **Tiempo Estimado**: 3-5 minutos

---

### 5. Despliegue de Componentes Frontend
Asegurarse de que los nuevos componentes de React y hooks están en la base de código.

- [ ] **Acción**: Integrar los archivos `NotificationBadge.jsx`, `NotificationCenter.jsx`, `GuardiaNotificationPanel.jsx`, `useNotifications.js`, `useNotificationLogs.js`, `DatePickerWithRange.jsx`, `HoverCard.jsx`, `Popover.jsx`, `Calendar.jsx` y `NotificationAuditDashboard.jsx` en tu proyecto.
- [ ] **Acción**: Actualizar `AdminPage.jsx` y `GuardiaPage.jsx` para incluir los nuevos componentes.
- [ ] **Acción**: Asegurarse de que `src/components/NotificationInitializer.jsx` está integrado en `App.jsx`.
- [ ] **Verificación**: La aplicación frontend debe compilarse sin errores y los nuevos componentes de notificaciones deben ser visibles en las páginas `AdminPage` y `GuardiaPage`.
- [ ] **Tiempo Estimado**: 10-20 minutos (depende de la familiaridad con el codebase)

---

## ✅ Verificación y Pruebas

### 6. Ejecutar el Script de Pruebas `test-notifications.js`
Verificar la funcionalidad end-to-end del sistema.

- [ ] **Acción**: Configurar el archivo `.env` para el script de prueba con `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, y credenciales de usuarios de prueba (`TEST_RESIDENT_EMAIL`, `TEST_RESIDENT_PASSWORD`, `TEST_GUARDIA_EMAIL`, `TEST_GUARDIA_PASSWORD`).
- [ ] **Acción**: Ejecutar el script: `node scripts/test-notifications.js`
- [ ] **Verificación**:
    - **Consola**: El script debe mostrar "PASS" para todas las pruebas.
    - **Supabase DB**:
        - `notifications`: Deben haberse creado notificaciones de prueba y luego eliminado.
        - `notification_logs`: Deben haberse creado logs de prueba y luego eliminado.
        - `reservations`: La reserva de prueba debe haberse creado y luego eliminado.
- [ ] **Tiempo Estimado**: 5-10 minutos

---

### 7. Verificación Manual de Creación de Notificaciones (Frontend)
Crear una reserva y observar las notificaciones en el dashboard.

- [ ] **Acción**: Iniciar sesión como un usuario administrador o guardia.
- [ ] **Acción**: Ir a la `AdminPage` y usar el botón "Nueva Reserva" o "Reserva Rápida" para crear una nueva reserva.
- [ ] **Verificación**:
    - **AdminPage**: La campana de notificaciones debe mostrar un badge de conteo no leído y la nueva notificación debe aparecer en el `NotificationCenter`.
    - **GuardiaPage**: Si el usuario es un guardia, también debería ver la notificación en su `GuardiaNotificationPanel`.
    - **Supabase DB**: Verificar que se hayan insertado nuevas entradas en la tabla `notifications` para los roles `admin` y `guardia`.
- [ ] **Tiempo Estimado**: 3-5 minutos

---

### 8. Verificación Manual de Entrega de Email
Confirmar que los correos electrónicos se envían correctamente.

- [ ] **Acción**: Crear una nueva reserva (ver paso anterior).
- [ ] **Verificación**: Revisar la bandeja de entrada del correo electrónico configurado en `NOTIFICATION_EMAIL_TO` (`terrabella.juntad@gmail.com`). Deberías recibir un correo con los detalles de la nueva reserva.
- [ ] **Supabase DB**: Verificar que la tabla `notification_logs` contenga un registro con `source: 'email'` y `status: 'success'` para la reserva creada.
- [ ] **Tiempo Estimado**: 2-3 minutos

---

### 9. Verificación Manual de Políticas RLS
Asegurarse de que los usuarios solo ven las notificaciones que les corresponden.

- [ ] **Acción**: Iniciar sesión como un `residente` y verificar si puede ver notificaciones de `admin` o `guardia`. (No debería).
- [ ] **Acción**: Iniciar sesión como `guardia` y verificar si puede ver las notificaciones para el rol `guardia` o las dirigidas específicamente a su `user_id`. (Debería).
- [ ] **Acción**: Iniciar sesión como `admin` y verificar si puede ver todas las notificaciones. (Debería).
- [ ] **Tiempo Estimado**: 5-7 minutos

---

### 10. Monitoreo de `notification_logs`
Verificar el funcionamiento del panel de auditoría.

- [ ] **Acción**: Navegar a la `AdminPage` y seleccionar la pestaña "Auditoría de Notificaciones".
- [ ] **Verificación**:
    - Las estadísticas (`Total de Envíos`, `Tasa de Éxito`, `Envíos Fallidos`) deben reflejar los datos de las pruebas.
    - La tabla debe mostrar los registros de logs.
    - Los filtros (fecha, estado, origen) deben funcionar correctamente.
    - La funcionalidad de "Exportar a CSV" debe generar un archivo con los datos correctos.
- [ ] **Tiempo Estimado**: 3-5 minutos

---

**¡Felicidades!** Una vez que todos los pasos estén marcados y verificados, tu nuevo sistema de notificaciones de Terra Bella estará completamente desplegado y operativo.