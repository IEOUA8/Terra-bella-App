-- Tabla para almacenar suscripciones de Web Push (sin Firebase)
-- Reemplaza tokens_fcm_guardias y el campo fcm_token de user_profiles

create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null,
  subscription jsonb not null,   -- PushSubscription JSON: { endpoint, keys: { p256dh, auth } }
  device_type text not null default 'web',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id)
);

-- Índice para filtrar rápido por rol (guardia, admin, etc.)
create index if not exists idx_push_subscriptions_role_active
  on push_subscriptions (role, is_active);

-- RLS: cada usuario solo ve y modifica su propia suscripción
alter table push_subscriptions enable row level security;

create policy "Usuarios gestionan su propia suscripción"
  on push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- La Edge Function usa service_role, así que puede leer todo.
-- No se necesita política adicional para eso.
