import { SUPABASE_CONFIG } from './config.js';

export const supabase = window.supabase.createClient(
    SUPABASE_CONFIG.url, 
    SUPABASE_CONFIG.key
);
