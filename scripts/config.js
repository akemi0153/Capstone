// Configuration Module
// Import credentials from secure location
import { SUPABASE_CONFIG } from '../config/credentials.js';

// Department Names Mapping
export const departmentNames = {
    'it': 'Information Technology',
    'education': 'Education',
    'engineering': 'Engineering',
    'arts': 'Arts and Sciences',
    'forestry': 'Forestry',
    'industrial': 'Industrial Technology',
    'accounting': 'Accounting',
    'ascot_igp': 'ASCOT IGP'
};

// Categories
export const categories = {
    'merchandise': 'University Merchandise',
    'supplies': 'Office Supplies',
    'food': 'Food & Beverages',
    'books': 'Souvenirs'
};

// Stock Status Thresholds
export const stockThresholds = {
    LOW_STOCK: 10,
    OUT_OF_STOCK: 0
};

// Room Types
export const roomTypes = {
    '1bedroom': '1 Bedroom',
    '2bedroom': '2 Bedroom',
    '3bedroom': '3 Bedroom',
    'dormitory': 'Dormitory'
};

// Initialize Supabase Client
export const supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// Export config for backward compatibility
export const config = {
    supabaseUrl: SUPABASE_CONFIG.url,
    supabaseKey: SUPABASE_CONFIG.anonKey
};
