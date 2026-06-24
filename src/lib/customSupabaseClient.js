import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://njrpatnmweyrvfcbfdrp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qcnBhdG5td2V5cnZmY2JmZHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMTg3NzAsImV4cCI6MjA2ODg5NDc3MH0.tAS94zwwVlMeAUWw_r5sK5h8gFUdi17L7vvmNbULmRY';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
