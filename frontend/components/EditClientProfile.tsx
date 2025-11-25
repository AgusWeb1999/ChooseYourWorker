import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { supabase } from '../src/lib/supabase';

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
  const [dateOfBirth, setDateOfBirth] = useState(userProfile?.date_of_birth || '');
  const [idNumber, setIdNumber] = useState(userProfile?.id_number || '');
  const [address, setAddress] = useState(userProfile?.address || '');
  const [city, setCity] = useState(userProfile?.city || '');
  const [state, setState] = useState(userProfile?.state || '');
  const [zipCode, setZipCode] = useState(userProfile?.zip_code || '');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!fullName || !phone || !idNumber) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
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

    // Validación de cédula (solo números, mínimo 6 dígitos)
    if (idNumber) {
      const idRegex = /^\d{6,}$/;
      if (!idRegex.test(idNumber)) {
        Alert.alert('Error', 'La cédula debe contener al menos 6 dígitos numéricos');
        return;
      }
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          phone,
          date_of_birth: dateOfBirth || null,
          id_number: idNumber,
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
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Editar Perfil</Text>
        <Text style={styles.subtitle}>Mantén tu información actualizada y segura</Text>

        <Text style={styles.sectionTitle}>Información Personal</Text>

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
          placeholder="Ej: 11 1234 5678"
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
