// Declarar la interfaz de props antes de usarla
interface EditProfessionalProfileProps {
  professionalProfile: any;
  userProfile: any; // Necesario para obtener el teléfono
  onSave: () => void;
  onCancel?: () => void;
}

import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView, Modal, Platform, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../src/lib/supabase';
import { getCountriesList, CountryCode, COUNTRIES } from '../utils/countryValidation';
import { getBarriosPorCiudad, Barrio } from '../utils/barrios';

// --- INYECCIÓN DE CSS PARA WEB ---
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    select, input, textarea {
      outline: none !important;
      border: none !important;
      appearance: none !important;
      box-shadow: none !important;
      background-color: transparent !important;
    }
    select::-ms-expand { display: none; }
  `;
  document.head.append(style);
}

// --- FUNCIONES DE FETCH ---
const fetchProvinces = async (country: string) => {
  try {
    if (country === 'AR') {
      const res = await fetch('https://apis.datos.gob.ar/georef/api/provincias?campos=id,nombre');
      const data = await res.json();
      return data.provincias || [];
    }
    if (country === 'UY') {
      return [
        { id: 'AR', nombre: 'Artigas' }, { id: 'CA', nombre: 'Canelones' }, { id: 'CL', nombre: 'Cerro Largo' },
        { id: 'CO', nombre: 'Colonia' }, { id: 'DU', nombre: 'Durazno' }, { id: 'FS', nombre: 'Flores' },
        { id: 'FD', nombre: 'Florida' }, { id: 'LA', nombre: 'Lavalleja' }, { id: 'MA', nombre: 'Maldonado' },
        { id: 'MO', nombre: 'Montevideo' }, { id: 'PA', nombre: 'Paysandú' }, { id: 'RN', nombre: 'Río Negro' },
        { id: 'RV', nombre: 'Rivera' }, { id: 'RO', nombre: 'Rocha' }, { id: 'SA', nombre: 'Salto' },
        { id: 'SJ', nombre: 'San José' }, { id: 'SO', nombre: 'Soriano' }, { id: 'TA', nombre: 'Tacuarembó' },
        { id: 'TT', nombre: 'Treinta y Tres' }
      ];
    }
    return [];
  } catch (e) {
    console.error("Error fetching provinces", e);
    return [];
  }
};

const fetchDepartments = async (country: string, provinceId: string) => {
  try {
    if (country === 'AR' && provinceId) {
      const res = await fetch(`https://apis.datos.gob.ar/georef/api/departamentos?provincia=${provinceId}&campos=id,nombre&max=1000`);
      const data = await res.json();
      return data.departamentos || [];
    }
    return [];
  } catch (e) {
    console.error("Error fetching departments", e);
    return [];
  }
};

const fetchCities = async (country: string, provinceId: string, departmentId: string) => {
  try {
    if (country === 'AR' && provinceId && departmentId) {
      const res = await fetch(`https://apis.datos.gob.ar/georef/api/localidades?provincia=${provinceId}&departamento=${departmentId}&campos=id,nombre&max=1000`);
      const data = await res.json();
      return data.localidades || [];
    }
    
    if (country === 'UY') {
      const ciudadesUY: Record<string, {id:string, nombre:string}[]> = {
        AR: [ {id:'artigas', nombre:'Artigas'}, {id:'bella_union', nombre:'Bella Unión'}, {id:'tomas_gomensoro', nombre:'Tomás Gomensoro'}, {id:'baltasar_brum', nombre:'Baltasar Brum'} ],
        CA: [ {id:'canelones', nombre:'Canelones'}, {id:'ciudad_de_la_costa', nombre:'Ciudad de la Costa'}, {id:'las_piedras', nombre:'Las Piedras'}, {id:'pando', nombre:'Pando'}, {id:'la_paz', nombre:'La Paz'}, {id:'santa_lucia', nombre:'Santa Lucía'}, {id:'progreso', nombre:'Progreso'}, {id:'sauce', nombre:'Sauce'}, {id:'atlantida', nombre:'Atlántida'} ],
        CL: [ {id:'melo', nombre:'Melo'}, {id:'rio_branco', nombre:'Río Branco'}, {id:'fraile_muerto', nombre:'Fraile Muerto'} ],
        CO: [ {id:'colonia_del_sacramento', nombre:'Colonia del Sacramento'}, {id:'carmelo', nombre:'Carmelo'}, {id:'juan_lacaze', nombre:'Juan Lacaze'}, {id:'nueva_helvecia', nombre:'Nueva Helvecia'}, {id:'rosario', nombre:'Rosario'}, {id:'nueva_palmira', nombre:'Nueva Palmira'}, {id:'tarariras', nombre:'Tarariras'} ],
        DU: [ {id:'durazno', nombre:'Durazno'}, {id:'sarandi_yi', nombre:'Sarandí del Yí'}, {id:'villa_del_carmen', nombre:'Villa del Carmen'} ],
        FS: [ {id:'trinidad', nombre:'Trinidad'}, {id:'ismael_cortinas', nombre:'Ismael Cortinas'} ],
        FD: [ {id:'florida', nombre:'Florida'}, {id:'sarandi_grande', nombre:'Sarandí Grande'}, {id:'casupa', nombre:'Casupá'}, {id:'25_de_mayo', nombre:'25 de Mayo'} ],
        LA: [ {id:'minas', nombre:'Minas'}, {id:'jose_pedro_varela', nombre:'José Pedro Varela'}, {id:'solis_de_mataojo', nombre:'Solís de Mataojo'} ],
        MA: [ {id:'maldonado', nombre:'Maldonado'}, {id:'san_carlos', nombre:'San Carlos'}, {id:'punta_del_este', nombre:'Punta del Este'}, {id:'piriapolis', nombre:'Piriápolis'}, {id:'pan_de_azucar', nombre:'Pan de Azúcar'}, {id:'aigua', nombre:'Aiguá'} ],
        MO: [ {id:'montevideo', nombre:'Montevideo'} ],
        PA: [ {id:'paysandu', nombre:'Paysandú'}, {id:'guichon', nombre:'Guichón'}, {id:'quebracho', nombre:'Quebracho'} ],
        RN: [ {id:'fray_bentos', nombre:'Fray Bentos'}, {id:'young', nombre:'Young'}, {id:'nuevo_berlin', nombre:'Nuevo Berlín'} ],
        RV: [ {id:'rivera', nombre:'Rivera'}, {id:'tranqueras', nombre:'Tranqueras'}, {id:'vichadero', nombre:'Vichadero'}, {id:'minas_de_corrales', nombre:'Minas de Corrales'} ],
        RO: [ {id:'rocha', nombre:'Rocha'}, {id:'chuy', nombre:'Chuy'}, {id:'castillos', nombre:'Castillos'}, {id:'lascano', nombre:'Lascano'}, {id:'la_paloma', nombre:'La Paloma'}, {id:'punta_del_diablo', nombre:'Punta del Diablo'} ],
        SA: [ {id:'salto', nombre:'Salto'}, {id:'constitucion', nombre:'Constitución'}, {id:'belen', nombre:'Belén'} ],
        SJ: [ {id:'san_jose_de_mayo', nombre:'San José de Mayo'}, {id:'ciudad_del_plata', nombre:'Ciudad del Plata'}, {id:'libertad', nombre:'Libertad'}, {id:'rodriguez', nombre:'Rodríguez'} ],
        SO: [ {id:'mercedes', nombre:'Mercedes'}, {id:'dolores', nombre:'Dolores'}, {id:'cardona', nombre:'Cardona'}, {id:'palmitas', nombre:'Palmitas'} ],
        TA: [ {id:'tacuarembo', nombre:'Tacuarembó'}, {id:'paso_de_los_toros', nombre:'Paso de los Toros'}, {id:'san_gregorio_de_polanco', nombre:'San Gregorio de Polanco'}, {id:'villa_ansina', nombre:'Villa Ansina'}, {id:'curtina', nombre:'Curtina'} ],
        TT: [ {id:'treinta_y_tres', nombre:'Treinta y Tres'}, {id:'vergara', nombre:'Vergara'}, {id:'santa_clara_de_olimar', nombre:'Santa Clara de Olimar'} ],
      };
      return ciudadesUY[provinceId] || [];
    }
    return [];
  } catch (e) {
    console.error("Error fetching cities", e);
    return [];
  }
};

const PROFESSIONS = [
  'Carpintero', 'Electricista', 'Plomero', 'Pintor', 'Técnico de HVAC',
  'Jardinero', 'Limpieza del Hogar', 'Mantenimiento General', 'Servicios de Mudanza',
  'Cerrajero', 'Albañil', 'Gasista', 'Techista', 'Decorador', 'Control de Plagas',
  'Mecánico', 'Chofer', 'Niñera', 'Cuidador de Adultos', 'Cocinero', 'Panadero',
  'Peluquero', 'Estilista', 'Manicurista', 'Masajista', 'Fotógrafo', 'Diseñador Gráfico',
  'Programador', 'Profesor Particular', 'Entrenador Personal', 'Fumigador', 'Mudanzas',
  'Reparación de Computadoras', 'Reparación de Celulares', 'Reparación de Electrodomésticos',
  'Tapicero', 'Vidriero', 'Herrero', 'Soldador', 'Montador de Muebles', 'Paseador de Perros',
  'Veterinario', 'Animador de Eventos', 'DJ', 'Músico', 'Cantante', 'Traductor', 'Redactor',
  'Community Manager', 'Marketing Digital', 'Otro',
];

// Buscador de profesiones y filtrado de palabras prohibidas (hooks deben ir al inicio del componente)
const forbiddenWords = [
  'prostitución', 'prostitucion', 'escort', 'sexo', 'sexual', 'pornografía', 'pornografia',
  'puta', 'putas', 'puto', 'putos', 'putita', 'putitas', 'putito', 'putitos',
  'drogas', 'narcotráfico', 'narcotrafico', 'venta de drogas', 'marihuana', 'cocaína', 'cocaina',
  'trata de personas', 'tráfico de personas', 'trafico de personas', 'pedofilia', 'infantil',
  'niño', 'niña', 'niños', 'niñas', 'child', 'children', 'abuso', 'abuso infantil',
  'armas', 'venta de armas', 'asesino', 'sicario', 'hacker', 'piratería', 'pirateria',
  'hackeo', 'hack', 'falsificación', 'falsificacion', 'documentos falsos', 'fraude',
  'estafa', 'robos', 'robo', 'hurto', 'secuestro', 'extorsión', 'extorsion',
  'terrorismo', 'terrorista', 'explosivos', 'bomba', 'violación', 'violacion',
  'zoofilia', 'bestialismo', 'incesto', 'necrofília', 'necrofila', 'canibalismo',
  'canibal', 'organos', 'venta de organos', 'tráfico de organos', 'trafico de organos',
  'esclavitud', 'esclavo', 'esclava', 'esclavos', 'esclavas',
];

export default function EditProfessionalProfile({ 
  professionalProfile,
  userProfile,
  onSave, 
  onCancel 
}: EditProfessionalProfileProps) {
  // ...existing code...
  const [professionSearch, setProfessionSearch] = useState('');
  // ...existing code...

  const filteredProfessions = PROFESSIONS.filter(p => {
    if (p === 'Otro') return false;
    return p.toLowerCase().includes(professionSearch.toLowerCase());
  });
  if (!filteredProfessions.includes('Otro')) filteredProfessions.push('Otro');

// ...existing code...
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  // Usar any para compatibilidad multiplataforma (web/node)
  const toastTimeout = useRef<any>(null);
  const [displayName, setDisplayName] = useState(professionalProfile?.display_name || '');
  const [profession, setProfession] = useState(professionalProfile?.profession || '');
  const [customProfession, setCustomProfession] = useState('');
  const [bio, setBio] = useState(professionalProfile?.bio || '');
  // const [zipCode, setZipCode] = useState(professionalProfile?.zip_code || '');
  const [phone, setPhone] = useState(professionalProfile?.phone || userProfile?.phone || ''); // Intentar de professional primero, luego de user
  const [hourlyRate, setHourlyRate] = useState(
    professionalProfile?.hourly_rate ? String(professionalProfile.hourly_rate) : ''
  );
  const [yearsExperience, setYearsExperience] = useState(
    professionalProfile?.years_experience ? String(professionalProfile.years_experience) : ''
  );

  // --- Ubicación - Cargar datos existentes (state se mapea a province) ---
  const [country, setCountry] = useState<CountryCode>(professionalProfile?.country || userProfile?.country || 'UY');
  const [province, setProvince] = useState<string>(professionalProfile?.province || professionalProfile?.state || userProfile?.province || '');
  const [department, setDepartment] = useState<string>(professionalProfile?.department || userProfile?.department || '');
  const [city, setCity] = useState<string>(professionalProfile?.city || userProfile?.city || '');
  const [barrio, setBarrio] = useState<string>(professionalProfile?.barrio || userProfile?.barrio || '');
  
  // Flag para saber si es la carga inicial
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const [provinceList, setProvinceList] = useState<any[]>([]);
  const [departmentList, setDepartmentList] = useState<any[]>([]);
  const [cityList, setCityList] = useState<any[]>([]);
  const [barrioList, setBarrioList] = useState<Barrio[]>([]);

  const [loading, setLoading] = useState(false);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [provinceModalVisible, setProvinceModalVisible] = useState(false);
  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [barrioModalVisible, setBarrioModalVisible] = useState(false);

  // 1. Cargar Provincias: No resetear en carga inicial
  useEffect(() => {
    fetchProvinces(country).then((data) => {
      setProvinceList(data);
      
      // Solo resetear si NO es carga inicial (usuario cambió país manualmente)
      if (!isInitialLoad) {
        setProvince('');
        setDepartment('');
        setCity('');
      }
      setIsInitialLoad(false);
    });
  }, [country]);

  // 2. Cargar Deptos/Ciudades al cambiar Provincia
  useEffect(() => {
    if (province) {
      if (country === 'UY') {
        fetchCities(country, province, '').then((data) => {
          setCityList(data);
          // No resetear city en carga inicial
        });
        setDepartment(''); // UY no usa departamento
      } else {
        fetchDepartments(country, province).then((data) => {
          setDepartmentList(data);
          // No resetear department en carga inicial
        });
      }
    } else {
      setDepartmentList([]);
      setCityList([]);
    }
  }, [province, country]);

  // 3. Cargar Ciudades al cambiar Departamento (AR)
  useEffect(() => {
    if (country !== 'UY' && department && province) {
      fetchCities(country, province, department).then((data) => {
        setCityList(data);
        const isSavedDepartment = professionalProfile?.department === department;
        if (isSavedDepartment && professionalProfile?.city && data.some((c:any) => String(c.id) === String(professionalProfile.city))) {
          setCity(professionalProfile.city);
        } else {
          setCity('');
        }
      });
    } else if (country !== 'UY') {
        setCityList([]);
        setCity('');
    }
  }, [department, province, country]);

  // 4. Cargar Barrios al cambiar Ciudad
  useEffect(() => {
    if (city) {
      const barrios = getBarriosPorCiudad(city);
      setBarrioList(barrios);
      
      // Si es la ciudad guardada y el barrio existe en la lista, mantenerlo
      const isSavedCity = professionalProfile?.city === city;
      if (isSavedCity && professionalProfile?.barrio && barrios.some((b) => String(b.id) === String(professionalProfile.barrio))) {
        setBarrio(professionalProfile.barrio);
      } else if (!isSavedCity) {
        // Solo resetear si cambió la ciudad manualmente
        setBarrio('');
      }
    } else {
      setBarrioList([]);
      setBarrio('');
    }
  }, [city]);

  // Manejar profesión personalizada
  useEffect(() => {
    if (professionalProfile?.profession && !PROFESSIONS.includes(professionalProfile.profession)) {
      setProfession('Otro');
      setCustomProfession(professionalProfile.profession);
    }
  }, [professionalProfile]);

  async function handleSave() {
    const finalProfession = profession === 'Otro' ? customProfession : profession;
    let hasError = false;
    if (!displayName || !finalProfession || !city || !province || (country !== 'UY' && !department)) {
      setToast({ message: 'Por favor completa campos obligatorios', type: 'error' });
      hasError = true;
    }
    if (barrioList.length > 0 && !barrio) {
      setToast({ message: 'El barrio es requerido', type: 'error' });
      hasError = true;
    }
    if (profession === 'Otro' && !customProfession.trim()) {
      setToast({ message: 'Especifica tu profesión', type: 'error' });
      hasError = true;
    }
    if (!phone || phone.trim() === '') {
      setToast({ message: 'El celular es requerido', type: 'error' });
      hasError = true;
    }
    if (hasError) {
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setToast(null), 3000);
      return;
    }
    setLoading(true);
    try {
      // Actualizar tabla professionals
      const { error } = await supabase
        .from('professionals')
        .update({
          display_name: displayName,
          profession: finalProfession.charAt(0).toUpperCase() + finalProfession.slice(1).toLowerCase(),
          bio,
          hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
          years_experience: yearsExperience ? parseInt(yearsExperience) : null,
          country,
          province,
          city,
          barrio: barrio || null,
          department: department || null
        })
        .eq('id', professionalProfile.id);

      if (error) throw error;

      // Actualizar teléfono en tabla users
      const { error: phoneError } = await supabase
        .from('users')
        .update({ phone: phone })
        .eq('id', userProfile.id);

      if (phoneError) throw phoneError;

      setToast({ message: '¡Perfil actualizado exitosamente!', type: 'success' });
      setTimeout(() => {
        onSave();
      }, 1200);
    } catch (error: any) {
      setToast({ message: error.message || 'Error desconocido', type: 'error' });
    } finally {
      setLoading(false);
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setToast(null), 3000);
    }
  }

  // Helper para renderizar Toast
  const renderToast = () => {
    if (!toast) return null;
    return (
      <View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
        <Text style={styles.toastText}>{toast.message}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentWrapper}>
        <View style={styles.content}>
          <Text style={styles.title}>Editar Perfil Profesional</Text>

          <Text style={styles.label}>Nombre para Mostrar *</Text>
          <TextInput
            style={styles.inputUnified}
            placeholder="Como te verán los clientes"
            value={displayName}
            onChangeText={setDisplayName}
          />


          <Text style={styles.label}>Profesión *</Text>
          {/* Buscador de profesiones */}
          <TextInput
            style={[styles.inputUnified, { marginBottom: 8 }]}
            placeholder="Buscar profesión..."
            placeholderTextColor="#9ca3af"
            value={professionSearch}
            onChangeText={setProfessionSearch}
          />
          <View style={styles.professionContainer}>
            {filteredProfessions.map((p) => (
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
                style={styles.inputUnified}
                placeholder="Ingresa tu profesión"
                value={customProfession}
                onChangeText={text => {
                  setCustomProfession(text);
                  // Validar palabras prohibidas
                  const lower = text.trim().toLowerCase();
                  if (forbiddenWords.some(word => lower.includes(word))) {
                    setToast({ message: 'El servicio ingresado no está permitido en la plataforma.', type: 'error' });
                    if (toastTimeout.current) clearTimeout(toastTimeout.current);
                    toastTimeout.current = setTimeout(() => setToast(null), 3000);
                  }
                }}
              />
            </>
          )}

          {/* --- SECCIÓN DE UBICACIÓN --- */}
          <Text style={styles.sectionTitle}>Ubicación</Text>
          
          <Text style={styles.label}>País *</Text>
          <TouchableOpacity style={styles.customPickerTrigger} onPress={() => setCountryModalVisible(true)}>
            <Text style={styles.pickerTriggerText}>
              {getCountriesList().find(c => c.code === country)?.flag} {COUNTRIES[country]?.name || 'Selecciona un país'}
            </Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>

          {/* Provincia / Departamento */}
          {provinceList.length > 0 && (
            <>
              <Text style={styles.label}>{country === 'UY' ? 'Departamento *' : 'Provincia/Estado *'}</Text>
              <TouchableOpacity style={styles.customPickerTrigger} onPress={() => setProvinceModalVisible(true)}>
                <Text style={styles.pickerTriggerText}>
                  {provinceList.find(p => String(p.id) === String(province))?.nombre || 'Selecciona una opción'}
                </Text>
                <Text style={styles.pickerArrow}>▼</Text>
              </TouchableOpacity>
              <Modal visible={provinceModalVisible} transparent animationType="fade" onRequestClose={() => setProvinceModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setProvinceModalVisible(false)}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{country === 'UY' ? 'Selecciona un departamento' : 'Selecciona una provincia/estado'}</Text>
                    <ScrollView style={styles.modalScroll}>
                      {provinceList.map((p) => {
                        const selected = String(p.id) === String(province);
                        return (
                          <TouchableOpacity
                            key={String(p.id)}
                            style={[styles.modalOption, selected && styles.modalOptionSelected]}
                            onPress={() => {
                              setProvince(String(p.id));
                              setDepartment('');
                              setCity('');
                              setProvinceModalVisible(false);
                            }}
                          >
                            <Text style={[styles.modalOptionText, selected && styles.modalOptionTextSelected]}>{p.nombre}</Text>
                            {selected && <Text style={styles.checkmark}>✓</Text>}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                    <TouchableOpacity onPress={() => setProvinceModalVisible(false)} style={styles.modalCloseBtn}>
                      <Text style={styles.modalCloseBtnText}>Cerrar</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Modal>
            </>
          )}

          {/* Municipio (AR) */}
          {departmentList.length > 0 && (
            <>
              <Text style={styles.label}>Municipio/Localidad *</Text>
              <TouchableOpacity style={styles.customPickerTrigger} onPress={() => setDepartmentModalVisible(true)}>
                <Text style={styles.pickerTriggerText}>
                  {departmentList.find(d => String(d.id) === String(department))?.nombre || 'Selecciona una opción'}
                </Text>
                <Text style={styles.pickerArrow}>▼</Text>
              </TouchableOpacity>
              <Modal visible={departmentModalVisible} transparent animationType="fade" onRequestClose={() => setDepartmentModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDepartmentModalVisible(false)}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Selecciona un municipio/localidad</Text>
                    <ScrollView style={styles.modalScroll}>
                      {departmentList.map((d) => {
                        const selected = String(d.id) === String(department);
                        return (
                          <TouchableOpacity
                            key={String(d.id)}
                            style={[styles.modalOption, selected && styles.modalOptionSelected]}
                            onPress={() => {
                              setDepartment(String(d.id));
                              setCity('');
                              setDepartmentModalVisible(false);
                            }}
                          >
                            <Text style={[styles.modalOptionText, selected && styles.modalOptionTextSelected]}>{d.nombre}</Text>
                            {selected && <Text style={styles.checkmark}>✓</Text>}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                    <TouchableOpacity onPress={() => setDepartmentModalVisible(false)} style={styles.modalCloseBtn}>
                      <Text style={styles.modalCloseBtnText}>Cerrar</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Modal>
            </>
          )}

          {/* Ciudad */}
          {cityList.length > 0 && (
            <>
              <Text style={styles.label}>Ciudad *</Text>
              <TouchableOpacity style={styles.customPickerTrigger} onPress={() => setCityModalVisible(true)}>
                <Text style={styles.pickerTriggerText}>
                  {cityList.find(c => String(c.id) === String(city))?.nombre || 'Selecciona una ciudad'}
                </Text>
                <Text style={styles.pickerArrow}>▼</Text>
              </TouchableOpacity>
              <Modal visible={cityModalVisible} transparent animationType="fade" onRequestClose={() => setCityModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCityModalVisible(false)}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Selecciona una ciudad</Text>
                    <ScrollView style={styles.modalScroll}>
                      {cityList.map((c) => {
                        const selected = String(c.id) === String(city);
                        return (
                          <TouchableOpacity
                            key={String(c.id)}
                            style={[styles.modalOption, selected && styles.modalOptionSelected]}
                            onPress={() => {
                              setCity(String(c.id));
                              setCityModalVisible(false);
                            }}
                          >
                            <Text style={[styles.modalOptionText, selected && styles.modalOptionTextSelected]}>{c.nombre}</Text>
                            {selected && <Text style={styles.checkmark}>✓</Text>}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                    <TouchableOpacity onPress={() => setCityModalVisible(false)} style={styles.modalCloseBtn}>
                      <Text style={styles.modalCloseBtnText}>Cerrar</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Modal>
            </>
          )}
          
          {/* Barrio */}
          {barrioList.length > 0 && (
            <>
              <Text style={styles.label}>Barrio *</Text>
              <TouchableOpacity style={styles.customPickerTrigger} onPress={() => setBarrioModalVisible(true)}>
                <Text style={styles.pickerTriggerText}>
                  {barrioList.find(b => String(b.id) === String(barrio))?.nombre || 'Selecciona barrio'}
                </Text>
                <Text style={styles.pickerArrow}>▼</Text>
              </TouchableOpacity>
              <Modal visible={barrioModalVisible} transparent animationType="fade" onRequestClose={() => setBarrioModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setBarrioModalVisible(false)}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Selecciona un barrio</Text>
                    <ScrollView style={styles.modalScroll}>
                      {barrioList.map((b) => {
                        const selected = String(b.id) === String(barrio);
                        return (
                          <TouchableOpacity
                            key={String(b.id)}
                            style={[styles.modalOption, selected && styles.modalOptionSelected]}
                            onPress={() => {
                              setBarrio(String(b.id));
                              setBarrioModalVisible(false);
                            }}
                          >
                            <Text style={[styles.modalOptionText, selected && styles.modalOptionTextSelected]}>{b.nombre}</Text>
                            {selected && <Text style={styles.checkmark}>✓</Text>}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                    <TouchableOpacity onPress={() => setBarrioModalVisible(false)} style={styles.modalCloseBtn}>
                      <Text style={styles.modalCloseBtnText}>Cerrar</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Modal>
            </>
          )}


          <Text style={styles.sectionTitle}>Detalles</Text>

          <Text style={styles.label}>Biografía</Text>
          <TextInput
            style={[styles.inputUnified, { height: 100, textAlignVertical: 'top' }]}
            placeholder="Describe tu experiencia y servicios..."
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Celular *</Text>
          <TextInput
            style={styles.inputUnified}
            placeholder="Ej: 099 123 456"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />


          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tarifa por Hora ($) <Text style={{ color: '#9ca3af', fontWeight: '400', fontSize: 13 }}>(opcional)</Text></Text>
              <TextInput
                style={styles.inputUnified}
                placeholder="Ej: 1500"
                value={hourlyRate}
                onChangeText={setHourlyRate}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Años de Experiencia</Text>
              <TextInput
                style={styles.inputUnified}
                placeholder="5"
                value={yearsExperience}
                onChangeText={setYearsExperience}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.buttonRow}>
            {onCancel && (
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                 <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Guardar Cambios</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modal País */}
      <Modal visible={countryModalVisible} transparent animationType="fade" onRequestClose={() => setCountryModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCountryModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona tu país</Text>
            <ScrollView style={styles.modalScroll}>
              {getCountriesList().map((c) => {
                const selected = c.code === country;
                return (
                  <TouchableOpacity
                    key={c.code}
                    style={[styles.modalOption, selected && styles.modalOptionSelected]}
                    onPress={() => { setCountry(c.code as CountryCode); setCountryModalVisible(false); }}
                  >
                    <Text style={[styles.modalOptionText, selected && styles.modalOptionTextSelected]}>{c.flag} {c.name}</Text>
                    {selected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity onPress={() => setCountryModalVisible(false)} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Render Toast (Position Absolute para que flote) */}
      {renderToast()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', position: 'relative' },
  contentWrapper: { alignItems: 'center', paddingHorizontal: 16, paddingBottom: 24 },
  content: { width: '100%', maxWidth: 900, padding: 20 },
  
  // ESTILOS UNIFICADOS
  inputUnified: { 
    backgroundColor: '#fff',
    borderWidth: 1.5, 
    borderColor: '#e5e7eb', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 8, 
    fontSize: 16,
    color: '#1f2937',
  },
  
  pickerWrapper: { 
    backgroundColor: '#fff',
    borderWidth: 1.5, 
    borderColor: '#e5e7eb', 
    borderRadius: 12, 
    marginBottom: 14,
    height: 58,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pickerNative: { width: '100%', height: 50, color: '#1f2937', backgroundColor: 'transparent', borderWidth: 0 },
  
  customPickerTrigger: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fff', height: 58, alignItems: 'center', marginBottom: 14 },
  pickerTriggerText: { fontSize: 16, color: '#1f2937' },
  pickerArrow: { color: '#9ca3af', fontSize: 12 },

  // Resto de estilos
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 16, marginTop: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 16 },
  row: { flexDirection: 'row', gap: 12 },
  inputGroup: { flex: 1 },
  
  // Chips de Profesión
  professionContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  professionChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f9f9f9' },
  professionChipActive: { borderColor: '#1e3a5f', backgroundColor: '#1e3a5f' },
  professionText: { color: '#666', fontSize: 14 },
  professionTextActive: { color: '#fff', fontWeight: '600' },

  // Botones
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 32, marginBottom: 40 },
  button: { flex: 1, padding: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  saveButton: { backgroundColor: '#1e3a5f' },
  cancelButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  cancelButtonText: { color: '#666', fontSize: 18, fontWeight: '600' },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', maxHeight: '70%', backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 16, textAlign: 'center' },
  modalScroll: { maxHeight: 400 },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, marginBottom: 8, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb' },
  modalOptionSelected: { backgroundColor: '#e0e7ff', borderColor: '#6366f1' },
  modalOptionText: { fontSize: 15, color: '#374151', fontWeight: '500' },
  modalOptionTextSelected: { color: '#6366f1', fontWeight: '600' },
  checkmark: { fontSize: 18, color: '#6366f1', fontWeight: 'bold' },
  modalCloseBtn: { marginTop: 16, padding: 12 },
  modalCloseBtnText: { textAlign: 'center', color: '#6b7280', fontWeight: '600' },

  // --- ESTILOS AGREGADOS PARA TOAST ---
  toast: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 8,
    zIndex: 1000, // Importante para que aparezca sobre todo
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastSuccess: {
    backgroundColor: '#10B981', // Verde
  },
  toastError: {
    backgroundColor: '#EF4444', // Rojo
  },
  toastText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center'
  }
});