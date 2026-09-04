// =============================================================================
// PLN SURVEY WEB - Supabase Client Configuration
// =============================================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://kpsilvibobjvqxanugto.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwc2lsdmlib2JqdnF4YW51Z3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NTUxMjEsImV4cCI6MjA4MjAzMTEyMX0.7W2JMeVnezluKTlNvHI-_FmfatDYHawUGSXf-ooY0so';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

export const PHOTO_BUCKET = 'survey-photos';
