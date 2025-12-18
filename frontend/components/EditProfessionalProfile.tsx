import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { supabase } from '../src/lib/supabase';

const PROFESSIONS = [
  'Carpintero',
  'Electricista',
  'Plomero',
  'Pintor',
  'Técnico HVAC',
  'Jardinero',
  'Limpieza del Hogar',
  'Mantenimiento General',
  'Mudanzas',
  'Cerrajero',
  'Albañil',
  'Gasista',
  'Techista',
  'Decorador',
  'Control de Plagas',
  'Otro',
];

interface EditProfessionalProfileProps {
  professionalProfile: any;
  onSave: () => void;
  onCancel?: () => void;
}

export default function EditProfessionalProfile({ 
  professionalProfile, 
  onSave, 
  onCancel 
}: EditProfessionalProfileProps) {
  const [displayName, setDisplayName] = useState(professionalProfile?.display_name || '');
  const [profession, setProfession] = useState(professionalProfile?.profession || '');
  const [customProfession, setCustomProfession] = useState('');
  const [bio, setBio] = useState(professionalProfile?.bio || '');
  const [zipCode, setZipCode] = useState(professionalProfile?.zip_code || '');
  const [city, setCity] = useState(professionalProfile?.city || '');
  const [state, setState] = useState(professionalProfile?.state || '');
  const [hourlyRate, setHourlyRate] = useState(
    professionalProfile?.hourly_rate ? String(professionalProfile.hourly_rate) : ''
  );
  const [yearsExperience, setYearsExperience] = useState(
    professionalProfile?.years_experience ? String(professionalProfile.years_experience) : ''
  );
  const [phone, setPhone] = useState(professionalProfile?.phone || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if profession is in the list, otherwise it's a custom one
    if (professionalProfile?.profession && !PROFESSIONS.includes(professionalProfile.profession)) {
      setProfession('Otro');
      setCustomProfession(professionalProfile.profession);
    }
  }, [professionalProfile]);

  async function handleSave() {
    const finalProfession = profession === 'Otro' ? customProfession : profession;

    if (!displayName || !finalProfession || !zipCode || !city || !state) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    if (profession === 'Otro' && !customProfession.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu profesión');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('professionals')
        .update({
          display_name: displayName,
          profession: finalProfession,
          bio,
          zip_code: zipCode,
          city,
          state,
          hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
          years_experience: yearsExperience ? parseInt(yearsExperience) : null,
          phone,
        })
        .eq('id', professionalProfile.id);

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Éxito', '¡Perfil actualizado exitosamente!', [
          { text: 'OK', onPress: onSave }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Ocurrió un error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentWrapper}>
      <View style={styles.content}>
        <Text style={styles.title}>Editar Perfil Profesional</Text>

        <Text style={styles.label}>Nombre para Mostrar *</Text>
        <TextInput
          style={styles.input}
          placeholder="Como te verán los clientes"
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
            <Text style={styles.label}>Especifica tu profesión *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu profesión"
              placeholderTextColor="#999"
              value={customProfession}
              onChangeText={setCustomProfession}
            />
          </>
        )}

        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={styles.input}
          placeholder="Tu número de contacto"
          placeholderTextColor="#999"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Biografía</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe tu experiencia y servicios..."
          placeholderTextColor="#999"
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Ubicación *</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.inputSmall]}
            placeholder="Código Postal"
            placeholderTextColor="#999"
            value={zipCode}
            onChangeText={setZipCode}
            keyboardType="number-pad"
          />
          <TextInput
            style={[styles.input, styles.inputMedium]}
            placeholder="Ciudad"
            placeholderTextColor="#999"
            value={city}
            onChangeText={setCity}
          />
          <TextInput
            style={[styles.input, styles.inputSmall]}
            placeholder="Provincia"
            placeholderTextColor="#999"
            value={state}
            onChangeText={setState}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tarifa por Hora ($)</Text>
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
            <Text style={styles.label}>Años de Experiencia</Text>
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

        <View style={styles.buttonRow}>
          {onCancel && (
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentWrapper: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  content: {
    width: '100%',
    maxWidth: 900,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    marginBottom: 40,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#1e3a5f',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
  },
});
