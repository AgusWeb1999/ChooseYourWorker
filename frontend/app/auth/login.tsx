import { useState, useEffect, useRef } from 'react';
import { Dimensions, Animated } from 'react-native';
import Head from 'expo-router/head';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Image, ScrollView, KeyboardAvoidingView, Platform, Linking, Modal } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';

interface ProfessionalPreview {
  id: string;
  display_name: string;
  profession: string;
  city: string;
  avatar_url: string | null;
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Profesionales preview
  const [professionals, setProfessionals] = useState<ProfessionalPreview[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [cardsPerView, setCardsPerView] = useState(3);
  const [cardWidth, setCardWidth] = useState(250);

  // Responsive: ajustar cards por view y ancho de card
  useEffect(() => {
    function updateLayout() {
      const screenWidth = Dimensions.get('window').width;
      let cards = 3;
      let width = 250;
      if (screenWidth < 600) {
        cards = 1;
        width = Math.max(180, screenWidth - 48); // padding
      } else if (screenWidth < 1000) {
        cards = 2;
        width = 210;
      }
      setCardsPerView(cards);
      setCardWidth(width);
      setCarouselIndex(0); // reset al cambiar tamaño
    }
    updateLayout();
    const subscription = Dimensions.addEventListener('change', updateLayout);
    return () => {
      if (typeof subscription?.remove === 'function') {
        subscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    // Traer 12 profesionales random/top-rated para preview
    (async () => {
      const { data, error } = await supabase
        .from('professionals')
        .select('id, display_name, profession, city, avatar_url')
        .order('rating', { ascending: false })
        .limit(12);
      if (!error && data) setProfessionals(data);
    })();
  }, []);

  // Carousel paginado: muestra un set de cards centradas, reemplaza el set completo al avanzar
  // Fade animation on card change
  useEffect(() => {
    if (professionals.length <= cardsPerView) return;
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        })
      ]).start();
      setCarouselIndex((prev) => {
        const maxIndex = Math.ceil(professionals.length / cardsPerView) - 1;
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [professionals, cardsPerView, fadeAnim]);

  async function handleLogin() {
    // Limpiar errores previos
    setErrorMsg(null);
    setErrors({});

    if (!email || !password) {
      const msg = 'Por favor completá tu email y contraseña';
      setErrorMsg(msg);
      if (Platform.OS !== 'web') {
        Alert.alert('Campos incompletos', msg);
      }
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const msg = 'Ingresá un email válido (ej: usuario@correo.com)';
      setErrorMsg(msg);
      setErrors({ email: msg });
      if (Platform.OS !== 'web') {
        Alert.alert('Email inválido', msg);
      }
      return;
    }

    if (password.length < 6) {
      const msg = 'La contraseña debe tener al menos 6 caracteres';
      setErrorMsg(msg);
      setErrors({ password: msg });
      if (Platform.OS !== 'web') {
        Alert.alert('Contraseña corta', msg);
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Mensajes de error más claros y amigables
      let errorMessage = 'Usuario o contraseña incorrecto';
      let fieldErrors: { email?: string; password?: string } = {};
      
      // Casos específicos de error
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Usuario o contraseña incorrecto';
        fieldErrors = { email: '', password: '' }; // Marca ambos campos en rojo
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Debés confirmar tu email antes de iniciar sesión. Revisá tu bandeja de entrada.';
        fieldErrors = { email: 'Email no confirmado' };
        
        // Redirigir a pantalla de confirmación después de mostrar el error
        setTimeout(() => {
          router.push({ 
            pathname: '/auth/email-confirmation', 
            params: { email } 
          });
        }, 2000);
      } else if (error.message.includes('User not found')) {
        errorMessage = 'Usuario no encontrado';
        fieldErrors = { email: 'Usuario no existe' };
      }

      // Mostrar inline (web) y también con Alert (nativo)
      setErrorMsg(errorMessage);
      setErrors(fieldErrors);
      if (Platform.OS !== 'web') {
        Alert.alert('Error de inicio de sesión', errorMessage);
      }
      setLoading(false);
    } else if (data.user) {
      // El AuthContext ya maneja la navegación automáticamente
      // Solo necesitamos redirigir a tabs, el _layout.tsx se encargará del resto
      console.log('✅ Login successful, redirecting to tabs...');
      setErrorMsg(null);
      router.replace('/(tabs)');
      setLoading(false);
    }
  }

  async function handlePasswordReset() {
    if (!email) {
      Alert.alert('Email requerido', 'Por favor ingresá tu email para recuperar tu contraseña');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://working-go.com/auth/reset-password',
    });

    if (error) {
      if (error.status === 429) {
        Alert.alert('Demasiados intentos', 'Has solicitado recuperar la contraseña demasiadas veces. Espera unos minutos antes de volver a intentarlo.');
      } else {
        Alert.alert('Error', 'No se pudo enviar el email de recuperación. Intentá de nuevo.');
      }
    } else {
      Alert.alert('Email enviado', 'Revisá tu bandeja de entrada para restablecer tu contraseña');
    }
  }

  return (
    <>
      <Head>
        <title>Iniciar sesión | WorkingGo - Encuentra profesionales y publica tu trabajo</title>
        <meta name="description" content="Iniciá sesión en WorkingGo. Encontrá albañiles, electricistas, plomeros, pintores, jardineros, técnicos, limpieza, mudanzas, niñeras, cocineros, cuidadores, y más servicios profesionales cerca tuyo. Publicá tu trabajo o buscá profesionales verificados." />
        <meta name="keywords" content="albañil, electricista, plomero, pintor, técnico, jardinero, limpieza, mudanza, cerrajero, gasista, techista, decorador, control de plagas, mecánico, chofer, niñera, cuidador, cocinero, panadero, peluquero, estilista, manicurista, masajista, fotógrafo, diseñador gráfico, programador, profesor particular, entrenador personal, fumigador, mudanzas, servicios, contratar, publicar trabajo, profesionales, Uruguay, Montevideo, servicios cerca, encontrar trabajador, publicar servicio, buscar trabajo, WorkingGo" />
        <meta property="og:title" content="Iniciar sesión | WorkingGo" />
        <meta property="og:description" content="Encontrá y contratá profesionales: albañiles, electricistas, plomeros, pintores, jardineros, técnicos, limpieza, mudanzas, niñeras, cocineros, y más. Publicá tu trabajo gratis en WorkingGo." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://working-go.com/auth/login" />
        <meta property="og:image" content="https://working-go.com/assets/images/og-image.png" />
      </Head>
      <View style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'flex-start', paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* LOGO CENTRADO Y MÁS ESPACIO */}
            <View style={{ alignItems: 'center', marginTop: 40, marginBottom: 24 }}>
              <Image 
                source={require('../../assets/images/icon.png')} 
                style={{ width: 150, height: 150, marginBottom: 24 }}
                resizeMode="contain"
              />
            </View>
            {/* TITULO Y FRASE INTRODUCTORIA CENTRADOS Y MÁS ESPACIO */}
            <View style={{ alignItems: 'center', marginBottom: 18, maxWidth: 500 }}>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#6366f1', marginBottom: 14, textAlign: 'center' }}>
                Bienvenido a WorkingGo
              </Text>
              <Text style={{ fontSize: 17, color: '#334155', marginBottom: 12, textAlign: 'center' }}>
                Encontrá profesionales verificados para tu hogar, empresa o proyecto. Mirá algunos de los trabajadores disponibles y registrate o iniciá sesión para contactar o publicar tu servicio.
              </Text>
            </View>
            {/* PREVIEW PROFESIONALES - CARRUSEL DE 3 */}
            <View style={[styles.previewSection, { alignItems: 'center', width: '100%' }]}> 
              <Text style={[styles.previewTitle, { textAlign: 'center', alignSelf: 'center', marginLeft: 0 }]}>Conocé algunos profesionales disponibles</Text>
              <Animated.View style={{ width: cardWidth * cardsPerView + 32, alignSelf: 'center', maxWidth: '100%', flexDirection: 'row', justifyContent: 'center', opacity: fadeAnim }}>
                {professionals
                  .slice(carouselIndex * cardsPerView, carouselIndex * cardsPerView + cardsPerView)
                  .map((prof, idx) => (
                    <View key={prof.id} style={[styles.previewCard, { width: cardWidth, minWidth: cardWidth, maxWidth: cardWidth, marginRight: idx === cardsPerView - 1 ? 0 : 16 }]}> 
                      <View style={styles.previewAvatar}>
                        {prof.avatar_url ? (
                          <Image source={{ uri: prof.avatar_url }} style={styles.previewAvatarImg} />
                        ) : (
                          <Text style={styles.previewAvatarText}>{prof.display_name?.charAt(0)?.toUpperCase() || '?'}</Text>
                        )}
                      </View>
                      <Text style={styles.previewName} numberOfLines={1} ellipsizeMode="tail">{prof.display_name}</Text>
                      <Text style={styles.previewProfession} numberOfLines={1} ellipsizeMode="tail">{prof.profession}</Text>
                      <Text style={styles.previewCity} numberOfLines={1} ellipsizeMode="tail">📍 {prof.city}</Text>
                      <View style={{ flex: 1 }} />
                      <TouchableOpacity style={styles.previewButton} onPress={() => setShowLoginModal(true)}>
                        <Text style={styles.previewButtonText}>Ver más</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
              </Animated.View>
              <View style={styles.ctaRow}>
                <TouchableOpacity style={styles.ctaButton} onPress={() => setShowLoginModal(true)}>
                  <Text style={styles.ctaButtonText}>Buscar trabajadores</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.ctaButton, styles.ctaButtonOutline]} onPress={() => setShowLoginModal(true)}>
                  <Text style={[styles.ctaButtonText, styles.ctaButtonOutlineText]}>Publicar mi servicio</Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* MODAL LOGIN WALL */}
            <Modal visible={showLoginModal} animationType="fade" transparent onRequestClose={() => setShowLoginModal(false)}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContentLoginWall}>
                  <Text style={styles.modalTitleLoginWall}>Iniciá sesión para ver más información o contactar</Text>
                  <TouchableOpacity style={styles.modalLoginButton} onPress={() => setShowLoginModal(false)}>
                    <Text style={styles.modalLoginButtonText}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            {/* LOGIN FORM CENTRADO */}
            <View style={{ maxWidth: 400, marginTop: 16, width: '100%', alignSelf: 'center' }}>
              <View style={styles.container}>
                <Text style={[styles.subtitle, { textAlign: 'center' }]}>Iniciá sesión en tu cuenta</Text>
                {errorMsg ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                ) : null}
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                    setErrorMsg(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="Contraseña"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                    setErrorMsg(null);
                  }}
                  secureTextEntry
                />
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
                  onPress={handleLogin}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.forgotPassword}
                  onPress={() => router.push('/auth/forgot-password')}
                >
                  <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
                <View style={styles.footer}>
                  <Text style={styles.footerText}>¿No tenés cuenta? </Text>
                  {/* @ts-ignore */}
                  <Link href="/auth/register" asChild>
                    <TouchableOpacity>
                      <Text style={styles.link}>Registrate</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
                <TouchableOpacity 
                  style={styles.supportLink}
                  onPress={async () => {
                    const url = 'mailto:workinggoam@gmail.com?subject=Consulta%20desde%20Login';
                    const supported = await Linking.canOpenURL(url);
                    if (supported) {
                      await Linking.openURL(url);
                    } else {
                      Alert.alert('Error', 'No se pudo abrir la aplicación de correo.');
                    }
                  }}
                >
                  <Text style={styles.supportLinkText}>¿Necesitas ayuda? Contacta soporte</Text>
                </TouchableOpacity>
              </View>
            </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  previewSection: {
    marginBottom: 32,
    marginTop: 16,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  carouselContent: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  previewCard: {
    width: 200,
    minWidth: 160,
    maxWidth: 240,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e7ef',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    minHeight: 210,
    maxHeight: 210,
    flex: 1,
    overflow: 'hidden',
  },
  previewAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  previewAvatarImg: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  previewAvatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  previewName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
    marginBottom: 2,
    textAlign: 'center',
    maxWidth: 120,
    width: '100%',
  },
  previewProfession: {
    fontSize: 13,
    color: '#6366f1',
    marginBottom: 2,
    textAlign: 'center',
    maxWidth: 120,
    width: '100%',
  },
  previewCity: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
    textAlign: 'center',
    maxWidth: 120,
    width: '100%',
  },
  previewButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    marginBottom: 6,
    justifyContent: 'center',
  },
  ctaButton: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginHorizontal: 2,
  },
  ctaButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  ctaButtonOutline: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  ctaButtonOutlineText: {
    color: '#6366f1',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentLoginWall: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitleLoginWall: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 18,
    textAlign: 'center',
  },
  modalLoginButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  modalLoginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    padding: 20,
    backgroundColor: '#f5f7fa',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#6366f1',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e6ed',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputError: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  forgotPassword: {
    marginTop: 16,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#6366f1',
    fontSize: 14,
    textDecorationLine: 'underline',
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
    borderColor: '#6366f1',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#6366f1',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
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
    color: '#6366f1',
    fontWeight: '600',
    textDecorationLine: 'underline',
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
    color: '#6366f1',
    fontWeight: '600',
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
  supportLink: {
    marginTop: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  supportLinkText: {
    fontSize: 12,
    color: '#9ca3af',
    textDecorationLine: 'underline',
  },
});