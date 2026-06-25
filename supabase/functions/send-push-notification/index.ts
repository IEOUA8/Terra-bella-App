import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@terrabella.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
};

// ─── VAPID JWT (ES256) ─────────────────────────────────────────────────────────

function base64UrlEncode(data: ArrayBuffer | string): string {
  let str: string;
  if (typeof data === 'string') {
    str = data;
  } else {
    str = String.fromCharCode(...new Uint8Array(data));
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlDecode(str: string): Uint8Array {
  const padding = '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function importVapidPrivateKey(rawKey: string): Promise<CryptoKey> {
  const keyBytes = base64UrlDecode(rawKey);
  return crypto.subtle.importKey(
    'pkcs8',
    keyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
}

async function buildVapidJwt(audience: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const payload = base64UrlEncode(
    JSON.stringify({ aud: audience, exp: now + 3600, sub: VAPID_SUBJECT })
  );
  const signingInput = `${header}.${payload}`;
  const key = await importVapidPrivateKey(VAPID_PRIVATE_KEY);
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(signingInput)
  );
  return `${signingInput}.${base64UrlEncode(signature)}`;
}

// ─── Enviar una notificación push ─────────────────────────────────────────────

async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string
): Promise<{ ok: boolean; status: number; text: string }> {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const jwt = await buildVapidJwt(audience);

  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      TTL: '86400',
      Authorization: `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`,
    },
    body: new TextEncoder().encode(payload),
  });

  return { ok: response.ok, status: response.status, text: await response.text() };
}

// ─── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let reservaData: Record<string, unknown>;

  try {
    const body = await req.json();
    reservaData = body.record ?? body.reservaData;
    if (!reservaData) throw new Error("Falta 'record' o 'reservaData' en el body.");

    const required = ['status', 'area_name', 'user_name'];
    const missing = required.filter((f) => !reservaData[f]);
    if (missing.length) throw new Error(`Campos requeridos faltantes: ${missing.join(', ')}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: `Bad Request: ${message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Obtener suscripciones activas de guardias
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription')
      .eq('role', 'guardia')
      .eq('is_active', true);

    if (subError) throw new Error(`Error obteniendo suscripciones: ${subError.message}`);
    if (!subscriptions?.length) {
      return new Response(
        JSON.stringify({ message: 'No hay guardias suscritos.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const areaName = String(reservaData.area_name ?? 'Área Común');
    const userName = String(reservaData.user_name ?? 'Residente');
    const tower = String(reservaData.tower ?? '');
    const apartment = String(reservaData.apartment ?? '');
    const status = String(reservaData.status);

    let title: string;
    let body: string;
    if (status === 'confirmed') {
      title = `✅ Nueva Reserva: ${areaName}`;
      body = `${userName} (T${tower} Apto ${apartment}) ha reservado.`;
    } else if (status === 'cancelled') {
      title = `❌ Reserva Cancelada: ${areaName}`;
      body = `La reserva de ${userName} ha sido cancelada.`;
    } else {
      title = `🔔 Actualización: ${areaName}`;
      body = `Estado de reserva de ${userName} → ${status}`;
    }

    const payload = JSON.stringify({
      title,
      body,
      data: {
        url: '/guardia',
        reservationId: String(reservaData.id ?? ''),
        areaName,
        status,
      },
    });

    // Insertar registro en notification_logs y enviar notificaciones en la DB
    await supabaseAdmin.from('notifications').insert({
      type: status === 'confirmed' ? 'reservation_created' : 'reservation_cancelled',
      title,
      body,
      recipient_role: 'guardia',
      metadata: { reservation_id: reservaData.id, area_name: areaName },
    });

    const results = await Promise.allSettled(
      subscriptions.map((row) => sendWebPush(row.subscription, payload))
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled' && r.value.ok).length;
    const failed = results.length - succeeded;

    // Log en notification_logs
    await supabaseAdmin.from('notification_logs').insert({
      source: 'push',
      status: failed === results.length ? 'error' : 'success',
      error_message: failed > 0 ? `${failed} de ${results.length} envíos fallaron` : null,
      metadata: { succeeded, failed, total: results.length },
    });

    return new Response(
      JSON.stringify({ success: true, message: `${succeeded}/${results.length} notificaciones enviadas.` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error interno:', message);
    await createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
      .from('notification_logs')
      .insert({ source: 'push', status: 'error', error_message: message });

    return new Response(JSON.stringify({ error: `Internal Server Error: ${message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
