import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/contexts/AuthContext';

const PROFESSIONS = [
  'Carpintero',
  'Electricista',
  'Plomero',
  'Pintor',
  'Técnico HVAC',
  'Jardinero',
  'Limpieza del hogar',
  'Manitas',
  'Mudanzas',
  'Cerrajero',
  'Albanil',
  'Gasista',
  'Techista',
  'Decorador',
  'Fumigador',
  'Otro',
];

export default function CompleteProfileScreen() {
  const { user, userProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [profession, setProfession] = useState('');
  const [customProfession, setCustomProfession] = useState('');
  const [bio, setBio] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [phone, setPhone] = useState('');
  
  // Campos de fecha de nacimiento separados
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  
  const [identificationNumber, setIdentificationNumber] = useState('');
  const [identificationType, setIdentificationType] = useState<'DNI' | 'CUIL' | 'PASSPORT' | null>(null);
  
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    // Determinar la profesión final
    const finalProfession = profession === 'Otro' ? customProfession : profession;

    if (!displayName || !finalProfession || !zipCode || !city || !state) {
      Alert.alert('Error', 'Por favor complete todos los campos obligatorios');
      return;
    }

    if (profession === 'Otro' && !customProfession.trim()) {
      Alert.alert('Error', 'Por favor ingrese su profesión');
      return;
    }

    if (!identificationType || !identificationNumber) {
      Alert.alert('Error', 'Por favor ingrese su tipo y número de identificación');
      return;
    }

    // Validar campos de fecha
    if (!birthDay || !birthMonth || !birthYear) {
      Alert.alert('Error', 'Por favor ingrese su fecha de nacimiento completa');
      return;
    }

    const day = parseInt(birthDay);
    const month = parseInt(birthMonth);
    const year = parseInt(birthYear);

    // Validar valores numéricos
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      Alert.alert('Error', 'La fecha de nacimiento debe contener solo números');
      return;
    }

    // Validar rangos
    if (day < 1 || day > 31) {
      Alert.alert('Error', 'El día debe estar entre 1 y 31');
      return;
    }
    if (month < 1 || month > 12) {
      Alert.alert('Error', 'El mes debe estar entre 1 y 12');
      return;
    }
    if (year < 1940 || year > new Date().getFullYear()) {
      Alert.alert('Error', 'El año debe estar entre 1940 y el año actual');
      return;
    }

    // Crear fecha de nacimiento
    const dateOfBirth = new Date(year, month - 1, day);

    // Validar que la fecha sea válida
    if (dateOfBirth.getDate() !== day || dateOfBirth.getMonth() !== month - 1) {
      Alert.alert('Error', 'La fecha ingresada no es válida');
      return;
    }

    // Validar edad mínima (18 años)
    const today = new Date();
    const age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    const dayDiff = today.getDate() - dateOfBirth.getDate();
    
    if (age < 18 || (age === 18 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)))) {
      Alert.alert('Error', 'Debes tener al menos 18 años para registrarte como trabajador');
      return;
    }

    setLoading(true);
    
    try {
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
        phone,
        date_of_birth: dateOfBirth.toISOString().split('T')[0],
        identification_type: identificationType,
        identification_number: identificationNumber,
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Éxito', '¡Perfil completado!', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Ocurrió un error al guardar el perfil');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Completá tu Perfil</Text>
        <Text style={styles.subtitle}>Contale a los clientes sobre vos</Text>

        <Text style={styles.label}>Nombre para mostrar *</Text>
        <TextInput
          style={styles.input}
          placeholder="Cómo te verán los clientes"
          placeholderTextColor="#999"
          value={displayName}
          onChangeText={setDisplayName}
        />

        <Text style={styles.label}>Fecha de Nacimiento *</Text>
        <Text style={styles.helperText}>Formato: DD / MM / AAAA</Text>
        <View style={styles.dateRow}>
          <TextInput
            style={[styles.input, styles.dateInput]}
            placeholder="Día"
            placeholderTextColor="#999"
            value={birthDay}
            onChangeText={setBirthDay}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Text style={styles.dateSeparator}>/</Text>
          <TextInput
            style={[styles.input, styles.dateInput]}
            placeholder="Mes"
            placeholderTextColor="#999"
            value={birthMonth}
            onChangeText={setBirthMonth}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Text style={styles.dateSeparator}>/</Text>
          <TextInput
            style={[styles.input, styles.dateInputYear]}
            placeholder="Año"
            placeholderTextColor="#999"
            value={birthYear}
            onChangeText={setBirthYear}
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>

        <Text style={styles.label}>Tipo de Identificación *</Text>
        <View style={styles.idTypeContainer}>
          {(['DNI', 'CUIL', 'PASSPORT'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.idTypeChip,
                identificationType === type && styles.idTypeChipActive,
              ]}
              onPress={() => setIdentificationType(type)}
            >
              <Text style={[
                styles.idTypeText,
                identificationType === type && styles.idTypeTextActive,
              ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Número de Identificación *</Text>
        <TextInput
          style={styles.input}
          placeholder={identificationType === 'DNI' ? '12345678' : identificationType === 'CUIL' ? '20-12345678-9' : 'ABC123456'}
          placeholderTextColor="#999"
          value={identificationNumber}
          onChangeText={setIdentificationNumber}
          keyboardType={identificationType === 'PASSPORT' ? 'default' : 'numeric'}
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
          placeholder="Describí tu experiencia y servicios..."
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
