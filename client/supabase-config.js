// Configuración de Supabase para el flujo de clientes
// https://supabase.io
// 
// IMPORTANTE: Necesitas actualizar SUPABASE_ANON_KEY con tu clave real de Supabase
// Obtén la clave en: https://app.supabase.com -> Configuración -> API -> Anon public key

const SUPABASE_URL = 'https://oeabhlewxekejmgrucrz.supabase.co';
// PLACEHOLDER - Reemplaza con tu clave real de Supabase
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lYWJobGV3eGVrZWptZ3J1Y3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTIzNTk4NjcsImV4cCI6MjAyNzkzNTg2N30.vY7O6KBvR0SfnbjIqVDtw0hI0MfHLfUpBJO4DQmVd0Q';

// Crear cliente de Supabase
const supabaseClient = (() => {
  // Verificar si la librería de Supabase está disponible
  if (typeof window.supabase === 'undefined') {
    console.error('Supabase JS no está cargado. Asegúrate de incluir el script antes de este.');
    return null;
  }
  
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})();

/**
 * Obtener todos los profesionales disponibles
 * @returns {Promise<Array>} Array de profesionales
 */
async function fetchProfessionals() {
  try {
    if (!supabaseClient) throw new Error('Supabase no está inicializado');
    
    const { data, error } = await supabaseClient
      .from('professionals')
      .select(`
        id,
        user_id,
        display_name,
        category,
        description,
        hourly_rate,
        bio,
        avatar_url,
        phone,
        city,
        rating,
        reviews_count
      `)
      .eq('is_active', true)
      .order('rating', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching professionals:', error);
    return [];
  }
}

/**
 * Obtener un profesional por ID
 * @param {string} professionalId - ID del profesional
 * @returns {Promise<Object>} Datos del profesional
 */
async function fetchProfessionalById(professionalId) {
  try {
    if (!supabaseClient) throw new Error('Supabase no está inicializado');
    
    const { data, error } = await supabaseClient
      .from('professionals')
      .select(`
        id,
        user_id,
        display_name,
        category,
        description,
        hourly_rate,
        bio,
        avatar_url,
        phone,
        city,
        rating,
        reviews_count
      `)
      .eq('id', professionalId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching professional:', error);
    return null;
  }
}

/**
 * Buscar profesionales por categoría/rubro
 * @param {string} profession - Categoría/profesión del servicio (Sanitario, Electricista, etc.)
 * @returns {Promise<Array>} Array de profesionales en esa categoría
 */
async function fetchProfessionalsByCategory(profession) {
  try {
    if (!supabaseClient) throw new Error('Supabase no está inicializado');
    
    // Normalizar profesión (capitalizar primero)
    const normalizedProfession = profession
      .trim()
      .charAt(0)
      .toUpperCase() + profession.trim().slice(1).toLowerCase();
    
    console.log(`🔍 Buscando profesionales con profession="${normalizedProfession}"`);
    
    // Traer TODOS los profesionales activos primero
    const { data, error } = await supabaseClient
      .from('professionals')
      .select(`
        id,
        user_id,
        display_name,
        profession,
        city,
        state,
        hourly_rate,
        rating,
        rating_count,
        bio,
        avatar_url,
        is_active
      `)
      .eq('is_active', true)
      .order('rating', { ascending: false });
    
    if (error) throw error;
    
    // Filtrar en JavaScript por si el campo profession tiene variaciones
    const filtered = (data || []).filter(prof => {
      if (!prof.profession) return false;
      const profNormalized = prof.profession
        .trim()
        .charAt(0)
        .toUpperCase() + prof.profession.trim().slice(1).toLowerCase();
      return profNormalized === normalizedProfession;
    });
    
    console.log(`✅ Encontrados ${filtered.length} profesionales con profession="${normalizedProfession}"`);
    if (filtered.length > 0) {
      console.log(`👤 Primero: ${filtered[0].display_name} (Rating: ${filtered[0].rating})`);
    }
    return filtered;
  } catch (error) {
    console.error('Error fetching professionals by category:', error);
    return [];
  }
}

/**
 * Buscar profesionales por ciudad
 * @param {string} city - Ciudad del servicio
 * @returns {Promise<Array>} Array de profesionales en esa ciudad
 */
async function fetchProfessionalsByCity(city) {
  try {
    if (!supabaseClient) throw new Error('Supabase no está inicializado');
    
    const { data, error } = await supabaseClient
      .from('professionals')
      .select(`
        id,
        user_id,
        display_name,
        category,
        description,
        hourly_rate,
        bio,
        avatar_url,
        phone,
        city,
        rating,
        reviews_count
      `)
      .eq('city', city)
      .eq('is_active', true)
      .order('rating', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching professionals by city:', error);
    return [];
  }
}

/**
 * Crear un nuevo issue/solicitud del cliente
 * @param {Object} issueData - Datos del issue
 * @returns {Promise<Object>} Issue creado
 */
async function createClientIssue(issueData) {
  try {
    if (!supabaseClient) throw new Error('Supabase no está inicializado');
    
    const { data, error } = await supabaseClient
      .from('issues')
      .insert([{
        description: issueData.description,
        category: issueData.category,
        urgency: issueData.urgency,
        status: 'draft',
        attachments: issueData.attachments || [],
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating issue:', error);
    return null;
  }
}

/**
 * Actualizar estado de issue
 * @param {string} issueId - ID del issue
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<Object>} Issue actualizado
 */
async function updateIssueStatus(issueId, updates) {
  try {
    if (!supabaseClient) throw new Error('Supabase no está inicializado');
    
    const { data, error } = await supabaseClient
      .from('issues')
      .update(updates)
      .eq('id', issueId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating issue:', error);
    return null;
  }
}

/**
 * Crear usuario mínimo (solo nombre y teléfono/email)
 * @param {Object} userData - nombre, email o phone
 * @returns {Promise<Object>} Usuario creado
 */
async function createMinimalUser(userData) {
  try {
    if (!supabaseClient) throw new Error('Supabase no está inicializado');
    
    // En producción, esto se hace en el backend con auth.signUp
    // Aquí es solo un placeholder
    const { data, error } = await supabaseClient.auth.signUp({
      email: userData.email || `${userData.name}@workinggo-temp.local`,
      password: Math.random().toString(36).slice(-12), // Password temporal
    });
    
    if (error) throw error;
    
    // Crear perfil de usuario en tabla 'users'
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .insert([{
        id: data.user.id,
        full_name: userData.name,
        email: userData.email,
        phone: userData.phone,
        user_type: 'client'
      }])
      .select()
      .single();
    
    if (profileError) throw profileError;
    return userProfile;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

// Exportar funciones para uso global
window.WorkingGoSupabase = {
  client: supabaseClient,
  fetchProfessionals,
  fetchProfessionalById,
  fetchProfessionalsByCategory,
  fetchProfessionalsByCity,
  createClientIssue,
  updateIssueStatus,
  createMinimalUser
};
