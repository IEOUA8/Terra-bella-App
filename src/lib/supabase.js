// Re-exporting the authenticated client from customSupabaseClient.js
// This ensures we use the correct project credentials and configuration
// provided by the system environment.

export { supabase } from './customSupabaseClient';