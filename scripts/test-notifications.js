/* eslint-disable no-console */

// Standalone test script for the Terra Bella notification system.
// To run this script:
// 1. Make sure you have Node.js installed.
// 2. Install dependencies: `npm install @supabase/supabase-js`
// 3. Create a `.env` file in this directory with your Supabase credentials:
//    SUPABASE_URL=...
//    SUPABASE_SERVICE_ROLE_KEY=...
//    TEST_RESIDENT_EMAIL=resident@test.com
//    TEST_RESIDENT_PASSWORD=password
//    TEST_GUARDIA_EMAIL=guardia@test.com
//    TEST_GUARDIA_PASSWORD=password
// 4. Run the script: `node scripts/test-notifications.js`

import { createClient } from '@supabase/supabase-js';
import process from 'process';

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://njrpatnmweyrvfcbfdrp.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// --- TEST USERS (Deberían existir en tu Auth de Supabase) ---
const TEST_USERS = {
  resident: {
    email: process.env.TEST_RESIDENT_EMAIL || 'resident@test.com',
    password: process.env.TEST_RESIDENT_PASSWORD || 'password123',
    id: null, // Se obtendrá después del login
  },
  guardia: {
    email: process.env.TEST_GUARDIA_EMAIL || 'guardia@test.com',
    password: process.env.TEST_GUARDIA_PASSWORD || 'password123',
    id: null, // Se obtendrá después del login
  },
};

// --- UTILITIES ---
const log = {
  info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  pass: (msg) => console.log(`\x1b[32m[PASS]\x1b[0m ${msg}`),
  fail: (msg) => console.error(`\x1b[31m[FAIL]\x1b[0m ${msg}`),
  step: (msg) => console.log(`\n\x1b[33m--- ${msg} ---\x1b[0m`),
  error: (err) => console.error(`\x1b[31m[ERROR]\x1b[0m`, err),
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const cleanupIds = {
  reservationId: null,
  notificationIds: [],
};

// --- MAIN TEST RUNNER ---
async function runTests() {
  log.info("Iniciando suite de pruebas del sistema de notificaciones...");

  if (!SERVICE_ROLE_KEY) {
    log.fail("La variable de entorno SUPABASE_SERVICE_ROLE_KEY no está configurada. Abortando pruebas.");
    return;
  }

  // Crear cliente con rol de servicio para las pruebas
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    await test_01_DatabaseConnection(supabaseAdmin);
    await test_02_CreateTestUsersAndReservation(supabaseAdmin);
    await test_03_VerifyNotificationCreation(supabaseAdmin);
    await test_04_CheckNotificationLogs(supabaseAdmin);
    await test_05_ValidateRLSPolicies();
    await test_06_MarkNotificationAsRead(supabaseAdmin);
  } catch (error) {
    log.fail("Una prueba crítica falló, deteniendo la ejecución.");
    log.error(error);
  } finally {
    log.step("Limpieza de datos de prueba");
    await cleanup(supabaseAdmin);
  }
}

// --- TEST CASES ---

async function test_01_DatabaseConnection(client) {
  log.step("Test 1: Conexión a la base de datos");
  const { data, error } = await client.from('user_profiles').select('id').limit(1);
  if (error) {
    log.fail("No se pudo conectar a la base de datos.");
    throw error;
  }
  log.pass("Conexión a la base de datos exitosa.");
}

async function test_02_CreateTestUsersAndReservation(client) {
  log.step("Test 2: Crear reserva de prueba para activar webhook");

  // Iniciar sesión como residente para obtener su ID
  const { data: { user: residentUser }, error: residentLoginError } = await client.auth.signInWithPassword({
    email: TEST_USERS.resident.email,
    password: TEST_USERS.resident.password,
  });
  if (residentLoginError) {
    log.fail(`No se pudo iniciar sesión como residente de prueba (${TEST_USERS.resident.email}). Asegúrate de que el usuario exista.`);
    throw residentLoginError;
  }
  TEST_USERS.resident.id = residentUser.id;
  log.info(`Residente de prueba autenticado: ${residentUser.email}`);

  const testReservation = {
    user_id: TEST_USERS.resident.id,
    user_name: 'Usuario de Prueba',
    area_id: '1',
    area_name: 'Piscina',
    date: new Date().toISOString().split('T')[0],
    time: '14:00',
    tower: 'A',
    apartment: '101',
    status: 'confirmed',
  };

  const { data, error } = await client.from('reservations').insert(testReservation).select().single();
  if (error) {
    log.fail("No se pudo crear la reserva de prueba.");
    throw error;
  }
  cleanupIds.reservationId = data.id;
  log.pass(`Reserva de prueba creada con éxito (ID: ${data.id}).`);
}

async function test_03_VerifyNotificationCreation(client) {
  log.step("Test 3: Verificar creación de notificaciones en la tabla 'notifications'");
  log.info("Esperando 5 segundos para que la Edge Function se ejecute...");
  await delay(5000);

  const { data, error } = await client
    .from('notifications')
    .select('*')
    .eq('metadata->>reservation_id', cleanupIds.reservationId);

  if (error) {
    log.fail("Error al consultar la tabla 'notifications'.");
    throw error;
  }

  if (data.length < 2) {
    log.fail(`Se esperaban al menos 2 notificaciones, pero se encontraron ${data.length}.`);
    return;
  }

  const adminNotification = data.find(n => n.recipient_role === 'admin');
  const guardiaNotification = data.find(n => n.recipient_role === 'guardia');

  if (!adminNotification) log.fail("No se encontró la notificación para el rol 'admin'.");
  else log.pass("Notificación para 'admin' creada correctamente.");

  if (!guardiaNotification) log.fail("No se encontró la notificación para el rol 'guardia'.");
  else log.pass("Notificación para 'guardia' creada correctamente.");

  if(adminNotification && guardiaNotification) {
      cleanupIds.notificationIds = data.map(n => n.id);
  } else {
      throw new Error("Faltaron notificaciones esperadas.");
  }
}

async function test_04_CheckNotificationLogs(client) {
  log.step("Test 4: Verificar logs de envío en 'notification_logs'");
  
  const { data, error } = await client
    .from('notification_logs')
    .select('*')
    .eq('metadata->>reservation_id', cleanupIds.reservationId);

  if (error) {
    log.fail("Error al consultar la tabla 'notification_logs'.");
    throw error;
  }

  if (data.length === 0) {
    log.fail("No se encontró ningún log para la reserva de prueba.");
    return;
  }

  const emailLog = data.find(log => log.source === 'email');
  if (!emailLog) {
    log.fail("No se encontró el log de envío de correo electrónico.");
  } else if (emailLog.status === 'success') {
    log.pass("Se registró un intento de envío de correo exitoso.");
  } else {
    log.fail(`Se registró un intento de envío de correo con estado '${emailLog.status}': ${emailLog.error_message}`);
  }
}

async function test_05_ValidateRLSPolicies() {
  log.step("Test 5: Validar políticas de RLS");

  // Test como Guardia
  const supabaseGuardia = createClient(SUPABASE_URL, SERVICE_ROLE_KEY); // Usar service key para simular login
  const { data: { session: guardiaSession }, error: guardiaLoginError } = await supabaseGuardia.auth.signInWithPassword({
    email: TEST_USERS.guardia.email,
    password: TEST_USERS.guardia.password,
  });
  if (guardiaLoginError) {
    log.fail("No se pudo iniciar sesión como guardia.");
    throw guardiaLoginError;
  }
  
  const { data: guardiaNotifications, error: guardiaError } = await supabaseGuardia.from('notifications').select('*');
  if (guardiaError) {
      log.fail(`RLS Guardia: Error al consultar notificaciones: ${guardiaError.message}`);
  } else {
      const canSeeOwnRoleNotifs = guardiaNotifications.some(n => n.recipient_role === 'guardia');
      if (canSeeOwnRoleNotifs) log.pass("RLS Guardia: Puede ver notificaciones de su rol.");
      else log.fail("RLS Guardia: No puede ver notificaciones de su rol.");
  }
  await supabaseGuardia.auth.signOut();


  // Test como Residente
  const supabaseResident = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: { session: residentSession }, error: residentLoginError } = await supabaseResident.auth.signInWithPassword({
    email: TEST_USERS.resident.email,
    password: TEST_USERS.resident.password,
  });
  if (residentLoginError) {
    log.fail("No se pudo iniciar sesión como residente.");
    throw residentLoginError;
  }

  const { data: residentNotifications, error: residentError } = await supabaseResident.from('notifications').select('*');
   if (residentError) {
      log.fail(`RLS Residente: Error al consultar notificaciones: ${residentError.message}`);
  } else {
    if (residentNotifications.length === 0) {
        log.pass("RLS Residente: Correctamente no ve notificaciones de 'admin' o 'guardia'.");
    } else {
        log.fail("RLS Residente: Vio notificaciones que no le correspondían.");
    }
  }
  await supabaseResident.auth.signOut();
}

async function test_06_MarkNotificationAsRead(adminClient) {
  log.step("Test 6: Probar marcar notificación como leída");
  
  const notificationToMark = cleanupIds.notificationIds[0];
  if (!notificationToMark) {
    log.fail("No hay notificaciones para marcar como leídas.");
    return;
  }

  // Simular un usuario (guardia) marcando como leída
  const supabaseGuardia = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  await supabaseGuardia.auth.signInWithPassword({
    email: TEST_USERS.guardia.email,
    password: TEST_USERS.guardia.password,
  });
  
  const { error: updateError } = await supabaseGuardia
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationToMark);

  if (updateError) {
    log.fail("Error al intentar marcar la notificación como leída.");
    log.error(updateError);
    return;
  }

  const { data: updatedNotification, error: fetchError } = await adminClient
    .from('notifications')
    .select('read_at')
    .eq('id', notificationToMark)
    .single();

  if (fetchError) {
    log.fail("Error al verificar el estado de la notificación actualizada.");
    log.error(fetchError);
  } else if (updatedNotification.read_at) {
    log.pass("La notificación se marcó como leída correctamente.");
  } else {
    log.fail("La notificación no se marcó como leída en la base de datos.");
  }
  await supabaseGuardia.auth.signOut();
}


// --- CLEANUP ---
async function cleanup(client) {
  log.info("Iniciando limpieza...");
  if (cleanupIds.notificationIds.length > 0) {
    const { error: logError } = await client.from('notification_logs').delete().in('notification_id', cleanupIds.notificationIds);
    if(logError) log.fail(`Error limpiando logs: ${logError.message}`);
    else log.pass("Logs de notificación eliminados.");

    const { error: notifError } = await client.from('notifications').delete().in('id', cleanupIds.notificationIds);
    if(notifError) log.fail(`Error limpiando notificaciones: ${notifError.message}`);
    else log.pass("Notificaciones eliminadas.");
  }
  if (cleanupIds.reservationId) {
    const { error } = await client.from('reservations').delete().eq('id', cleanupIds.reservationId);
    if (error) log.fail(`Error limpiando reserva: ${error.message}`);
    else log.pass("Reserva de prueba eliminada.");
  }
  log.info("Limpieza completada.");
}

// Iniciar las pruebas
runTests();