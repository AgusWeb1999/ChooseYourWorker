import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Picker } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/contexts/AuthContext';

const PROFESSIONS = [
  'Carpintero',
  'Electricista',
  'Plomero',
  'Pintor',
  'Técnico de HVAC',
  'Jardinero',
  'Limpieza del Hogar',
  'Mantenimiento General',
  'Servicios de Mudanza',
  'Cerrajero',
  'Albañil',
  'Gasista',
  'Techista',
  'Decorador',
  'Control de Plagas',
  'Otro',
];

export default function CompleteProfileScreen() {
  const { user, userProfile, professionalProfile, needsProfileCompletion, refreshProfiles } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [profession, setProfession] = useState('');
  const [customProfession, setCustomProfession] = useState('');
  const [bio, setBio] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  
  const [loading, setLoading] = useState(false);

  // Verificar si el usuario ya tiene perfil completo
  useEffect(() => {
    if (!needsProfileCompletion && professionalProfile) {
      console.log('⚡ Profile already complete in complete-profile screen, redirecting immediately...');
      router.replace('/(tabs)');
    }
  }, [needsProfileCompletion, professionalProfile]);

  // Si ya tiene perfil completo, mostrar loading mientras redirige
  if (!needsProfileCompletion && professionalProfile) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1e3a5f" />
        <Text style={styles.loadingText}>Redirecting...</Text>
      </View>
    );
  }

  async function handleSubmit() {
    // Determine final profession
    const finalProfession = profession === 'Otro' ? customProfession : profession;

    if (!displayName || !finalProfession || !zipCode || !city || !state) {
      Alert.alert('Error', 'Please complete all required fields');
      return;
    }

    if (profession === 'Otro' && !customProfession.trim()) {
      Alert.alert('Error', 'Please enter your profession');
      return;
    }

    setLoading(true);
    
    try {
      console.log('📝 Verificando si ya existe un perfil profesional...');
      console.log('📝 User ID:', userProfile?.id);
      
      // Verificar si ya existe un perfil profesional
      const { data: existingProfile, error: checkError } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', userProfile?.id)
        .maybeSingle();
      
      if (checkError) {
        console.error('❌ Error al verificar perfil existente:', checkError);
        Alert.alert('Error', checkError.message);
        setLoading(false);
        return;
      }
      
      if (existingProfile) {
        console.log('⚠️ Ya existe un perfil profesional, navegando al home...');
        router.replace('/(tabs)');
        setLoading(false);
        return;
      }
      
      console.log('📝 Creando perfil de profesional...');
      console.log('📝 Display Name:', displayName);
      console.log('📝 Profession:', finalProfession);
      
      const { error } = await supabase.from('professionals').insert({
        user_id: userProfile?.id,
        display_name: displayName,
        profession: finalProfession,
        bio,
        zip_code: zipCode,
        city,
        state,
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
        years_experience: yearsExperience ? parseInt(yearsExperience) : null,
      });

      if (error) {
        console.error('❌ Error al crear perfil:', error);
        Alert.alert('Error', error.message);
        setLoading(false);
        return;
      }
      
      console.log('✅ Professional profile created successfully');
      
      // Actualizar el campo is_professional en public.users
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_professional: true })
        .eq('id', userProfile?.id);
      
      if (updateError) {
        console.error('⚠️ Error al actualizar is_professional:', updateError);
      }
      
      // Esperar un momento para que la BD se actualice
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh profiles to update context
      console.log('🔄 Refreshing profiles...');
      await refreshProfiles();
      console.log('✅ Profiles refreshed');
      
      // Navegar directamente sin mostrar alert (para evitar bucle)
      console.log('🏠 Navigating to home...');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('❌ Error inesperado:', error);
      Alert.alert('Error', error.message || 'An error occurred while saving the profile');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>Tell clients about yourself</Text>

        <Text style={styles.label}>Display Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="How clients will see you"
          placeholderTextColor="#999"
          value={displayName}
          onChangeText={setDisplayName}
        />

        <Text style={styles.label}>Profesión *</Text>
        <View style={styles.professionContainer}>
          {PROFESSIONS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.professionChip,
                profession === p && styles.professionChipActive,
              ]}
              onPress={() => setProfession(p)}
            >
              <Text style={[
                styles.professionText,
                profession === p && styles.professionTextActive,
              ]}>
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
              placeholderTextColor="#999"
              value={customProfession}
              onChangeText={setCustomProfession}
            />
          </>
        )}

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your experience and services..."
          placeholderTextColor="#999"
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Location *</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.inputSmall]}
            placeholder="Zip Code"
            placeholderTextColor="#999"
            value={zipCode}
            onChangeText={setZipCode}
            keyboardType="number-pad"
          />
          <TextInput
            style={[styles.input, styles.inputMedium]}
            placeholder="City"
            placeholderTextColor="#999"
            value={city}
            onChangeText={setCity}
          />
          <TextInput
            style={[styles.input, styles.inputSmall]}
            placeholder="State"
            placeholderTextColor="#999"
            value={state}
            onChangeText={setState}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hourly Rate ($)</Text>
            <TextInput
              style={styles.input}
              placeholder="1500"
              placeholderTextColor="#999"
              value={hourlyRate}
              onChangeText={setHourlyRate}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Years of Experience</Text>
            <TextInput
              style={styles.input}
              placeholder="5"
              placeholderTextColor="#999"
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
            {loading ? 'Saving...' : 'Complete Profile'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  countryPicker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInput: {
    flex: 1,
    textAlign: 'center',
  },
  dateInputYear: {
    flex: 1.5,
    textAlign: 'center',
  },
  dateSeparator: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputSmall: {
    flex: 1,
  },
  inputMedium: {
    flex: 2,
  },
  inputGroup: {
    flex: 1,
  },
  idTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  idTypeChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  idTypeChipActive: {
    borderColor: '#1e3a5f',
    backgroundColor: '#1e3a5f',
  },
  idTypeText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  idTypeTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  professionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  professionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  professionChipActive: {
    borderColor: '#1e3a5f',
    backgroundColor: '#1e3a5f',
  },
  professionText: {
    color: '#666',
    fontSize: 14,
  },
  professionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#1e3a5f',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
