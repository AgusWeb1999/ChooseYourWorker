// ...otros imports y código...
import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/contexts/AuthContext';
import { useWindowDimensions } from '../../hooks/useWindowDimensions';

const PROFESSIONS = [
  'Carpintero', 'Electricista', 'Plomero', 'Pintor', 'Técnico de HVAC',
  'Jardinero', 'Limpieza del Hogar', 'Mantenimiento General', 'Servicios de Mudanza',
  'Cerrajero', 'Albañil', 'Gasista', 'Techista', 'Decorador', 'Control de Plagas', 'Otro',
];

export default function CompleteProfileScreen() {
  const { user, userProfile, professionalProfile, needsProfileCompletion, refreshProfiles } = useAuth();
  const { width } = useWindowDimensions();

  // Si el usuario no es profesional, redirigir a home SOLO si userProfile está cargado
  useEffect(() => {
    if (userProfile && userProfile.is_professional === false) {
      router.replace('/(tabs)');
    }
  }, [userProfile]);

  const [displayName, setDisplayName] = useState('');
  const [profession, setProfession] = useState('');
  const [customProfession, setCustomProfession] = useState('');
  const [bio, setBio] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [loading, setLoading] = useState(false);

  // Verificar si el usuario ya tiene perfil completo
  useEffect(() => {
    if (userProfile && userProfile.is_professional && !needsProfileCompletion && professionalProfile) {
      router.replace('/(tabs)');
    }
  }, [needsProfileCompletion, professionalProfile, userProfile]);

  // Si ya tiene perfil completo, mostrar loading mientras redirige
  if (userProfile && userProfile.is_professional && !needsProfileCompletion && professionalProfile) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1e3a5f" />
        <Text style={styles.loadingText}>Redirigiendo...</Text>
      </View>
    );
  }
  // Si es cliente, nunca mostrar este formulario
  if (userProfile && userProfile.is_professional === false) {
    return null;
  }

  // ...ubicación eliminada...

  async function handleSubmit() {
    const finalProfession = profession === 'Otro' ? customProfession : profession;

    // VALIDACIÓN CORREGIDA
    if (!displayName || !finalProfession) {
      Alert.alert('Error', 'Por favor completa los campos obligatorios (Nombre y Profesión)');
      return;
    }

    if (profession === 'Otro' && !customProfession.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu profesión específica');
      return;
    }

    setLoading(true);
    
    try {
      // 1. Verificar si ya existe
      const { data: existingProfile, error: checkError } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', userProfile?.id)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      if (existingProfile) {
        router.replace('/(tabs)');
        return;
      }
      
      // 2. Insertar perfil profesional (sin ubicación)
      const { error: insertError } = await supabase.from('professionals').insert({
        user_id: userProfile?.id,
        display_name: displayName,
        profession: finalProfession.charAt(0).toUpperCase() + finalProfession.slice(1).toLowerCase(),
        bio,
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
        years_experience: yearsExperience ? parseInt(yearsExperience) : null
      });

      if (insertError) throw insertError;
      
      // 3. Actualizar estado en tabla users
      await supabase
        .from('users')
        .update({ is_professional: true })
        .eq('id', userProfile?.id);
      
      // 4. Refrescar y navegar
      await refreshProfiles();
      router.replace('/(tabs)');
    } catch (err: any) { // <--- Cambiamos "error" por "err: any" para evitar el error de tipado
      console.error('❌ Error en el proceso:', err);
      
      // Manejamos el mensaje de error de forma segura
      const errorMessage = err?.message || 'Ocurrió un error inesperado al guardar el perfil';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Completa tu Perfil</Text>
            <Text style={styles.subtitle}>Cuéntanos sobre tus servicios</Text>

            <Text style={styles.label}>Nombre para Mostrar *</Text>
            <TextInput
              style={styles.input}
              placeholder="Cómo te verán los clientes"
              value={displayName}
              onChangeText={setDisplayName}
            />

            <Text style={styles.label}>Profesión *</Text>
            <View style={styles.professionContainer}>
              {PROFESSIONS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.professionChip, profession === p && styles.professionChipActive]}
                  onPress={() => setProfession(p)}
                >
                  <Text style={[styles.professionText, profession === p && styles.professionTextActive]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {profession === 'Otro' && (
              <>
                <Text style={styles.label}>Especifique su profesión *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese su profesión"
                  value={customProfession}
                  onChangeText={setCustomProfession}
                />
              </>
            )}




            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe tu experiencia..."
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
            />

            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tarifa por Hora ($)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1500"
                  value={hourlyRate}
                  onChangeText={setHourlyRate}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Años de Experiencia</Text>
                <TextInput
                  style={styles.input}
                  placeholder="5"
                  value={yearsExperience}
                  onChangeText={setYearsExperience}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Guardando...' : 'Completar Perfil'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    pickerArrow: { color: '#9ca3af', fontSize: 12, marginLeft: 8 },
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
  content: {
    padding: 20,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  inputGroup: { flex: 1 },
  professionContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  professionChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f9f9f9' },
  professionChipActive: { borderColor: '#1e3a5f', backgroundColor: '#1e3a5f' },
  professionText: { color: '#666', fontSize: 14 },
  professionTextActive: { color: '#fff', fontWeight: '600' },
  button: { backgroundColor: '#1e3a5f', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 32 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});