# Arquitectura del Sistema de Notificaciones de Terra Bella

Este documento describe la arquitectura, el flujo de datos, los componentes clave y las consideraciones de seguridad del sistema de notificaciones de la aplicación Terra Bella.

---

## 1. Visión General de la Arquitectura del Sistema de Notificaciones

El sistema de notificaciones de Terra Bella es una solución robusta y en tiempo real diseñada para mantener informados a los usuarios (residentes, guardias y administradores) sobre eventos importantes, especialmente las reservas de áreas comunes. Se basa en una combinación de **Supabase** (Base de Datos, Autenticación, Edge Functions, Realtime, Almacenamiento), **Firebase Cloud Messaging (FCM)** para notificaciones push, y **Resend** (o cualquier proveedor SMTP) para el envío de correos electrónicos.