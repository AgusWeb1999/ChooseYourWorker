import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { validatePhone, validateId, normalizePhone, normalizeId, getCountriesList, CountryCode } from '../../utils/countryValidation';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [country, setCountry] = useState<CountryCode>('UY');
  const [userType, setUserType] = useState<'client' | 'worker' | null>(null);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countryModalVisible, setCountryModalVisible] = useState(false);

  async function handleRegister() {
    const newErrors: Record<string, string> = {};
    setErrors({});
    setErrorMsg(null);

    // Validar campos básicos
    if (!fullName) {
      newErrors.fullName = 'El nombre es requerido';
    }
    if (!email) {
      newErrors.email = 'El email es requerido';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'Email inválido (ej: usuario@correo.com)';
      }
    }
    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
    }

    // Validar teléfono según país
    const phoneValidation = validatePhone(phone, country);
    if (!phoneValidation.valid) {
      newErrors.phone = phoneValidation.error || 'Teléfono inválido';
    }

    // Validar DNI/Cédula según país
    const idValidation = validateId(idNumber, country);
    if (!idValidation.valid) {
      newErrors.idNumber = idValidation.error || 'DNI/Cédula inválido';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const errorList = Object.values(newErrors).join('\n');
      if (Platform.OS !== 'web') {
        Alert.alert('Completá los campos correctamente', errorList);
      } else {
        setErrorMsg('Por favor corregí los errores en el formulario');
      }
      return;
    }

    if (!userType) {
      const msg = 'Elegí el tipo de cuenta';
      setErrorMsg(msg);
      if (Platform.OS !== 'web') {
        Alert.alert('Tipo de cuenta requerido', msg);
      }
      return;
    }

    if (!termsAccepted) {
      const msg = 'Debes aceptar los Términos de Servicio para continuar';
      setErrorMsg(msg);
      if (Platform.OS !== 'web') {
        Alert.alert('Términos requeridos', msg);
      }
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    
    console.log('🚀 Registering user:', { email, fullName, userType, country });
    
    // Validar que el email no exista
    console.log('🔍 Checking if email is available...');
    const { data: emailCheck, error: emailCheckError } = await supabase
      .rpc('check_email_available', { p_email: email });
    
    if (emailCheckError) {
      console.log('❌ Error checking email:', emailCheckError);
      const msg = 'No se pudo verificar el email, intentá de nuevo en unos segundos';
      setErrorMsg(msg);
      Alert.alert('Error', msg);
      setLoading(false);
      return;
    }

    if (!emailCheck) {
      console.log('❌ Email already exists');
      const msg = 'Este email ya está registrado. Usá otro email o iniciá sesión.';
      setErrorMsg(msg);
      Alert.alert('Email existente', msg);
      setLoading(false);
      return;
    }

    // Validar que el teléfono no exista
    console.log('🔍 Checking if phone is available...');
    const normalizedPhone = normalizePhone(phone, country);
    const { data: phoneData } = await supabase
      .from('users')
      .select('id')
      .eq('phone', normalizedPhone)
      .single();

    if (phoneData) {
      console.log('❌ Phone already exists');
      const msg = 'Este teléfono ya está registrado en otra cuenta.';
      setErrorMsg(msg);
      Alert.alert('Teléfono duplicado', msg);
      setLoading(false);
      return;
    }

    // Validar que el DNI/Cédula no exista
    console.log('🔍 Checking if ID is available...');
    const normalizedId = normalizeId(idNumber);
    const { data: idData } = await supabase
      .from('users')
      .select('id')
      .eq('id_number', normalizedId)
      .single();

    if (idData) {
      console.log('❌ ID already exists');
      const msg = 'Este DNI/Cédula ya está registrado en otra cuenta.';
      setErrorMsg(msg);
      Alert.alert('DNI/Cédula duplicado', msg);
      setLoading(false);
      return;
    }
    
    console.log('✅ Email, phone and ID are available');
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          user_type: userType,
        },
      },
    });

    if (error) {
      console.log('❌ Registration error:', error);
      const msg = error.message || 'No pudimos crear la cuenta. Intentá de nuevo.';
      setErrorMsg(msg);
      Alert.alert('Error al registrar', msg);
      setLoading(false);
      return;
    }

    console.log('✅ User registered successfully:', data);

    // Update user record with is_professional flag, country, phone, and id_number
    if (data.user) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          is_professional: userType === 'worker',
          phone: normalizePhone(phone, country),
          id_number: normalizeId(idNumber),
        })
        .eq('id', data.user.id);

      if (updateError) {
        console.log('Error updating user data:', updateError);
      }
    }

    // Wait a bit for database to update
    console.log('⏳ Waiting for database update...');
    await new Promise(resolve => setTimeout(resolve, 1500));

    setLoading(false);
    
    // _layout.tsx will handle automatic redirection
    // If worker without profile -> complete-profile
    // If client -> complete-client-profile (if no phone/address)
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>Únete a WorkingGo</Text>

      {errorMsg ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      <Text style={styles.label}>Soy de: *</Text>
      <TouchableOpacity
        style={styles.countrySelector}
        onPress={() => setCountryModalVisible(true)}
        disabled={loading}
      >
        <Text style={styles.countrySelectorText}>
          {getCountriesList().find((c) => c.code === country)?.flag} {' '}
          {getCountriesList().find((c) => c.code === country)?.name}
        </Text>
        <Text style={styles.countrySelectorArrow}>▼</Text>
      </TouchableOpacity>

      {/* Modal País */}
      <Modal
        visible={countryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCountryModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona tu país</Text>
              <TouchableOpacity 
                onPress={() => setCountryModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
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
                    <View style={styles.modalOptionContent}>
                      <Text style={styles.modalOptionFlag}>{c.flag}</Text>
                      <Text style={[styles.modalOptionText, selected && styles.modalOptionTextSelected]}>
                        {c.name}
                      </Text>
                    </View>
                    {selected && <Text style={styles.modalCheckmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <TextInput
        style={[styles.input, errors.fullName && styles.inputError]}
        placeholder="Nombre Completo"
        placeholderTextColor="#999"
        value={fullName}
        onChangeText={(text) => {
          setFullName(text);
          if (errors.fullName) {
            const { fullName, ...rest } = errors;
            setErrors(rest);
          }
        }}
      />
      {errors.fullName && <Text style={styles.errorFieldText}>{errors.fullName}</Text>}

      <TextInput
        style={[styles.input, errors.email && styles.inputError]}
        placeholder="Correo Electrónico"
        placeholderTextColor="#999"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (errors.email) {
            const { email, ...rest } = errors;
            setErrors(rest);
          }
        }}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {errors.email && <Text style={styles.errorFieldText}>{errors.email}</Text>}

      <TextInput
        style={[styles.input, errors.password && styles.inputError]}
        placeholder="Contraseña"
        placeholderTextColor="#999"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (errors.password) {
            const { password, ...rest } = errors;
            setErrors(rest);
          }
        }}
        secureTextEntry
      />
      {errors.password && <Text style={styles.errorFieldText}>{errors.password}</Text>}

      <TextInput
        style={[styles.input, errors.phone && styles.inputError]}
        placeholder={`Teléfono (ej: ${getCountriesList().find(c => c.code === country)?.phoneExample || '+54 9 11 1234-5678'})`}
        placeholderTextColor="#999"
        value={phone}
        onChangeText={(text) => {
          setPhone(text);
          if (errors.phone) {
            const { phone, ...rest } = errors;
            setErrors(rest);
          }
        }}
        keyboardType="phone-pad"
      />
      {errors.phone && <Text style={styles.errorFieldText}>{errors.phone}</Text>}

      <TextInput
        style={[styles.input, errors.idNumber && styles.inputError]}
        placeholder={`${getCountriesList().find(c => c.code === country)?.idName || 'DNI'} (ej: ${getCountriesList().find(c => c.code === country)?.idExample || '12345678'})`}
        placeholderTextColor="#999"
        value={idNumber}
        onChangeText={(text) => {
          setIdNumber(text);
          if (errors.idNumber) {
            const { idNumber, ...rest } = errors;
            setErrors(rest);
          }
        }}
        autoCapitalize="characters"
      />
      {errors.idNumber && <Text style={styles.errorFieldText}>{errors.idNumber}</Text>}

      <Text style={styles.label}>Soy:</Text>
      <View style={styles.typeContainer}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            userType === 'client' && styles.typeButtonActive,
          ]}
          onPress={() => setUserType('client')}
        >
          <Text style={[
            styles.typeButtonText,
            userType === 'client' && styles.typeButtonTextActive,
          ]}>
            🔍 Buscando trabajadores
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            userType === 'worker' && styles.typeButtonActive,
          ]}
          onPress={() => setUserType('worker')}
        >
          <Text style={[
            styles.typeButtonText,
            userType === 'worker' && styles.typeButtonTextActive,
          ]}>
            🛠️ Ofreciendo servicios
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.termsContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setTermsAccepted(!termsAccepted)}
        >
          <View style={[styles.checkboxInner, termsAccepted && styles.checkboxChecked]}>
            {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>
        <View style={styles.termsText}>
          <Text style={styles.termsLabel}>He leído y acepto los </Text>
          {/* @ts-ignore */}
          <Link href="/auth/terms-of-service" asChild>
            <TouchableOpacity>
              <Text style={styles.termsLink}>Términos de Servicio</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Creando cuenta...' : 'Registrarse'}
        </Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
        {/* @ts-ignore */}
        <Link href="/auth/login" asChild>
          <TouchableOpacity>
            <Text style={styles.link}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
</SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1e3a5f',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  errorFieldText: {
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: '#1e3a5f',
    backgroundColor: '#f0f4f8',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#1e3a5f',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#1e3a5f',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#666',
  },
  link: {
    color: '#1e3a5f',
    fontWeight: '600',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    marginTop: 2,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#1e3a5f',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1e3a5f',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalCheckmark: {
    fontSize: 18,
    color: '#6366f1',
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  termsLabel: {
    fontSize: 13,
    color: '#666',
  },
  termsLink: {
    fontSize: 13,
    color: '#1e3a5f',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 24,
    color: '#9ca3af',
    fontWeight: '300',
  },
  modalScroll: {
    maxHeight: 400,
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
  modalOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalOptionFlag: {
    fontSize: 24,
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
  countrySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  countrySelectorText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  countrySelectorArrow: {
    fontSize: 12,
    color: '#999',
  },
});