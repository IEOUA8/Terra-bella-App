# Preguntas Frecuentes (FAQ) del Sistema de Notificaciones

Este documento responde a las preguntas más comunes sobre el funcionamiento, configuración y resolución de problemas del sistema de notificaciones de Terra Bella.

---

### 1. ¿Por qué no aparece mi notificación?

Si una notificación no está apareciendo donde esperas, considera los siguientes puntos:

*   **Rol del Usuario**: Asegúrate de que el usuario que espera la notificación tiene el rol correcto (`admin`, `guardia`) para recibirla. Las notificaciones tienen un `recipient_role` o `recipient_user_id` específico.
*   **Filtros de Vista**: En el `NotificationCenter` (Panel de Administrador) o `GuardiaNotificationPanel`, verifica que no estés filtrando solo por "No Leídas" si la notificación ya fue marcada como tal. Cambia el filtro a "Todas".
*   **Permisos del Navegador (Push Notifications)**: Si esperas una notificación push (para guardias), asegúrate de que el navegador tenga permisos para mostrar notificaciones. Si no los tienes, actívalos desde la configuración del navegador o usa el botón "Activar Notificaciones" en el `Portal de Guardia`.
*   **Evento Disparador**: Confirma que el evento que debería haber disparado la notificación (por ejemplo, la creación de una reserva) realmente ocurrió y se registró en la base de datos (`reservations` tabla).
*   **Logs de Notificaciones**: Consulta el `NotificationAuditDashboard` en el Panel de Administrador o la tabla `notification_logs` directamente en Supabase para ver si hubo errores al intentar crear o enviar la notificación.
*   **Suscripción Realtime**: Asegúrate de que tu conexión a internet sea estable y que la aplicación esté correctamente suscrita a las actualizaciones en tiempo real de Supabase.

---

### 2. ¿Cómo puedo probar si los correos electrónicos se están enviando?

Para verificar el envío de correos electrónicos del sistema:

1.  **Crea una Reserva de Prueba**: Utiliza el frontend (Panel de Administrador -> "Nueva Reserva" o "Reserva Rápida") para crear una nueva reserva. Esto debería activar el webhook y la `Edge Function` `on-reserva-created`.
2.  **Verifica la Bandeja de Entrada**: Revisa la bandeja de entrada del correo electrónico configurado para recibir las alertas (generalmente `terrabella.juntad@gmail.com`, definido por `NOTIFICATION_EMAIL_TO`).
3.  **Consulta los Logs**: Accede al `NotificationAuditDashboard` en el Panel de Administrador (pestaña "Auditoría de Notificaciones") o consulta directamente la tabla `public.notification_logs` en Supabase. Busca un registro con `source: 'email'` y `status: 'success'` asociado a la reserva que acabas de crear.
4.  **Revisa los Logs de la Edge Function**: En el Dashboard de Supabase, ve a `Edge Functions` -> `on-reserva-created` -> `Logs`. Busca mensajes que indiquen el éxito o fallo del envío de correo.

---

### 3. ¿Cómo puedo verificar los logs de notificaciones?

Tienes dos formas principales de revisar los logs de notificaciones:

1.  **Dashboard de Auditoría (Frontend)**:
    *   Inicia sesión como administrador.
    *   Navega a `Panel de Administrador`.
    *   Haz clic en la pestaña **"Auditoría de Notificaciones"**.
    *   Aquí verás una tabla detallada con todos los intentos de notificación (email, FCM, etc.), su estado (éxito/error), origen, timestamp y cualquier mensaje de error. Puedes filtrar por fecha, estado y origen.
2.  **Directamente en la Base de Datos (Supabase)**:
    *   Accede a tu Dashboard de Supabase.
    *   Ve a `Table Editor`.
    *   Busca la tabla `public.notification_logs`.
    *   Aquí podrás ver todos los registros crudos de los intentos de notificación.

---

### 4. ¿Puedo personalizar los mensajes de notificación?

Sí, puedes personalizar los mensajes de notificación:

*   **Para Notificaciones en la Aplicación (tabla `notifications`)**:
    *   Debes modificar la `Edge Function` que genera estas notificaciones (principalmente `on-reserva-created.ts`). Aquí se construyen el `title` y `body` que se insertan en la tabla `notifications`.
*   **Para Correos Electrónicos**:
    *   Modifica el contenido HTML dentro de la `Edge Function` que envía el correo (`on-reserva-created.ts`, `welcome-email.ts`, `reservation-confirmation-email.ts`).
    *   Si usas un proveedor como Resend o SendGrid, también puedes crear y gestionar plantillas directamente en su plataforma y luego referenciarlas desde tu `Edge Function`.

---

### 5. ¿Cómo puedo añadir nuevos tipos de notificación?

Para añadir un nuevo tipo de notificación (ej. `maintenance_alert`):

1.  **Actualiza el Esquema de la Base de Datos**:
    *   Modifica la definición de la tabla `public.notifications` para incluir el nuevo tipo en la restricción `CHECK` de la columna `type`.
    *   Ejemplo: `type TEXT NOT NULL CHECK (type IN ('reservation_created', 'reservation_cancelled', ..., 'new_type_here'))`.
2.  **Actualiza la Lógica de Creación**:
    *   Identifica o crea la `Edge Function` o el código de la aplicación que generará este nuevo tipo de notificación.
    *   Al insertar un registro en la tabla `notifications`, usa el nuevo valor en el campo `type`.
3.  **Actualiza el Frontend (Opcional)**:
    *   Si el nuevo tipo de notificación requiere una representación visual diferente (ej. un ícono específico) en el `NotificationCenter` o `GuardiaNotificationPanel`, deberás modificar la lógica de renderizado de esos componentes para manejar el nuevo `type`.

---

### 6. ¿Qué sucede si el envío de correo electrónico falla?

El sistema está diseñado para manejar fallos en el envío de correos electrónicos:

*   **Reintentos (Retry Logic)**: La `Edge Function` `on-reserva-created.ts` implementa una lógica de reintentos con *exponential backoff* (hasta 3 intentos) para el envío de correos. Esto aumenta la resiliencia ante fallos transitorios de la red o del proveedor de correo.
*   **Registro de Errores**: Si el envío de correo falla después de todos los reintentos, se registrará una entrada en la tabla `public.notification_logs` con `source: 'email'` y `status: 'error'`, incluyendo el `error_message` detallado.
*   **Impacto**: Un fallo en el envío de correo **no detendrá** el resto del proceso de notificación (por ejemplo, las notificaciones en la aplicación para administradores y guardias se seguirán creando).

---

### 7. ¿Cómo puedo deshabilitar las notificaciones temporalmente?

Dependiendo del tipo de notificación:

*   **Notificaciones en la Aplicación (via tabla `notifications`)**:
    *   **Deshabilitar Creación**: Puedes deshabilitar temporalmente el webhook de Supabase que dispara la `Edge Function` `on-reserva-created.ts`. Ve a `Database` -> `Webhooks` en el Dashboard de Supabase y desactiva el webhook `on_reserva_created_webhook`.
    *   **Deshabilitar Visualización**: Puedes comentar o eliminar la integración de los componentes `NotificationBadge` y `NotificationCenter` en el frontend.
*   **Correos Electrónicos**:
    *   Comenta o elimina la sección de envío de correo electrónico dentro de las `Edge Functions` (`on-reserva-created.ts`, `welcome-email.ts`, etc.).
*   **Notificaciones Push (FCM)**:
    *   La `Edge Function` `send-push-notification.ts` dejará de funcionar si no hay tokens FCM válidos en `tokens_fcm_guardias`. Puedes desactivar temporalmente la lógica que invoca esta función en el frontend.

---

### 8. ¿Pueden los guardias recibir notificaciones push?

Sí, los guardias están configurados para recibir notificaciones push en sus dispositivos.

*   **Activación**: Desde el `Portal de Guardia`, los guardias pueden hacer clic en el botón **"Activar Notificaciones"**. Esto solicitará permisos al navegador y registrará su token FCM en la base de datos (`public.tokens_fcm_guardias`).
*   **Funcionamiento**: Cuando se crea una nueva reserva, la `Edge Function` `send-push-notification.ts` (invocada desde `useReservations.js` en el frontend al crear la reserva) enviará una notificación a todos los tokens FCM registrados para guardias.
*   **Recepción**: Las notificaciones aparecerán como alertas nativas en el dispositivo del guardia, incluso si la aplicación no está abierta.

---

### 9. ¿Cómo puedo exportar el historial de notificaciones?

Puedes exportar el historial de los **logs de notificaciones** (no las notificaciones individuales que un usuario ve, sino los registros de los intentos de envío) a un archivo CSV.

*   **Desde el Dashboard de Auditoría**:
    *   Inicia sesión como administrador.
    *   Navega a `Panel de Administrador`.
    *   Haz clic en la pestaña **"Auditoría de Notificaciones"**.
    *   Aplica los filtros de fecha, estado u origen que desees.
    *   Haz clic en el botón **"Exportar a CSV"**. Esto descargará un archivo CSV con los logs actualmente filtrados y visibles en la tabla.

---

### 10. ¿Cuáles son los límites de tasa (rate limits) para las notificaciones?

Los límites de tasa dependen de los servicios utilizados:

*   **Supabase Realtime**: Supabase tiene límites de concurrencia y tráfico para su servicio Realtime. Para la mayoría de las aplicaciones, estos límites son generosos, pero en caso de uso muy intensivo, se pueden consultar sus políticas.
*   **Proveedor de Correo Electrónico (ej. Resend, SendGrid)**: Cada proveedor de correo tiene sus propios límites de tasa de envío (número de correos por minuto/hora/día). Es crucial consultar la documentación de tu proveedor para entender y respetar estos límites y evitar bloqueos. Para Terra Bella, que envía correos transaccionales, estos límites rara vez son un problema.
*   **Firebase Cloud Messaging (FCM)**: FCM tiene límites de tasa muy altos y está diseñado para enviar mensajes a gran escala. Es poco probable que se alcancen estos límites en un entorno de condominio.
*   **Supabase Edge Functions**: Las Edge Functions tienen límites de invocación y ejecución. Estos límites son lo suficientemente altos para soportar la carga de un sistema de notificaciones como el de Terra Bella.

Para un uso normal, el sistema está diseñado para operar dentro de los límites estándar de estos servicios sin necesidad de configuraciones especiales.