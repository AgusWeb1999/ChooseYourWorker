import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Modal } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { router } from 'expo-router';
import { useToast } from '../contexts/ToastContext';
import { getBarriosPorCiudad, Barrio } from '../utils/barrios';
import { DEPARTAMENTOS_URUGUAY, getCiudadesPorDepartamento } from '../utils/uruguayData';

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

const TIMING_OPTIONS = [
  { id: 'now', label: 'Ahora mismo', sublabel: 'Urgente - Lo antes posible', icon: '🚨' },
  { id: 'today', label: 'Hoy', sublabel: 'En las próximas horas', icon: '⏰' },
  { id: 'week', label: 'Esta semana', sublabel: 'En los próximos días', icon: '📅' },
];

interface Professional {
  id: string;
  display_name: string;
  profession: string;
  city: string;
  rating: number;
  rating_count: number;
  hourly_rate: number;
  bio: string;
  avatar_url: string | null;
  portfolio_images?: string[];
}

interface QuickServiceFlowProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export default function QuickServiceFlow({ onComplete, onSkip }: QuickServiceFlowProps) {
  // Step tracking
  const [currentStep, setCurrentStep] = useState(1); // 1: describe, 2: timing, 3: professionals, 4: contact info, 5: confirmation
  const { showToast } = useToast();

  // Step 1: Description
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [showCategories, setShowCategories] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

  // Ubicación (Uruguay)
  const [department, setDepartment] = useState('');
  const [city, setCity] = useState('');
  const [barrio, setBarrio] = useState('');
  const [cityList, setCityList] = useState<{id:string, nombre:string}[]>([]);
  const [barrioList, setBarrioList] = useState<Barrio[]>([]);
  
  // Modales de ubicación
  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [barrioModalVisible, setBarrioModalVisible] = useState(false);

  // Step 2: Timing
  const [timing, setTiming] = useState('');

  // Step 3: Professionals
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedProfessional, setExpandedProfessional] = useState<string | null>(null);

  // Step 4: Contact info (for guests)
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // useEffect para cargar ciudades cuando se selecciona departamento
  useEffect(() => {
    if (department) {
      const ciudades = getCiudadesPorDepartamento(department);
      setCityList(ciudades);
      setCity(''); // Resetear ciudad al cambiar departamento
      setBarrio(''); // Resetear barrio
      setBarrioList([]);
    }
  }, [department]);

  // useEffect para cargar barrios cuando se selecciona ciudad
  useEffect(() => {
    if (city) {
      const barrios = getBarriosPorCiudad(city);
      setBarrioList(barrios);
      setBarrio(''); // Resetear barrio al cambiar ciudad
    }
  }, [city]);

  async function handleNextFromDescription() {
    if (!category) {
      showToast('Por favor selecciona una categoría', 'error');
      return;
    }
    if (!description || description.length < 20) {
      showToast('La descripción debe tener al menos 20 caracteres', 'error');
      return;
    }
    if (!department || !city) {
      showToast('Por favor selecciona departamento y ciudad', 'error');
      return;
    }
    setCurrentStep(2);
  }

  async function handleNextFromTiming() {
    if (!timing) {
      showToast('Por favor selecciona cuándo necesitas el servicio', 'error');
      return;
    }

    // Buscar profesionales
    setLoading(true);
    setCurrentStep(3);

    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('id, user_id, display_name, profession, city, rating, rating_count, hourly_rate, bio, avatar_url')
        .eq('profession', category)
        .order('rating', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Cargar imágenes del portfolio para cada profesional
      const profsWithPortfolio = await Promise.all(
        (data || []).map(async (prof) => {
          try {
            const { data: portfolioData } = await supabase
              .from('portfolio_images')
              .select('image_url')
              .eq('professional_id', prof.id)
              .order('created_at', { ascending: false })
              .limit(3); // Máximo 3 imágenes para preview
            
            return {
              ...prof,
              portfolio_images: (portfolioData || []).map(p => p.image_url).filter(url => url && url.startsWith('http'))
            };
          } catch (portfolioError) {
            console.error('Error cargando portfolio:', portfolioError);
            return {
              ...prof,
              portfolio_images: []
            };
          }
        })
      );

      setProfessionals(profsWithPortfolio);

      // Si no hay profesionales, mostrar mensaje
      if (!data || data.length === 0) {
        showToast(`No encontramos ${category}s disponibles. Podés publicar tu solicitud para que te contacten.`, 'error');
      }
    } catch (error) {
      console.error('Error buscando profesionales:', error);
      showToast('No pudimos buscar profesionales. Intenta de nuevo.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function createOpenRequest() {
    // Guardar datos para publicar después del registro
    const flowData = {
      category,
      description,
      timing,
      department,
      city,
      barrio,
      publishRequest: true
    };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('pending_service_request', JSON.stringify(flowData));
    }
    
    showToast('Creá tu cuenta para publicar la solicitud', 'error');
    setTimeout(() => {
      router.push('/auth/register');
    }, 1500);
  }

  function handleSelectProfessional(professionalId: string) {
    // Buscar el profesional seleccionado
    const professional = professionals.find(p => p.id === professionalId);
    if (!professional) return;

    // Guardar profesional seleccionado y pasar al paso 4 (info de contacto)
    setSelectedProfessional(professional);
    setCurrentStep(4);
  }

  function handleNoMatchFound() {
    showToast('Te redirigimos para crear tu cuenta y publicar la solicitud', 'error');
    setTimeout(() => {
      // Guardar datos para publicar solicitud después del registro
      const flowData = {
        category,
        description,
        timing,
        department,
        city,
        barrio,
        publishRequest: true
      };
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('pending_service_request', JSON.stringify(flowData));
      }
      
      router.push('/auth/register');
    }, 1500);
  }

  async function handleSubmitContactInfo() {
    // Validar datos
    if (!guestName.trim()) {
      showToast('Por favor ingresa tu nombre', 'error');
      return;
    }

    if (!guestEmail.trim() || !guestEmail.includes('@')) {
      showToast('Por favor ingresa un email válido', 'error');
      return;
    }

    if (!guestPhone.trim()) {
      showToast('Por favor ingresa tu teléfono', 'error');
      return;
    }

    if (!selectedProfessional) {
      showToast('Error: no hay profesional seleccionado', 'error');
      return;
    }

    setSubmitting(true);

    try {
      // Crear hire en la base de datos con información de invitado
      const { data: hireData, error: hireError } = await supabase
        .from('hires')
        .insert({
          professional_id: selectedProfessional.id,
          guest_client_email: guestEmail.toLowerCase().trim(),
          guest_client_phone: guestPhone.trim(),
          guest_client_name: guestName.trim(),
          status: 'pending',
          service_description: description,
          service_category: category,
          service_location: `${city}, ${department}${barrio ? ` - ${barrio}` : ''}`,
        })
        .select('id, review_token')
        .single();

      if (hireError) throw hireError;

      // Enviar emails (profesional y cliente invitado)
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'guest_contact',
          hireId: hireData.id,
          frontendUrl: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });

      if (emailError) {
        console.error('Error enviando emails de invitado:', emailError);
      }

      showToast('¡Contacto enviado! Recibirás un email con los datos del profesional.', 'success');
      
      // Pasar al paso de confirmación
      setCurrentStep(5);

    } catch (error) {
      console.error('Error creando hire:', error);
      showToast('Hubo un error al enviar tu solicitud. Intenta de nuevo.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  function renderStars(rating: number) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={styles.star}>
          {i <= Math.round(rating) ? '⭐' : '☆'}
        </Text>
      );
    }
    return stars;
  }

  // Renderizar contenido del step actual
  const renderStepContent = () => {
    // STEP 1: Describir servicio
    if (currentStep === 1) {
      return (
        <>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '33%' }]} />
          </View>

          <Text style={styles.stepTitle}>¿Qué necesitás?</Text>
          <Text style={styles.stepSubtitle}>Contanos qué problema querés resolver</Text>

          {/* Selector de categoría */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Categoría del servicio</Text>
            <TouchableOpacity
              style={styles.categorySelector}
              onPress={() => setShowCategories(!showCategories)}
            >
              <Text style={category ? styles.categorySelectorTextFilled : styles.categorySelectorText}>
                {category || 'Seleccionar categoría'}
              </Text>
              <Text style={styles.arrow}>{showCategories ? '▲' : '▼'}</Text>
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
                <View style={styles.categoriesGrid}>
                {CATEGORIES
                  .filter(cat => cat.toLowerCase().includes(categorySearch.toLowerCase()))
                  .map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                    onPress={() => {
                      setCategory(cat);
                      setShowCategories(false);
                      setCategorySearch(''); // Resetear búsqueda
                    }}
                  >
                    <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
                </View>
              </View>
            )}
          </View>

          {/* Descripción */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Descripción del problema</Text>
            <Text style={styles.hint}>Mínimo 20 caracteres</Text>
            <TextInput
              style={styles.textarea}
              placeholder={category && CATEGORY_PLACEHOLDERS[category] ? CATEGORY_PLACEHOLDERS[category] : "Describe con detalle qué necesitas y cualquier información relevante..."}
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={6}
              value={description}
              onChangeText={setDescription}
              maxLength={500}
            />
            <Text style={styles.charCount}>{description.length}/500 caracteres</Text>
          </View>

          {/* Ubicación - Selectores */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>¿Dónde necesitás el servicio?</Text>
            
            {/* Departamento */}
            <TouchableOpacity
              style={styles.locationSelector}
              onPress={() => setDepartmentModalVisible(true)}
            >
              <Text style={department ? styles.locationSelectorTextFilled : styles.locationSelectorText}>
                {department 
                  ? DEPARTAMENTOS_URUGUAY.find(d => d.id === department)?.nombre || department
                  : 'Selecciona departamento'}
              </Text>
              <Text style={styles.arrow}>▼</Text>
            </TouchableOpacity>

            {/* Ciudad */}
            {department && (
              <TouchableOpacity
                style={[styles.locationSelector, { marginTop: 8 }]}
                onPress={() => setCityModalVisible(true)}
                disabled={!department}
              >
                <Text style={city ? styles.locationSelectorTextFilled : styles.locationSelectorText}>
                  {city 
                    ? cityList.find(c => c.id === city)?.nombre || city
                    : 'Selecciona ciudad'}
                </Text>
                <Text style={styles.arrow}>▼</Text>
              </TouchableOpacity>
            )}

            {/* Barrio */}
            {city && barrioList.length > 0 && (
              <TouchableOpacity
                style={[styles.locationSelector, { marginTop: 8 }]}
                onPress={() => setBarrioModalVisible(true)}
              >
                <Text style={barrio ? styles.locationSelectorTextFilled : styles.locationSelectorText}>
                  {barrio 
                    ? barrioList.find(b => b.id === barrio)?.nombre || barrio
                    : 'Selecciona barrio (opcional)'}
                </Text>
                <Text style={styles.arrow}>▼</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.nextButton} onPress={handleNextFromDescription}>
            <Text style={styles.nextButtonText}>Continuar →</Text>
          </TouchableOpacity>

          {onSkip && (
            <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
              <Text style={styles.skipButtonText}>Omitir y explorar</Text>
            </TouchableOpacity>
          )}
        </>
      );
    }

    // STEP 2: Timing
    if (currentStep === 2) {
      return (
        <>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '66%' }]} />
          </View>

          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentStep(1)}>
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>

          <Text style={styles.stepTitle}>¿Cuándo lo necesitás?</Text>
          <Text style={styles.stepSubtitle}>Selecciona el tiempo que mejor se ajuste</Text>

          <View style={styles.timingOptions}>
            {TIMING_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.timingOption, timing === option.id && styles.timingOptionActive]}
                onPress={() => setTiming(option.id)}
              >
                <Text style={styles.timingIcon}>{option.icon}</Text>
                <View style={styles.timingContent}>
                  <Text style={[styles.timingLabel, timing === option.id && styles.timingLabelActive]}>
                    {option.label}
                  </Text>
                  <Text style={styles.timingSublabel}>{option.sublabel}</Text>
                </View>
                {timing === option.id && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.nextButton} onPress={handleNextFromTiming}>
            <Text style={styles.nextButtonText}>Ver profesionales →</Text>
          </TouchableOpacity>
        </>
      );
    }

    // STEP 3: Profesionales disponibles
    if (currentStep === 3) {
      if (loading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Buscando profesionales...</Text>
          </View>
        );
      }

      return (
        <>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>

          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentStep(2)}>
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>

          <Text style={styles.stepTitle}>Profesionales disponibles</Text>
          <Text style={styles.stepSubtitle}>
            Encontramos {professionals.length} {category}s para vos
          </Text>

          {professionals.map((prof) => (
            <View key={prof.id} style={styles.professionalCard}>
              <View style={styles.professionalHeader}>
                {prof.avatar_url ? (
                  <Image source={{ uri: prof.avatar_url }} style={styles.professionalAvatar} />
                ) : (
                  <View style={styles.professionalAvatarPlaceholder}>
                    <Text style={styles.professionalAvatarText}>
                      {prof.display_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.professionalInfo}>
                  <Text style={styles.professionalName}>{prof.display_name}</Text>
                  <Text style={styles.professionalProfession}>{prof.profession}</Text>
                  <View style={styles.professionalRating}>
                    {renderStars(prof.rating)}
                    <Text style={styles.professionalRatingCount}>({prof.rating_count})</Text>
                  </View>
                </View>

                <View style={styles.professionalRate}>
                  <Text style={styles.rateText}>${prof.hourly_rate}/hr</Text>
                </View>
              </View>

              <Text style={styles.professionalBio} numberOfLines={3}>
                {prof.bio || 'Sin descripción'}
              </Text>

              {/* Botón expandir portfolio */}
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => setExpandedProfessional(expandedProfessional === prof.id ? null : prof.id)}
              >
                <Text style={styles.expandButtonText}>
                  {expandedProfessional === prof.id ? '▲ Ocultar portfolio' : '▼ Ver portfolio y más info'}
                </Text>
              </TouchableOpacity>

              {/* Portfolio expandible */}
              {expandedProfessional === prof.id && (
                <View style={styles.portfolioSection}>
                  <Text style={styles.portfolioTitle}>📸 Portfolio</Text>
                  {prof.portfolio_images && prof.portfolio_images.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.portfolioScroll}>
                      {prof.portfolio_images.map((img, idx) => (
                        <Image key={idx} source={{ uri: img }} style={styles.portfolioImage} />
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={styles.portfolioEmpty}>Sin trabajos publicados</Text>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => handleSelectProfessional(prof.id)}
              >
                <Text style={styles.selectButtonText}>Contactar →</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.noMatchButton} onPress={handleNoMatchFound}>
            <Text style={styles.noMatchButtonText}>❌ No encuentro lo que busco</Text>
          </TouchableOpacity>
        </>
      );
    }

    // STEP 4: Información de contacto del invitado
    if (currentStep === 4) {
      return (
        <>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '80%' }]} />
          </View>

          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentStep(3)}>
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>

          <Text style={styles.stepTitle}>Tu información de contacto</Text>
          <Text style={styles.stepSubtitle}>
            Te enviaremos los datos de {selectedProfessional?.display_name} por email
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>📧 ¿Cómo funciona?</Text>
            <Text style={styles.infoBoxText}>
              • Recibirás un email con el contacto del profesional{'\n'}
              • El profesional recibirá tus datos para contactarte{'\n'}
              • También te enviaremos un link para dejar una reseña después{'\n'}
              • ¡No necesitas crear cuenta!
            </Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Tu nombre completo *"
            value={guestName}
            onChangeText={setGuestName}
            placeholderTextColor="#9ca3af"
          />

          <TextInput
            style={styles.input}
            placeholder="Tu email *"
            value={guestEmail}
            onChangeText={setGuestEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#9ca3af"
          />

          <TextInput
            style={styles.input}
            placeholder="Tu teléfono *"
            value={guestPhone}
            onChangeText={setGuestPhone}
            keyboardType="phone-pad"
            placeholderTextColor="#9ca3af"
          />

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmitContactInfo}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Enviando...' : 'Enviar solicitud →'}
            </Text>
          </TouchableOpacity>
        </>
      );
    }

    // STEP 5: Confirmación
    if (currentStep === 5) {
      return (
        <>
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>¡Solicitud enviada!</Text>
            <Text style={styles.successMessage}>
              Te enviamos un email a{'\n'}
              <Text style={styles.successEmail}>{guestEmail}</Text>{'\n\n'}
              Contiene:{'\n'}
              • Los datos de contacto de {selectedProfessional?.display_name}{'\n'}
              • Un link para dejar reseña después del trabajo{'\n\n'}
              ¡Revisá tu casilla de correo!
            </Text>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => {
                // Reiniciar flujo
                setCurrentStep(1);
                setCategory('');
                setDescription('');
                setTiming('');
                setProfessionals([]);
                setSelectedProfessional(null);
                setGuestName('');
                setGuestEmail('');
                setGuestPhone('');
                if (onComplete) onComplete();
              }}
            >
              <Text style={styles.doneButtonText}>Listo</Text>
            </TouchableOpacity>
          </View>
        </>
      );
    }

    return null;
  };

  // Render principal con modales
  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {renderStepContent()}
      </ScrollView>

      {/* Modales de selección de ubicación */}
      {/* Modal Departamento */}
      <Modal
        visible={departmentModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDepartmentModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.selectionModalOverlay}
          activeOpacity={1}
          onPress={() => setDepartmentModalVisible(false)}
        >
          <View style={styles.selectionModalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.selectionModalHeader}>
              <Text style={styles.selectionModalTitle}>Selecciona Departamento</Text>
              <TouchableOpacity onPress={() => setDepartmentModalVisible(false)} style={styles.closeModalButton}>
                <Text style={styles.closeModalButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.selectionScroll}>
              {DEPARTAMENTOS_URUGUAY.map((dep) => (
                <TouchableOpacity
                  key={dep.id}
                  style={[
                    styles.selectionOption,
                    department === dep.id && styles.selectionOptionSelected
                  ]}
                  onPress={() => {
                    setDepartment(dep.id);
                    setDepartmentModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.selectionOptionText,
                    department === dep.id && styles.selectionOptionTextSelected
                  ]}>
                    {dep.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Ciudad */}
      <Modal
        visible={cityModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCityModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.selectionModalOverlay}
          activeOpacity={1}
          onPress={() => setCityModalVisible(false)}
        >
          <View style={styles.selectionModalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.selectionModalHeader}>
              <Text style={styles.selectionModalTitle}>Selecciona Ciudad</Text>
              <TouchableOpacity onPress={() => setCityModalVisible(false)} style={styles.closeModalButton}>
                <Text style={styles.closeModalButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.selectionScroll}>
              {cityList.map((ciudad) => (
                <TouchableOpacity
                  key={ciudad.id}
                  style={[
                    styles.selectionOption,
                    city === ciudad.id && styles.selectionOptionSelected
                  ]}
                  onPress={() => {
                    setCity(ciudad.id);
                    setCityModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.selectionOptionText,
                    city === ciudad.id && styles.selectionOptionTextSelected
                  ]}>
                    {ciudad.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Barrio */}
      <Modal
        visible={barrioModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setBarrioModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.selectionModalOverlay}
          activeOpacity={1}
          onPress={() => setBarrioModalVisible(false)}
        >
          <View style={styles.selectionModalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.selectionModalHeader}>
              <Text style={styles.selectionModalTitle}>Selecciona Barrio</Text>
              <TouchableOpacity onPress={() => setBarrioModalVisible(false)} style={styles.closeModalButton}>
                <Text style={styles.closeModalButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.selectionScroll}>
              {barrioList.map((barr) => (
                <TouchableOpacity
                  key={barr.id}
                  style={[
                    styles.selectionOption,
                    barrio === barr.id && styles.selectionOptionSelected
                  ]}
                  onPress={() => {
                    setBarrio(barr.id);
                    setBarrioModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.selectionOptionText,
                    barrio === barr.id && styles.selectionOptionTextSelected
                  ]}>
                    {barr.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 20,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e3a5f',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 14,
    backgroundColor: 'white',
  },
  categorySelectorText: {
    fontSize: 15,
    color: '#9ca3af',
  },
  categorySelectorTextFilled: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '600',
  },
  arrow: {
    fontSize: 12,
    color: '#6b7280',
  },
  categoriesContainer: {
    marginTop: 12,
  },
  categorySearchInput: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: 'white',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  categoryChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#6366f1',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  categoryChipTextActive: {
    color: '#6366f1',
  },
  textarea: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: 'white',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  input: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: 'white',
    marginBottom: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  nextButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  skipButtonText: {
    color: '#6b7280',
    fontSize: 14,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  timingOptions: {
    gap: 12,
    marginBottom: 24,
  },
  timingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: 'white',
  },
  timingOptionActive: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  timingIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  timingContent: {
    flex: 1,
  },
  timingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  timingLabelActive: {
    color: '#10b981',
  },
  timingSublabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  checkmark: {
    fontSize: 20,
    color: '#10b981',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  professionalCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  professionalHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  professionalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  professionalAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1e3a5f',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  professionalAvatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  professionalInfo: {
    flex: 1,
  },
  professionalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  professionalProfession: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  professionalRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    fontSize: 14,
  },
  professionalRatingCount: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  professionalRate: {
    alignItems: 'flex-end',
  },
  rateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  professionalBio: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  expandButton: {
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginBottom: 8,
  },
  expandButtonText: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '600',
  },
  portfolioSection: {
    marginTop: 8,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  portfolioTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  portfolioScroll: {
    marginTop: 8,
  },
  portfolioImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 8,
  },
  portfolioEmpty: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  selectButton: {
    backgroundColor: '#6366f1',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  noMatchButton: {
    padding: 16,
    borderWidth: 2,
    borderColor: '#fca5a5',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    marginTop: 8,
  },
  noMatchButtonText: {
    color: '#991b1b',
    fontSize: 14,
    fontWeight: '600',
  },
  locationSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 14,
    backgroundColor: 'white',
  },
  locationSelectorText: {
    fontSize: 15,
    color: '#9ca3af',
  },
  locationSelectorTextFilled: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '600',
  },
  selectionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  selectionModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: 20,
  },
  selectionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectionModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  closeModalButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  closeModalButtonText: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: 'bold',
  },
  selectionScroll: {
    maxHeight: 400,
  },
  selectionOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  selectionOptionSelected: {
    backgroundColor: '#eff6ff',
  },
  selectionOptionText: {
    fontSize: 15,
    color: '#475569',
  },
  selectionOptionTextSelected: {
    color: '#1e40af',
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoBoxTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  infoBoxText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  successEmail: {
    fontWeight: 'bold',
    color: '#6366f1',
  },
  doneButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
