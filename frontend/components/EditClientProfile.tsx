import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../src/lib/supabase';
import { validatePhone, validateId, normalizePhone, normalizeId, getCountriesList, CountryCode, COUNTRIES } from '../utils/countryValidation';

interface EditClientProfileProps {
  userProfile: any;
  userEmail: string;
  onSave: () => void;
  onCancel?: () => void;
}

export default function EditClientProfile({ 
  userProfile, 
  userEmail,
  onSave, 
  onCancel 
}: EditClientProfileProps) {
  const [fullName, setFullName] = useState(userProfile?.full_name || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [country, setCountry] = useState<CountryCode>(userProfile?.country || 'UY');
  const [dateOfBirth, setDateOfBirth] = useState(userProfile?.date_of_birth || '');
  const [idNumber, setIdNumber] = useState(userProfile?.id_number || '');
  const [address, setAddress] = useState(userProfile?.address || '');
  const [city, setCity] = useState(userProfile?.city || '');
  const [state, setState] = useState(userProfile?.state || '');
  const [zipCode, setZipCode] = useState(userProfile?.zip_code || '');
  const [loading, setLoading] = useState(false);
  const [countryModalVisible, setCountryModalVisible] = useState(false);

  async function handleSave() {
    if (!fullName || !phone || !idNumber) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    // Validar teléfono según país
    const phoneValidation = validatePhone(phone, country);
    if (!phoneValidation.valid) {
      Alert.alert('Error', phoneValidation.error || 'Teléfono inválido');
      return;
    }

    // Validar DNI/Cédula según país
    const idValidation = validateId(idNumber, country);
    if (!idValidation.valid) {
      Alert.alert('Error', idValidation.error || 'DNI/Cédula inválido');
      return;
    }

    // Validación de fecha de nacimiento (formato DD/MM/YYYY)
    if (dateOfBirth) {
      const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
      if (!dateRegex.test(dateOfBirth)) {
        Alert.alert('Error', 'La fecha de nacimiento debe estar en formato DD/MM/AAAA');
        return;
      }
    }

    setLoading(true);
    
    try {
      // Validar que el teléfono no exista (excepto el del usuario actual)
      const normalizedPhone = normalizePhone(phone, country);
      const { data: phoneData } = await supabase
        .from('users')
        .select('id')
        .eq('phone', normalizedPhone)
        .neq('id', userProfile.id)
        .single();

      if (phoneData) {
        Alert.alert('Error', 'Este teléfono ya está registrado en otra cuenta');
        setLoading(false);
        return;
      }

      // Validar que el DNI/Cédula no exista (excepto el del usuario actual)
      const normalizedId = normalizeId(idNumber);
      const { data: idData } = await supabase
        .from('users')
        .select('id')
        .eq('id_number', normalizedId)
        .neq('id', userProfile.id)
        .single();

      if (idData) {
        Alert.alert('Error', 'Este DNI/Cédula ya está registrado en otra cuenta');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          phone: normalizedPhone,
          date_of_birth: dateOfBirth || null,
          id_number: normalizedId,
          address: address || null,
          city: city || null,
          state: state || null,
          zip_code: zipCode || null,
        })
        .eq('id', userProfile.id);

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
        <Text style={styles.title}>Editar Perfil</Text>
        <Text style={styles.subtitle}>Mantén tu información actualizada y segura</Text>

        <Text style={styles.sectionTitle}>Información Personal</Text>

        <Text style={styles.label}>País *</Text>
        <TouchableOpacity
          style={styles.countryButton}
          onPress={() => setCountryModalVisible(true)}
        >
          <Text style={styles.countryButtonText}>
            {getCountriesList().find((c) => c.code === country)?.flag} {COUNTRIES[country]?.name || 'Selecciona un país'}
          </Text>
          <Text style={styles.countryArrow}>▼</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Nombre Completo *</Text>
        <TextInput
          style={styles.input}
          placeholder="Tu nombre completo"
          placeholderTextColor="#999"
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={styles.label}>Correo Electrónico</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={userEmail}
          editable={false}
        />
        <Text style={styles.helperText}>El correo no se puede modificar</Text>

        <Text style={styles.label}>Teléfono *</Text>
        <TextInput
          style={styles.input}
          placeholder={`Ej: ${COUNTRIES[country].phoneExample}`}
          placeholderTextColor="#999"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Fecha de Nacimiento</Text>
        <TextInput
          style={styles.input}
          placeholder="DD/MM/AAAA"
          placeholderTextColor="#999"
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          keyboardType="default"
        />
        <Text style={styles.helperText}>Formato: DD/MM/AAAA</Text>

        <Text style={styles.label}>Cédula / DNI *</Text>
        <TextInput
          style={styles.input}
          placeholder="Número de documento"
          placeholderTextColor="#999"
          value={idNumber}
          onChangeText={setIdNumber}
          keyboardType="numeric"
        />
        <Text style={styles.helperText}>Solo números, sin puntos ni guiones</Text>

        <Text style={[styles.sectionTitle, styles.sectionMargin]}>Dirección</Text>

        <Text style={styles.label}>Dirección</Text>
        <TextInput
          style={styles.input}
          placeholder="Calle y número"
          placeholderTextColor="#999"
          value={address}
          onChangeText={setAddress}
        />

        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ciudad</Text>
            <TextInput
              style={styles.input}
              placeholder="Ciudad"
              placeholderTextColor="#999"
              value={city}
              onChangeText={setCity}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Provincia</Text>
            <TextInput
              style={styles.input}
              placeholder="Provincia"
              placeholderTextColor="#999"
              value={state}
              onChangeText={setState}
            />
          </View>
        </View>

        <Text style={styles.label}>Código Postal</Text>
        <TextInput
          style={[styles.input, styles.inputSmall]}
          placeholder="CP"
          placeholderTextColor="#999"
          value={zipCode}
          onChangeText={setZipCode}
          keyboardType="number-pad"
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>🔒</Text>
          <Text style={styles.infoText}>
            Tu información personal está protegida y solo se utiliza para mejorar tu experiencia en la plataforma.
          </Text>
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

      {/* Modal País */}
      <Modal
        visible={countryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCountryModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona tu país</Text>
            <ScrollView style={styles.modalScroll}>
              {getCountriesList().map((c) => {
                const selected = c.code === country;
                return (
                  <TouchableOpacity
                    key={c.code}
                    style={[styles.modalOption, selected && styles.modalOptionSelected]}
                    onPress={() => {
                      setCountry(c.code as CountryCode);
                      setCountryModalVisible(false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, selected && styles.modalOptionTextSelected]}>
                      {c.flag} {c.name}
                    </Text>
                    {selected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 400,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  countryButtonText: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '600',
  },
  countryArrow: {
    fontSize: 12,
    color: '#9ca3af',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalOptionSelected: {
    backgroundColor: '#e0e7ff',
    borderColor: '#6366f1',
  },
  modalOptionText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  modalOptionTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: '#6366f1',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionMargin: {
    marginTop: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  inputSmall: {
    maxWidth: 150,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f0f4f8',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#1e3a5f',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
