import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID")!;
const GCP_SA_KEY = Deno.env.get("GCP_SA_KEY");

// Define corsHeaders directly in the file
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
};

async function getGoogleAuthToken() {
  if (!GCP_SA_KEY) {
    throw new Error("GCP_SA_KEY environment variable is missing");
  }
  const sa = JSON.parse(GCP_SA_KEY);
  const jwtHeader = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=/g, '');
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };
  const jwtClaim = btoa(JSON.stringify(claim)).replace(/=/g, '');
  const signaturePayload = `${jwtHeader}.${jwtClaim}`;
  
  const key = await crypto.subtle.importKey(
    'pkcs8',
    (str => {
      const r = str.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\s/g, '');
      return Uint8Array.from(atob(r), c => c.charCodeAt(0));
    })(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signaturePayload));
  const jwt = `${signaturePayload}.${btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '')}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt })
  });
  
  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok) {
    throw new Error(`Failed to get Google Auth Token: ${tokenData.error_description || 'Unknown error'}`);
  }
  return tokenData.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let reservaData;
  
  try {
    const body = await req.json();
    
    // Support both webhook payloads ('record') and direct invokes ('reservaData')
    reservaData = body.record || body.reservaData;

    console.log('Received Request Body Payload:', JSON.stringify(body));

    if (!reservaData) {
        throw new Error("No reservation data found in request body (checked 'record' and 'reservaData').");
    }

    if (typeof reservaData !== 'object') {
        throw new Error("Reservation data must be an object.");
    }

    // Check specifically for required fields
    const requiredFields = ['status', 'area_name', 'user_name'];
    const missingFields = requiredFields.filter(field => !reservaData[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

  } catch (error: any) {
    console.error('Validation Error:', error.message);
    return new Response(JSON.stringify({ error: `Bad Request: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    // Fetch active tokens for guards
    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from('tokens_fcm_guardias')
      .select('fcm_token')
      .eq('is_active', true);

    if (tokenError) {
      throw new Error(`Supabase error fetching tokens: ${tokenError.message}`);
    }
      
    if (!tokens || tokens.length === 0) {
      console.log("No active guard tokens found. Skipping notification.");
      return new Response(JSON.stringify({ message: "No active guards found to notify." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const fcmTokens = tokens.map((t: any) => t.fcm_token);
    const authToken = await getGoogleAuthToken();
    const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;
    
    // Construct Notification Content
    let title, bodyMsg;
    const tower = reservaData.tower || 'N/A';
    const apartment = reservaData.has('apartment') ? reservaData.apartment : 'N/A';
    const areaName = reservaData.area_name || 'Área Común';
    const userName = reservaData.user_name || 'Residente';

    if (reservaData.status === 'confirmed') {
      title = `✅ Nueva Reserva: ${areaName}`;
      bodyMsg = `${userName} (T${tower} Apto ${apartment}) ha reservado.`;
    } else if (reservaData.status === 'cancelled') {
      title = `❌ Reserva Cancelada: ${areaName}`;
      bodyMsg = `La reserva de ${userName} (T${tower} Apto ${apartment}) ha sido cancelada.`;
    } else {
      title = `🔔 Actualización de Reserva: ${areaName}`;
      bodyMsg = `El estado de la reserva de ${userName} ha cambiado a ${reservaData.status}.`;
    }

    // Send Notifications
    const sendPromises = fcmTokens.map((token: string) => {
      const message = {
        message: {
          token: token,
          notification: { title: title, body: bodyMsg },
          android: {
            notification: {
              sound: 'default'
            }
          },
          webpush: {
            notification: {
              icon: 'https://njrpatnmweyrvfcbfdrp.supabase.co/storage/v1/object/public/assets/icon.png',
              silent: false
            },
            fcm_options: { link: 'https://terrabellapp.com/guardia' }
          },
          data: {
            reservationId: String(reservaData.id || ''),
            areaName: String(areaName),
            status: String(reservaData.status || ''),
          }
        }
      };
      
      return fetch(fcmEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(message)
      });
    });

    const results = await Promise.all(sendPromises);
    const successfulSends = results.filter(res => res.ok).length;
    
    // Log failures
    results.forEach((res, idx) => {
        if (!res.ok) {
            console.error(`Failed to send to token index ${idx}:`, res.status, res.statusText);
            res.text().then(t => console.error('FCM Error body:', t));
        }
    });

    return new Response(JSON.stringify({ success: true, message: `Sent ${successfulSends} of ${fcmTokens.length} notifications.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error(`Internal Server Error: ${error.message}`);
    return new Response(JSON.stringify({ error: `Internal Server Error: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});