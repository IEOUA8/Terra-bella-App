import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Verify caller role using their JWT
  const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user: callerUser }, error: authError } = await callerClient.auth.getUser();
  if (authError || !callerUser) {
    return new Response(JSON.stringify({ error: 'Token inválido' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: callerProfile } = await callerClient
    .from('user_profiles')
    .select('role')
    .eq('id', callerUser.id)
    .single();

  if (!callerProfile || !['admin', 'super_admin'].includes(callerProfile.role)) {
    return new Response(JSON.stringify({ error: 'Solo administradores pueden crear residentes' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { name, email, tower, apartment, phone } = await req.json();

  if (!name || !email || !tower || !apartment) {
    return new Response(JSON.stringify({ error: 'Nombre, correo, torre y apartamento son obligatorios' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Use service role to create the user and send invite
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: name,
      tower,
      apartment,
      phone: phone || '',
      role: 'resident',
    },
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({ success: true, userId: data.user?.id }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
