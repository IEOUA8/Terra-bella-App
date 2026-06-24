# Configuración SMTP para Notificaciones de Correo Electrónico

Este documento explica cómo configurar el envío de correos electrónicos para el sistema de notificaciones de Terra Bella. Aunque Supabase no proporciona un servicio SMTP nativo para correos salientes, facilita la integración con proveedores de correo electrónico externos a través de sus Edge Functions y el sistema de Secrets.

---

## 1. Habilitar y Configurar un Proveedor de Correo Electrónico

Supabase no es un proveedor de servicios de correo electrónico (ESP) para el envío de correos salientes. En su lugar, se integra con ESPs de terceros. El sistema de Terra Bella está diseñado para funcionar con **Resend** (como se ve en `welcome-email.ts` y `reservation-confirmation-email.ts`) o cualquier otro servicio que puedas integrar a través de una Edge Function.

**Pasos Generales:**

1.  **Selecciona un Proveedor de Correo Electrónico**:
    *   **Recomendado**: Resend (simple, enfocado en desarrolladores).
    *   **Populares**: SendGrid, Mailgun, Postmark, AWS SES, Brevo (Sendinblue).
2.  **Crea una Cuenta y Configura tu Dominio**:
    *   Regístrate en el proveedor de tu elección.
    *   **Verifica tu Dominio**: Esto es CRÍTICO. Deberás añadir registros DNS (TXT, CNAME) a la configuración de tu dominio para demostrar la propiedad. Esto mejora la entregabilidad y evita que tus correos se marquen como spam.
    *   **Crea una Clave API**: Genera una clave API (API Key) que utilizarás para autenticarte desde tus Edge Functions. Guarda esta clave de forma SEGURA.

---

## 2. Dónde Encontrar Credenciales SMTP (para Proveedores Externos)

Las credenciales (host, puerto, usuario, contraseña/clave API) se encuentran en el panel de control de tu proveedor de correo electrónico.

**Ejemplos Comunes:**

*   **Resend**:
    *   No usa SMTP tradicional para su API HTTP. Solo necesitas la `RESEND_API_KEY`. La librería `npm:resend` maneja la conexión.
    *   La clave API se encuentra en tu Dashboard de Resend -> `API Keys`.
*   **SendGrid**:
    *   Dashboard de SendGrid -> `Settings` -> `API Keys` (para la clave API).
    *   Dashboard de SendGrid -> `Email API` -> `Integration Guide` -> `SMTP Relay` (para host, puerto, usuario). Generalmente: `smtp.sendgrid.net`, Puerto `587` o `2525`, Usuario `apikey`.
*   **Mailgun**:
    *   Dashboard de Mailgun -> `Sending` -> `Domain Settings` -> `SMTP Credentials`.
    *   Generalmente: `smtp.mailgun.org`, Puerto `587` o `465`.

---

## 3. Configurar Variables de Entorno SMTP en Supabase Edge Functions

Las credenciales de tu proveedor de correo electrónico deben almacenarse de forma segura como Supabase Secrets para que tus Edge Functions puedan acceder a ellas.

1.  **Accede a Supabase Dashboard**: Ve a `Project Settings` (icono de engranaje) -> `Secrets`.
2.  **Añade tus Secrets**: Haz clic en `Add a new secret` y añade las siguientes variables según tu proveedor:

    *   **Si usas Resend (Recomendado para este proyecto)**:
        *   **Name**: `RESEND_API_KEY`
        *   **Value**: `re_YOUR_RESEND_API_KEY` (tu clave API de Resend)
    *   **Si usas un proveedor SMTP tradicional (ej. SendGrid, Mailgun)**:
        *   **Name**: `SMTP_HOST`
        *   **Value**: `smtp.your-provider.com`
        *   **Name**: `SMTP_PORT`
        *   **Value**: `587` (o el puerto que te indique tu proveedor)
        *   **Name**: `SMTP_USER`
        *   **Value**: `your_smtp_username` (o `apikey` para SendGrid)
        *   **Name**: `SMTP_PASS`
        *   **Value**: `your_smtp_password` (tu clave API o contraseña)
        *   **Name**: `SMTP_FROM`
        *   **Value**: `no-reply@yourdomain.com` (la dirección de remitente verificada)

3.  **Variable del Destinatario (Opcional pero útil)**:
    *   **Name**: `NOTIFICATION_EMAIL_TO`
    *   **Value**: `terrabella.juntad@gmail.com` (o la dirección a la que deben llegar las notificaciones de reservas).

**Nota**: En las Edge Functions de este proyecto, la `on-reserva-created` llama a un RPC `send_email` y el `welcome-email` y `reservation-confirmation-email` usan la librería `npm:resend` que lee `RESEND_API_KEY`. Asegúrate de que las variables de entorno coincidan con la implementación de tu función.

---

## 4. Proceso de Envío de Correo Electrónico en las Edge Functions

Las Edge Functions `on-reserva-created.ts`, `welcome-email.ts` y `reservation-confirmation-email.ts` son las encargadas de enviar correos.

*   **`welcome-email.ts`**: Se activa automáticamente mediante un webhook de Supabase cuando un nuevo usuario se registra (`auth.users INSERT`). Envía un correo de bienvenida.
*   **`reservation-confirmation-email.ts`**: Se invoca desde el frontend (`useReservations` hook) después de que un usuario crea una reserva, para enviarle un correo de confirmación.
*   **`on-reserva-created.ts`**: Se activa mediante un webhook de Supabase cuando una nueva reserva es `INSERT` en la tabla `reservations`. Esta función **crea las notificaciones en la base de datos para admins/guardias** y envía un correo a una dirección centralizada (e.g., `terrabella.juntad@gmail.com`).

**Cómo funciona `on-reserva-created.ts` para enviar emails:**

Actualmente, `on-reserva-created.ts` utiliza el RPC `send_email` que hemos definido en la base de datos como un placeholder. Esto implica que, para que funcione, la lógica de envío real debe estar dentro de ese RPC si lo quisieras puramente SQL, o, como es más común en Edge Functions, puedes reemplazar la llamada al RPC por una integración directa con la API de tu proveedor de correo (ejemplo de Resend dentro de la función):