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

    const areaName = String(reservaData.area_name ?? 'Área Común');
    const userName = String(reservaData.user_name ?? 'Residente');
    const tower = String(reservaData.tower ?? '');
    const apartment = String(reservaData.apartment ?? '');
    const status = String(reservaData.status);
    const reservationUserId = reservaData.user_id ? String(reservaData.user_id) : null;

    let guardiaTitle: string;
    let guardiaBody: string;
    if (status === 'confirmed') {
      guardiaTitle = `✅ Nueva Reserva: ${areaName}`;
      guardiaBody = `${userName} (T${tower} Apto ${apartment}) ha reservado.`;
    } else if (status === 'cancelled') {
      guardiaTitle = `❌ Reserva Cancelada: ${areaName}`;
      guardiaBody = `La reserva de ${userName} ha sido cancelada.`;
    } else {
      guardiaTitle = `🔔 Actualización: ${areaName}`;
      guardiaBody = `Estado de reserva de ${userName} → ${status}`;
    }

    // ── Notificación a guardias ─────────────────────────────────────────────
    const { data: guardiaSubscriptions } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription')
      .eq('role', 'guardia')
      .eq('is_active', true);

    let guardiaSucceeded = 0;
    let guardiaFailed = 0;

    if (guardiaSubscriptions?.length) {
      const guardiaPayload = JSON.stringify({
        title: guardiaTitle,
        body: guardiaBody,
        data: { url: '/guardia', reservationId: String(reservaData.id ?? ''), areaName, status },
      });

      await supabaseAdmin.from('notifications').insert({
        type: status === 'confirmed' ? 'reservation_created' : 'reservation_cancelled',
        title: guardiaTitle,
        body: guardiaBody,
        recipient_role: 'guardia',
        metadata: { reservation_id: reservaData.id, area_name: areaName },
      });

      const guardiaResults = await Promise.allSettled(
        guardiaSubscriptions.map((row) => sendWebPush(row.subscription, guardiaPayload))
      );
      guardiaSucceeded = guardiaResults.filter((r) => r.status === 'fulfilled' && (r as PromiseFulfilledResult<{ ok: boolean }>).value.ok).length;
      guardiaFailed = guardiaResults.length - guardiaSucceeded;
    }

    // ── Notificación al residente cuando cancela el admin ──────────────────
    let residentSucceeded = 0;
    if (status === 'cancelled' && reservationUserId) {
      const residentTitle = `❌ Tu reserva fue cancelada`;
      const residentBody = `Tu reserva de ${areaName} ha sido cancelada por administración.`;
      const cancellationReason = reservaData.cancellation_reason ? String(reservaData.cancellation_reason) : null;

      // Insert notification for the resident
      await supabaseAdmin.from('notifications').insert({
        type: 'reservation_cancelled',
        title: residentTitle,
        body: cancellationReason ? `${residentBody} Motivo: ${cancellationReason}` : residentBody,
        recipient_user_id: reservationUserId,
        metadata: { reservation_id: reservaData.id, area_name: areaName, cancellation_reason: cancellationReason },
      });

      // Send push notification to resident if subscribed
      const { data: residentSubs } = await supabaseAdmin
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', reservationUserId)
        .eq('is_active', true);

      if (residentSubs?.length) {
        const residentPayload = JSON.stringify({
          title: residentTitle,
          body: cancellationReason ? `${residentBody} Motivo: ${cancellationReason}` : residentBody,
          data: { url: '/dashboard', reservationId: String(reservaData.id ?? ''), areaName, status },
        });
        const residentResults = await Promise.allSettled(
          residentSubs.map((row) => sendWebPush(row.subscription, residentPayload))
        );
        residentSucceeded = residentResults.filter((r) => r.status === 'fulfilled' && (r as PromiseFulfilledResult<{ ok: boolean }>).value.ok).length;
      }
    }

    const totalSucceeded = guardiaSucceeded + residentSucceeded;
    const totalFailed = guardiaFailed;

    // Log en notification_logs
    await supabaseAdmin.from('notification_logs').insert({
      source: 'push',
      status: totalFailed > 0 && totalSucceeded === 0 ? 'error' : 'success',
      error_message: totalFailed > 0 ? `${totalFailed} envíos a guardia fallaron` : null,
      metadata: { guardiaSucceeded, guardiaFailed, residentSucceeded },
    });

    return new Response(
      JSON.stringify({ success: true, message: `${totalSucceeded} notificaciones enviadas.` }),
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
