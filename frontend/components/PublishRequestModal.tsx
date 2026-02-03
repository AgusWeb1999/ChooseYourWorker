import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getBarriosPorCiudad, Barrio } from '../utils/barrios';
import { DEPARTAMENTOS_URUGUAY, getCiudadesPorDepartamento } from '../utils/uruguayData';

interface PublishRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  'Sanitario',
  'Electricista',
  'Plomero',
  'Albañil',
  'Pintor',
  'Carpintero',
  'Mecánico',
  'Jardinero',
  'Limpieza',
  'Mudanzas',
  'Cerrajero',
  'Gasista',
  'Techista',
  'Decorador',
  'Control de Plagas',
  'Chofer',
  'Niñera',
  'Cuidador',
  'Cocinero',
  'Peluquero',
  'Masajista',
  'Fotógrafo',
  'Diseñador Gráfico',
  'Programador',
  'Profesor Particular',
  'Entrenador Personal',
  'Otro',
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

export default function PublishRequestModal({ visible, onClose, onSuccess }: PublishRequestModalProps) {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  
  // Estados de ubicación (Uruguay)
  const [department, setDepartment] = useState('');
  const [city, setCity] = useState('');
  const [barrio, setBarrio] = useState('');
  const [cityList, setCityList] = useState<{id:string, nombre:string}[]>([]);
  const [barrioList, setBarrioList] = useState<Barrio[]>([]);
  
  // Modales de ubicación
  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [barrioModalVisible, setBarrioModalVisible] = useState(false);
  
  const { userProfile, user } = useAuth();
  const { showToast } = useToast();

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

  useEffect(() => {
    if (visible) {
      // Pre-cargar ubicación del perfil si existe
      if (userProfile?.department) {
        setDepartment(userProfile.department);
      }
      if (userProfile?.city) {
        setCity(userProfile.city);
      }
      if (userProfile?.barrio) {
        setBarrio(userProfile.barrio);
      }
    } else {
      // Limpiar form al cerrar
      resetForm();
    }
  }, [visible, userProfile]);

  function resetForm() {
    setCategory('');
    setDescription('');
    setDepartment(userProfile?.department || '');
    setCity(userProfile?.city || '');
    setBarrio(userProfile?.barrio || '');
    setShowCategories(false);
    setCategorySearch('');
  }

  async function handlePublish() {
    // Validaciones
    if (!category) {
      showToast('Por favor selecciona qué tipo de profesional necesitas', 'error');
      return;
    }

    if (!description || description.trim().length < 20) {
      showToast('La descripción debe tener al menos 20 caracteres', 'error');
      return;
    }

    if (!department || !city) {
      showToast('Por favor selecciona departamento y ciudad', 'error');
      return;
    }

    setLoading(true);

    try {
      if (!user?.id) {
        showToast('Debes estar autenticado para publicar una solicitud', 'error');
        setLoading(false);
        return;
      }

      // Verificar que el usuario exista en la tabla users
      let { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      // Si no existe, crearlo
      if (!existingUser && !userCheckError) {
        console.log('Usuario no existe en tabla users, creándolo...');
        const { error: createError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            auth_uid: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
            is_professional: false,
            is_active: true,
          });
        
        if (createError) {
          console.error('Error creando usuario:', createError);
          showToast('Error al verificar tu cuenta. Intenta de nuevo.', 'error');
          setLoading(false);
          return;
        }
      }

      // Construir service_location desde los selectores
      const departmentName = DEPARTAMENTOS_URUGUAY.find(d => d.id === department)?.nombre || department;
      const cityName = cityList.find(c => c.id === city)?.nombre || city;
      const barrioName = barrio ? (barrioList.find(b => b.id === barrio)?.nombre || barrio) : '';
      const serviceLocation = `${cityName}, ${departmentName}${barrioName ? ', ' + barrioName : ''}`;

      const { data, error} = await supabase
        .from('hires')
        .insert({
          client_id: user.id,
          professional_id: null, // Sin profesional asignado
          status: 'pending',
          service_category: category,
          service_description: description.trim(),
          service_location: serviceLocation,
          proposal_message: description.trim(), // Por compatibilidad
        })
        .select()
        .single();

      if (error) throw error;

      showToast('✅ Solicitud publicada. Te notificaremos cuando alguien responda.', 'success');
      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al publicar solicitud:', error);
      showToast('No se pudo publicar la solicitud. Intenta de nuevo.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function getCategoryIcon(cat: string): string {
    const icons: { [key: string]: string } = {
      'Sanitario': '🚰',
      'Electricista': '⚡',
      'Plomero': '🔧',
      'Albañil': '🏗️',
      'Pintor': '🎨',
      'Carpintero': '🪵',
      'Mecánico': '🔩',
      'Jardinero': '🌱',
      'Limpieza': '🧹',
      'Mudanzas': '📦',
      'Cerrajero': '🔑',
      'Gasista': '🔥',
      'Techista': '🏠',
      'Decorador': '🎭',
      'Control de Plagas': '🐛',
      'Chofer': '🚗',
      'Niñera': '👶',
      'Cuidador': '🧓',
      'Cocinero': '👨‍🍳',
      'Peluquero': '💇',
      'Masajista': '💆',
      'Fotógrafo': '📸',
      'Diseñador Gráfico': '🎨',
      'Programador': '💻',
      'Profesor Particular': '📚',
      'Entrenador Personal': '🏋️',
      'Otro': '🛠️',
    };
    return icons[cat] || '🛠️';
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📢 Publicar Solicitud</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Info */}
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  💡 Los profesionales verán tu solicitud y podrán contactarte directamente
                </Text>
              </View>

              {/* Categoría */}
              <Text style={styles.label}>¿Qué profesional necesitas? *</Text>
              <TouchableOpacity
                style={styles.categorySelector}
                onPress={() => setShowCategories(!showCategories)}
              >
                <Text style={[styles.categorySelectorText, !category && styles.placeholder]}>
                  {category ? `${getCategoryIcon(category)} ${category}` : 'Selecciona una categoría'}
                </Text>
                <Text style={styles.dropdownIcon}>{showCategories ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {showCategories && (
                <View style={styles.categoriesContainer}>
                  <TextInput
                    style={styles.categorySearchInput}
                    placeholder="🔍 Buscar categoría..."
                    placeholderTextColor="#94a3b8"
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
                      style={[
                        styles.categoryChip,
                        category === cat && styles.categoryChipSelected
                      ]}
                      onPress={() => {
                        setCategory(cat);
                        setShowCategories(false);
                        setCategorySearch(''); // Resetear búsqueda
                      }}
                    >
                      <Text style={styles.categoryChipIcon}>{getCategoryIcon(cat)}</Text>
                      <Text
                        style={[
                          styles.categoryChipText,
                          category === cat && styles.categoryChipTextSelected
                        ]}
                        numberOfLines={1}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  </View>
                </View>
              )}

              {/* Descripción */}
              <Text style={styles.label}>Describe qué necesitas *</Text>
              <Text style={styles.hint}>Mínimo 20 caracteres</Text>
              <TextInput
                style={styles.textArea}
                placeholder={category && CATEGORY_PLACEHOLDERS[category] ? CATEGORY_PLACEHOLDERS[category] : "Describe con detalle qué necesitas y cualquier información relevante..."}
                placeholderTextColor="#94a3b8"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{description.length}/500</Text>

              {/* Ubicación - Selectores */}
              <Text style={styles.label}>¿Dónde necesitas el servicio? *</Text>
              
              {/* Departamento */}
              <TouchableOpacity
                style={styles.locationSelector}
                onPress={() => setDepartmentModalVisible(true)}
              >
                <Text style={[styles.locationSelectorText, !department && styles.placeholder]}>
                  {department 
                    ? DEPARTAMENTOS_URUGUAY.find(d => d.id === department)?.nombre || department
                    : 'Selecciona departamento'}
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>

              {/* Ciudad */}
              {department && (
                <TouchableOpacity
                  style={[styles.locationSelector, { marginTop: 8 }]}
                  onPress={() => setCityModalVisible(true)}
                  disabled={!department}
                >
                  <Text style={[styles.locationSelectorText, !city && styles.placeholder]}>
                    {city 
                      ? cityList.find(c => c.id === city)?.nombre || city
                      : 'Selecciona ciudad'}
                  </Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </TouchableOpacity>
              )}

              {/* Barrio */}
              {city && barrioList.length > 0 && (
                <TouchableOpacity
                  style={[styles.locationSelector, { marginTop: 8 }]}
                  onPress={() => setBarrioModalVisible(true)}
                >
                  <Text style={[styles.locationSelectorText, !barrio && styles.placeholder]}>
                    {barrio 
                      ? barrioList.find(b => b.id === barrio)?.nombre || barrio
                      : 'Selecciona barrio (opcional)'}
                  </Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </TouchableOpacity>
              )}

              {/* Botones */}
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.publishButton, loading && styles.publishButtonDisabled]}
                  onPress={handlePublish}
                  disabled={loading}
                >
                  <Text style={styles.publishButtonText}>
                    {loading ? 'Publicando...' : '✅ Publicar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Modal Departamento */}
      <Modal
        visible={departmentModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDepartmentModalVisible(false)}
      >
        <View style={styles.selectionModalOverlay}>
          <View style={styles.selectionModalContent}>
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
        </View>
      </Modal>

      {/* Modal Ciudad */}
      <Modal
        visible={cityModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCityModalVisible(false)}
      >
        <View style={styles.selectionModalOverlay}>
          <View style={styles.selectionModalContent}>
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
        </View>
      </Modal>

      {/* Modal Barrio */}
      <Modal
        visible={barrioModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setBarrioModalVisible(false)}
      >
        <View style={styles.selectionModalOverlay}>
          <View style={styles.selectionModalContent}>
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
          </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#64748b',
  },
  scrollView: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  categorySelectorText: {
    fontSize: 15,
    color: '#1e293b',
  },
  placeholder: {
    color: '#94a3b8',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#64748b',
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categorySearchInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 100,
  },
  categoryChipSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  categoryChipIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#1e40af',
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1e293b',
    minHeight: 120,
    marginBottom: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1e293b',
    marginBottom: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  publishButton: {
    flex: 2,
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  publishButtonDisabled: {
    opacity: 0.6,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  locationSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
  },
  locationSelectorText: {
    fontSize: 15,
    color: '#1e293b',
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
});
