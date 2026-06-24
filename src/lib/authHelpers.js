import { supabase } from '@/lib/customSupabaseClient';

export async function handleAuthError(error) {
  if (error && error.message && error.message.includes('Invalid Refresh Token')) {
    console.error('Session is invalid, forcing re-authentication...');
    
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.warn('Sign out failed, manually clearing storage.');
      localStorage.clear();
    }
    
    window.location.href = '/'; 
  }
}