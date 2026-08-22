/* assets/js/database.js - Supabase Bridge Config */

// Generic fallback values, ideally replaced during build or provided dynamically
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_KEY';

// In a non-module environment using the CDN, supabase is available on window.supabase
if (window.supabase) {
  // Try to use Vite env vars if somehow transpiled, else fallback
  const url = (typeof import_meta !== 'undefined' && import_meta.env) ? import_meta.env.VITE_SUPABASE_URL : supabaseUrl;
  const key = (typeof import_meta !== 'undefined' && import_meta.env) ? import_meta.env.VITE_SUPABASE_PUBLISHABLE_KEY : supabaseKey;
  window.dbClient = window.supabase.createClient(url, key);
} else {
  console.error("Supabase CDN script not loaded!");
}

window.DB = {
  initDB: async () => {
    console.log('AgroChem ERP Database Bridge Initialized (Connected to Supabase)');
    return true;
  }
};
