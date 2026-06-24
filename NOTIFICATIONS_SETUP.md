# Configuración del Sistema de Notificaciones de Terra Bella

Este documento describe los pasos necesarios para configurar el sistema de notificaciones en Supabase y la aplicación frontend de Terra Bella. El sistema está diseñado para enviar notificaciones a los administradores y guardias, así como correos electrónicos a una dirección de contacto, cada vez que se crea o cancela una reserva.

## 1. Arquitectura del Flujo de Notificaciones

El sistema de notificaciones de Terra Bella sigue el siguiente flujo:

1.  **Reserva Creada/Cancelada**: Un usuario (residente o administrador) crea o cancela una reserva en la aplicación frontend.
2.  **Evento en Supabase**: La acción de crear/cancelar una reserva en la base de datos de Supabase dispara un evento `INSERT` o `UPDATE` (si se cambia el estado a 'cancelled') en la tabla `reservations`.
3.  **Webhook de Supabase**: Este evento activa un webhook configurado en Supabase.
4.  **Edge Function (`on-reserva-created`/`on-reserva-cancelled`)**: El webhook llama a la `Edge Function` correspondiente (`on-reserva-created.ts` o `on-reserva-cancelled.ts`).
5.  **Creación de Notificaciones en DB**: La `Edge Function` inserta registros en la tabla `notifications` (para roles de `admin` y `guardia`).
6.  **Envío de Correo Electrónico**: La `Edge Function` también utiliza un servicio de correo electrónico (vía RPC `send_email`) para enviar una alerta detallada a una dirección específica.
7.  **Registro de Logs**: Cada intento de notificación (correo o inserción en DB) se registra en la tabla `notification_logs`.
8.  **Notificaciones Push (FCM)**: La función `send-push-notification` (llamada desde el frontend o una `Edge Function` separada) envía mensajes push a los dispositivos de los guardias registrados vía Firebase Cloud Messaging (FCM).
9.  **Realtime Frontend**: El componente `NotificationCenter` en el frontend se suscribe a la tabla `notifications` y muestra las alertas en tiempo real a los usuarios con los roles apropiados.