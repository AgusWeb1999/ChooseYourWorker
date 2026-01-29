/**
 * Configuración de Supabase para el flujo de cliente
 * ACTUALIZA ESTAS CREDENCIALES CON TUS VALORES REALES
 * 
 * Para obtener estas credenciales:
 * 1. Ve a https://app.supabase.com
 * 2. Selecciona tu proyecto
 * 3. Ve a Settings → API
 * 4. Copia Project URL (SUPABASE_URL)
 * 5. Copia anon public key (SUPABASE_ANON_KEY)
 */

window.SUPABASE_CONFIG = {
  // URL del proyecto Supabase
  url: 'https://oeabhlewxekejmgrucrz.supabase.co',
  
  // Clave pública anon (NO service_role)
  anonKey: 'sb_publishable_tyR1xlVRs68DuqQQf_r-cw_TcW3IuZ5'
};

console.log('✅ Configuración cargada:', {
  url: window.SUPABASE_CONFIG.url,
  keyLength: window.SUPABASE_CONFIG.anonKey?.length
});
