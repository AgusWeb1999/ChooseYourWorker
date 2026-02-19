import { useState, useEffect, useRef } from 'react';
import { Dimensions, Animated } from 'react-native';
import Head from 'expo-router/head';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Image, ScrollView, KeyboardAvoidingView, Platform, Linking, Modal } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { DEPARTAMENTOS_URUGUAY, getCiudadesPorDepartamento } from '../../utils/uruguayData';
import { getBarriosPorCiudad, Barrio } from '../../utils/barrios';
import QuickServiceFlow from '../../components/QuickServiceFlow';

interface ProfessionalPreview {
  id: string;
  display_name: string;
  profession: string;
  city: string;
  avatar_url: string | null;
}

const CATEGORIES = [
  'Sanitario', 'Electricista', 'Plomero', 'Albañil', 'Pintor', 'Carpintero',
  'Mecánico', 'Jardinero', 'Limpieza', 'Mudanzas', 'Cerrajero', 'Gasista',
  'Techista', 'Decorador', 'Control de Plagas', 'Chofer', 'Niñera', 'Cuidador',
  'Cocinero', 'Peluquero', 'Masajista', 'Fotógrafo', 'Diseñador Gráfico',
  'Programador', 'Profesor Particular', 'Entrenador Personal', 'Otro'
];

const CATEGORY_PLACEHOLDERS: { [key: string]: string } = {
  'Sanitario': 'Necesito reparar una pérdida de agua en el baño. El agua sale por debajo del lavabo...',
  'Electricista': 'Necesito instalar un enchufe nuevo en el living. Tengo el material pero no sé cómo conectarlo...',
  'Plomero': 'Se tapó el desagüe de la cocina y el agua no baja. Ya probé con destapador pero no funcionó...',
  'Albañil': 'Necesito reparar una pared que tiene humedad y está descascarada. Es una pared exterior...',
  'Pintor': 'Quiero pintar dos habitaciones de mi casa. Las paredes ya están preparadas...',
  'Carpintero': 'Necesito hacer un placard a medida para el dormitorio. El espacio es de 2m x 2.5m...',
  'Mecánico': 'Mi auto hace un ruido extraño al frenar. Creo que puede ser un problema con las pastillas...',
  'Jardinero': 'Necesito que corten el césped y poden algunos árboles del jardín. Hace meses que no se mantiene...',
  'Limpieza': 'Necesito una limpieza profunda de mi apartamento de 2 dormitorios antes de mudarme...',
  'Mudanzas': 'Necesito mudar un apartamento de 1 dormitorio. Tengo algunos muebles grandes y cajas...',
  'Cerrajero': 'Se trabó la cerradura de la puerta de entrada y no puedo abrir. La llave gira pero no abre...',
  'Gasista': 'Necesito instalar una estufa a gas en el living. Ya tengo la salida de gas preparada...',
  'Techista': 'Tengo goteras en el techo cuando llueve. Necesito que revisen las tejas y reparen...',
  'Decorador': 'Quiero redecorar mi living. Necesito asesoramiento con colores, muebles y distribución...',
  'Control de Plagas': 'Tengo hormigas en la cocina y necesito una fumigación. El problema viene hace semanas...',
  'Chofer': 'Necesito un chofer para llevarme al aeropuerto el próximo viernes a las 6 AM...',
  'Niñera': 'Busco niñera para cuidar a mi hijo de 5 años los martes y jueves de 14 a 18hs...',
  'Cuidador': 'Necesito alguien que cuide a mi madre adulta mayor durante la mañana. Ella tiene movilidad reducida...',
  'Cocinero': 'Necesito un cocinero para preparar la comida de un evento familiar de 20 personas...',
  'Peluquero': 'Necesito corte de cabello y barba a domicilio. Prefiero que traiga sus propias herramientas...',
  'Masajista': 'Busco masajista para sesiones de relajación a domicilio. Tengo tensión en cuello y espalda...',
  'Fotógrafo': 'Necesito un fotógrafo para una sesión de fotos familiares el próximo domingo...',
  'Diseñador Gráfico': 'Necesito diseñar un logo para mi nuevo emprendimiento. Tengo algunas ideas del estilo que busco...',
  'Programador': 'Necesito desarrollar una página web para mi negocio. Debe tener catálogo de productos y formulario de contacto...',
  'Profesor Particular': 'Busco profesor particular de matemática para mi hijo que está en 1er año de liceo...',
  'Entrenador Personal': 'Necesito un entrenador personal para hacer ejercicio 3 veces por semana. Mi objetivo es tonificar...',
};

export default function LoginScreen() {
  // Estado para controlar si muestra el flujo sin cuenta o formulario de login directo
  const [showQuickFlow, setShowQuickFlow] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  
  // Ref para rastrear si el componente está montado
  const isMountedRef = useRef(true);
  
  // Auth form states
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

  // Estados del formulario de servicio rápido
  const [category, setCategory] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [description, setDescription] = useState('');
  const [showCategories, setShowCategories] = useState(false);

  // Ubicación
  const [department, setDepartment] = useState('');
  const [city, setCity] = useState('');
  const [barrio, setBarrio] = useState('');
  const [cityList, setCityList] = useState<{id:string, nombre:string}[]>([]);
  const [barrioList, setBarrioList] = useState<Barrio[]>([]);
  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [barrioModalVisible, setBarrioModalVisible] = useState(false);

  // useEffect para cargar ciudades cuando se selecciona departamento
  useEffect(() => {
    if (department) {
      const ciudades = getCiudadesPorDepartamento(department);
      setCityList(ciudades);
      setCity('');
      setBarrio('');
      setBarrioList([]);
    }
  }, [department]);

  // useEffect para cargar barrios cuando se selecciona ciudad
  useEffect(() => {
    if (city) {
      const barrios = getBarriosPorCiudad(city);
      setBarrioList(barrios);
      setBarrio('');
    }
  }, [city]);

  // useEffect para limpiar cuando el componente se desmonta
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
    let isMounted = true;
    // Traer 12 profesionales random/top-rated para preview
    (async () => {
      const { data, error } = await supabase
        .from('professionals')
        .select('id, display_name, profession, city, avatar_url')
        .order('rating', { ascending: false })
        .limit(12);
      if (!error && data && isMounted) {
        setProfessionals(data);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Carousel paginado: muestra un set de cards centradas, reemplaza el set completo al avanzar
  // Fade animation on card change
  useEffect(() => {
    if (professionals.length <= cardsPerView) return;
    
    let animationRef: any = null;
    const interval = setInterval(() => {
      animationRef = Animated.sequence([
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
    
    return () => {
      clearInterval(interval);
      if (animationRef) {
        fadeAnim.stopAnimation();
      }
    };
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

    if (!isMountedRef.current) return;

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
          if (isMountedRef.current) {
            router.push({ 
              pathname: '/auth/email-confirmation', 
              params: { email } 
            });
          }
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

  // Si el usuario activa el flujo sin cuenta, mostrar QuickServiceFlow
  if (showQuickFlow) {
    return (
      <QuickServiceFlow
        initialData={{
          category,
          description,
          department,
          city,
          barrio
        }}
        onComplete={() => {
          // Al completar el flujo sin cuenta, redirigir a registro
          router.push('/auth/register');
        }}
        onSkip={() => {
          // Si omite, volver a la pantalla principal o mostrar login
          setShowQuickFlow(false);
          setShowAuthForm(true);
        }}
      />
    );
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
            {/* HEADER CON GRADIENTE */}
            <View style={styles.heroSection}>
              <View style={styles.heroContent}>
                <Image 
                  source={require('../../assets/images/icon.png')} 
                  style={styles.heroLogo}
                  resizeMode="contain"
                />
                <Text style={styles.heroTitle}>
                  ✨ Encontrá al profesional que necesitás
                </Text>
                <Text style={styles.heroSubtitle}>
                  Miles de profesionales verificados listos para ayudarte
                </Text>
                <View style={styles.heroBadges}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeIcon}>✅</Text>
                    <Text style={styles.badgeText}>Verificados</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeIcon}>⭐</Text>
                    <Text style={styles.badgeText}>Top rated</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeIcon}>💬</Text>
                    <Text style={styles.badgeText}>Chat directo</Text>
                  </View>
                </View>
              </View>
            </View>
            
            {/* PREVIEW PROFESIONALES - CARRUSEL */}
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
            </View>

            {/* FORMULARIO DE SERVICIO RÁPIDO */}
            <View style={styles.formSection}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>
                  🔍 ¿Qué necesitás?
                </Text>
                <Text style={styles.formSubtitle}>
                  Contanos qué problema querés resolver y te conectamos con los mejores profesionales
                </Text>
              </View>

              {/* Categoría del servicio */}
              <Text style={styles.label}>Categoría del servicio</Text>
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={() => setShowCategories(!showCategories)}
              >
                <Text style={category ? styles.selectButtonTextSelected : styles.selectButtonText}>
                  {category || 'Seleccionar categoría...'}
                </Text>
                <Text style={styles.selectButtonArrow}>{showCategories ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {showCategories && (
                <View style={styles.categoriesContainer}>
                  <TextInput
                    style={styles.categorySearchInput}
                    placeholder="🔍 Buscar categoría..."
                    placeholderTextColor="#9ca3af"
                    value={categorySearch}
                    onChangeText={setCategorySearch}
                    autoCapitalize="none"
                  />
                  <ScrollView style={styles.categoriesList} nestedScrollEnabled>
                    {CATEGORIES
                      .filter(cat => cat.toLowerCase().includes(categorySearch.toLowerCase()))
                      .map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={styles.categoryItem}
                        onPress={() => {
                          setCategory(cat);
                          setShowCategories(false);
                          setCategorySearch('');
                        }}
                      >
                        <Text style={styles.categoryItemText}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Descripción del problema */}
              <Text style={styles.label}>Descripción del problema</Text>
              <TextInput
                style={[styles.textArea, description.length < 20 && description.length > 0 && styles.inputError]}
                placeholder={category && CATEGORY_PLACEHOLDERS[category] ? CATEGORY_PLACEHOLDERS[category] : "Describe tu problema con detalle (mínimo 20 caracteres)..."}
                placeholderTextColor="#9ca3af"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <Text style={styles.charCount}>{description.length}/500 caracteres (mínimo 20)</Text>

              {/* Ubicación */}
              <Text style={styles.label}>Ubicación</Text>
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={() => setDepartmentModalVisible(true)}
              >
                <Text style={department ? styles.selectButtonTextSelected : styles.selectButtonText}>
                  {department 
                    ? DEPARTAMENTOS_URUGUAY.find(d => d.id === department)?.nombre || department
                    : 'Seleccionar departamento...'}
                </Text>
                <Text style={styles.selectButtonArrow}>▼</Text>
              </TouchableOpacity>

              {department && (
                <TouchableOpacity 
                  style={[styles.selectButton, { marginTop: 12 }]}
                  onPress={() => setCityModalVisible(true)}
                >
                  <Text style={city ? styles.selectButtonTextSelected : styles.selectButtonText}>
                    {city 
                      ? cityList.find(c => c.id === city)?.nombre || city
                      : 'Seleccionar ciudad...'}
                  </Text>
                  <Text style={styles.selectButtonArrow}>▼</Text>
                </TouchableOpacity>
              )}

              {city && barrioList.length > 0 && (
                <TouchableOpacity 
                  style={[styles.selectButton, { marginTop: 12 }]}
                  onPress={() => setBarrioModalVisible(true)}
                >
                  <Text style={barrio ? styles.selectButtonTextSelected : styles.selectButtonText}>
                    {barrio 
                      ? barrioList.find(b => b.id === barrio)?.nombre || barrio
                      : 'Seleccionar barrio (opcional)...'}
                  </Text>
                  <Text style={styles.selectButtonArrow}>▼</Text>
                </TouchableOpacity>
              )}

              {/* Botón de búsqueda */}
              <TouchableOpacity 
                style={[styles.searchButton, (!category || description.length < 20 || !department || !city) && styles.searchButtonDisabled]}
                onPress={async () => {
                  if (!category || description.length < 20 || !department || !city) {
                    Alert.alert('Campos incompletos', 'Por favor completa todos los campos para continuar');
                    return;
                  }
                  
                  // Registrar evento de tracking (funciona para usuarios logueados y no logueados)
                  try {
                    const { data: { user } } = await supabase.auth.getUser();
                    await supabase.from('user_actions').insert({
                      action_type: 'search_professionals_clicked',
                      action_data: { category, city, department },
                      source: 'login_page',
                      user_id: user?.id || null // Incluye user_id solo si está autenticado
                    });
                  } catch (error) {
                    // No bloqueamos la acción si falla el tracking
                    console.log('Error tracking event:', error);
                  }
                  
                  // Activar el flujo sin cuenta con los datos pre-cargados
                  setShowQuickFlow(true);
                }}
              >
                <Text style={styles.searchButtonText}>Buscar profesionales</Text>
              </TouchableOpacity>
            </View>

            {/* MODALES DE UBICACIÓN */}
            <Modal visible={departmentModalVisible} animationType="slide" transparent onRequestClose={() => setDepartmentModalVisible(false)}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Seleccionar Departamento</Text>
                  <ScrollView style={styles.modalScroll}>
                    {DEPARTAMENTOS_URUGUAY.map((dept) => (
                      <TouchableOpacity
                        key={dept.id}
                        style={styles.modalItem}
                        onPress={() => {
                          setDepartment(dept.id);
                          setDepartmentModalVisible(false);
                        }}
                      >
                        <Text style={styles.modalItemText}>{dept.nombre}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity style={styles.modalCloseButton} onPress={() => setDepartmentModalVisible(false)}>
                    <Text style={styles.modalCloseButtonText}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <Modal visible={cityModalVisible} animationType="slide" transparent onRequestClose={() => setCityModalVisible(false)}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Seleccionar Ciudad</Text>
                  <ScrollView style={styles.modalScroll}>
                    {cityList.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={styles.modalItem}
                        onPress={() => {
                          setCity(c.id);
                          setCityModalVisible(false);
                        }}
                      >
                        <Text style={styles.modalItemText}>{c.nombre}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity style={styles.modalCloseButton} onPress={() => setCityModalVisible(false)}>
                    <Text style={styles.modalCloseButtonText}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <Modal visible={barrioModalVisible} animationType="slide" transparent onRequestClose={() => setBarrioModalVisible(false)}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Seleccionar Barrio</Text>
                  <ScrollView style={styles.modalScroll}>
                    {barrioList.map((b) => (
                      <TouchableOpacity
                        key={b.id}
                        style={styles.modalItem}
                        onPress={() => {
                          setBarrio(b.id);
                          setBarrioModalVisible(false);
                        }}
                      >
                        <Text style={styles.modalItemText}>{b.nombre}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity style={styles.modalCloseButton} onPress={() => setBarrioModalVisible(false)}>
                    <Text style={styles.modalCloseButtonText}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

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

            {/* SEPARADOR */}
            {showAuthForm && (
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
              </View>
            )}

            {/* LOGIN/REGISTRO FORM */}
            {showAuthForm && (
              <View style={{ maxWidth: 400, marginTop: 16, width: '100%', alignSelf: 'center' }}>
                <View style={styles.container}>
                  <Text style={[styles.subtitle, { textAlign: 'center' }]}>Para continuar, iniciá sesión o registrate</Text>
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
            )}

            {/* Si no mostró el auth form, mostrar botones de acción */}
            {!showAuthForm && (
              <View style={{ maxWidth: 500, marginTop: 32, width: '100%', alignSelf: 'center', paddingHorizontal: 20 }}>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>o</Text>
                  <View style={styles.dividerLine} />
                </View>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowAuthForm(true)}
                >
                  <Text style={styles.actionButtonText}>Ya tengo cuenta - Iniciar sesión</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonOutline]}
                  onPress={() => router.push('/auth/register')}
                >
                  <Text style={[styles.actionButtonText, styles.actionButtonOutlineText]}>Crear cuenta nueva</Text>
                </TouchableOpacity>
              </View>
            )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  // Hero section con gradiente
  heroSection: {
    width: '100%',
    backgroundColor: '#f0f9ff',
    paddingTop: 40,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heroLogo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 17,
    color: '#64748b',
    marginBottom: 24,
    textAlign: 'center',
    maxWidth: 450,
    lineHeight: 24,
  },
  heroBadges: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeIcon: {
    fontSize: 16,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  // Form section
  formSection: {
    maxWidth: 550,
    marginTop: 40,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 28,
    marginHorizontal: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 10,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  previewSection: {
    marginBottom: 32,
    marginTop: 24,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
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
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#f0f9ff',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    minHeight: 220,
    maxHeight: 220,
    flex: 1,
    overflow: 'hidden',
  },
  previewAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#f0f9ff',
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
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 6,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
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
    backgroundColor: '#fafbff',
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
  // Estilos del formulario de servicio rápido
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 10,
    marginTop: 20,
  },
  selectButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectButtonText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  selectButtonTextSelected: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },
  selectButtonArrow: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: 'bold',
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    marginTop: 10,
    maxHeight: 280,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categorySearchInput: {
    backgroundColor: '#f8fafc',
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    padding: 14,
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  categoriesList: {
    maxHeight: 220,
  },
  categoryItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  categoryItemText: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '500',
  },
  textArea: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 18,
    fontSize: 16,
    minHeight: 130,
    textAlignVertical: 'top',
    color: '#1e293b',
    lineHeight: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  charCount: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'right',
    fontWeight: '500',
  },
  searchButton: {
    backgroundColor: '#6366f1',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#818cf8',
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalItemText: {
    fontSize: 15,
    color: '#374151',
  },
  modalCloseButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 500,
    marginVertical: 24,
    paddingHorizontal: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#6366f1',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonOutline: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#6366f1',
    shadowOpacity: 0.1,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  actionButtonOutlineText: {
    color: '#6366f1',
  },
});