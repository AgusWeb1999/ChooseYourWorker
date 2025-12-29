import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  Modal, 
  ActivityIndicator, 
  Platform 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../src/lib/supabase';
import { getCountriesList, CountryCode, COUNTRIES } from '../utils/countryValidation';

// --- INYECCIÓN DE CSS PARA WEB (Elimina el foco azul y bordes extra) ---
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    select, input, textarea {
      outline: none !important;
      box-shadow: none !important;
    }
  `;
  document.head.append(style);
}

// --- FUNCIONES DE FETCH ---
const fetchProvinces = async (country: string) => {
  try {
    if (country === 'AR') {
      const res = await fetch('https://apis.datos.gob.ar/georef/api/provincias?campos=id,nombre');
      const json = await res.json();
      return json.provincias || [];
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
    console.error('Error fetching provinces', e);
    return [];
  }
};

const fetchDepartments = async (country: string, provinceId: string) => {
  try {
    if (country === 'AR' && provinceId) {
      const res = await fetch(`https://apis.datos.gob.ar/georef/api/departamentos?provincia=${provinceId}&campos=id,nombre&max=1000`);
      const json = await res.json();
      return json.departamentos || [];
    }
    return [];
  } catch (e) {
    console.error('Error fetching departments', e);
    return [];
  }
};

const fetchCities = async (country: string, provinceId: string, departmentId: string) => {
  try {
    if (country === 'AR' && provinceId && departmentId) {
      const res = await fetch(`https://apis.datos.gob.ar/georef/api/localidades?provincia=${provinceId}&departamento=${departmentId}&campos=id,nombre&max=1000`);
      const json = await res.json();
      return json.localidades || [];
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
    console.error('Error fetching cities', e);
    return [];
  }
};

export default function EditUserProfile({ userProfile, userEmail, onSave, onCancel }: any) {
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const toastTimeout = useRef<any>(null);
  
  // Datos Personales
  const [fullName, setFullName] = useState(userProfile?.full_name || '');
  const [dateOfBirth, setDateOfBirth] = useState(userProfile?.date_of_birth || '');
  const [idNumber, setIdNumber] = useState(userProfile?.id_number || '');
  const [zipCode, setZipCode] = useState(userProfile?.zip_code || '');
  
  // Ubicación
  const [country, setCountry] = useState<CountryCode>(userProfile?.country || 'UY');
  const [province, setProvince] = useState<string>(userProfile?.province || '');
  const [department, setDepartment] = useState<string>(userProfile?.department || '');
  const [city, setCity] = useState<string>(userProfile?.city || '');
  
  const [provinceList, setProvinceList] = useState<any[]>([]);
  const [departmentList, setDepartmentList] = useState<any[]>([]);
  const [cityList, setCityList] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [provinceModalVisible, setProvinceModalVisible] = useState(false);
  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  // 1. Cargar provincias
  useEffect(() => {
    const loadProvinces = async () => {
      const provinces = await fetchProvinces(country);
      setProvinceList(provinces);
      // Solo mantenemos la provincia si el país es el que ya estaba guardado
      if (userProfile?.country === country && provinces.some((p:any) => String(p.id) === String(userProfile.province))) {
        setProvince(userProfile.province);
      } else {
        setProvince(''); setDepartment(''); setCity('');
      }
    };
    loadProvinces();
  }, [country]);

  // 2. Cargar departamentos (AR) o Ciudades (UY)
  useEffect(() => {
    setDepartmentList([]); 
    setCityList([]);
    if (province) {
      if (country === 'UY') {
        fetchCities(country, province, '').then((cities) => {
          setCityList(cities);
          if (userProfile?.province === province && userProfile?.city && cities.some((c:any) => String(c.id) === String(userProfile.city))) {
            setCity(userProfile.city);
          } else { setCity(''); }
        });
      } else {
        fetchDepartments(country, province).then((departments) => {
          setDepartmentList(departments);
          if (userProfile?.province === province && userProfile?.department && departments.some((d:any) => String(d.id) === String(userProfile.department))) {
            setDepartment(userProfile.department);
          } else { setDepartment(''); setCity(''); }
        });
      }
    }
  }, [province, country]);

  // 3. Cargar ciudades (AR) al cambiar departamento
  useEffect(() => {
    if (country === 'AR' && department && province) {
      fetchCities(country, province, department).then((cities) => {
        setCityList(cities);
        if (userProfile?.department === department && userProfile?.city && cities.some((c:any) => String(c.id) === String(userProfile.city))) {
          setCity(userProfile.city);
        } else { setCity(''); }
      });
    }
  }, [department]);

  async function handleSave() {
    if (!fullName || !idNumber || !province || !city) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          date_of_birth: dateOfBirth || null,
          id_number: idNumber,
          zip_code: zipCode || null,
          country: country || null,
          province: province || null,
          city: city || null,
          department: department || null
        })
        .eq('id', userProfile.id);

      if (error) throw error;

      setToast({ message: '¡Perfil actualizado con éxito!', type: 'success' });
      if (onSave) setTimeout(() => onSave(), 1500);
    } catch (error: any) {
      setToast({ message: error.message || 'Error al guardar cambios', type: 'error' });
    } finally {
      setLoading(false);
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setToast(null), 3000);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentWrapper}>
        <View style={styles.content}>
          <Text style={styles.title}>Editar Perfil</Text>
          <Text style={styles.subtitle}>Actualiza tu información de contacto y ubicación</Text>

          <Text style={styles.sectionTitle}>Ubicación</Text>

          <Text style={styles.label}>País *</Text>
          <TouchableOpacity style={styles.customPickerTrigger} onPress={() => setCountryModalVisible(true)}>
            <Text style={styles.pickerTriggerText}>
              {getCountriesList().find(c => c.code === country)?.flag} {COUNTRIES[country]?.name || 'Selecciona un país'}
            </Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>

          {provinceList.length > 0 && (
            <>
              <Text style={styles.label}>{country === 'UY' ? 'Departamento *' : 'Provincia *'}</Text>
              <TouchableOpacity style={styles.customPickerTrigger} onPress={() => setProvinceModalVisible(true)}>
                <Text style={styles.pickerTriggerText}>
                  {provinceList.find(p => String(p.id) === String(province))?.nombre || 'Seleccionar...'}
                </Text>
                <Text style={styles.pickerArrow}>▼</Text>
              </TouchableOpacity>
              <Modal visible={provinceModalVisible} transparent animationType="fade" onRequestClose={() => setProvinceModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setProvinceModalVisible(false)}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{country === 'UY' ? 'Selecciona un departamento' : 'Selecciona una provincia'}</Text>
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

          {departmentList.length > 0 && (
            <>
              <Text style={styles.label}>Municipio/Partido *</Text>
              <TouchableOpacity style={styles.customPickerTrigger} onPress={() => setDepartmentModalVisible(true)}>
                <Text style={styles.pickerTriggerText}>
                  {departmentList.find(d => String(d.id) === String(department))?.nombre || 'Seleccionar...'}
                </Text>
                <Text style={styles.pickerArrow}>▼</Text>
              </TouchableOpacity>
              <Modal visible={departmentModalVisible} transparent animationType="fade" onRequestClose={() => setDepartmentModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDepartmentModalVisible(false)}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Selecciona un municipio/partido</Text>
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

          {cityList.length > 0 && (
            <>
              <Text style={styles.label}>Ciudad/Localidad *</Text>
              <TouchableOpacity style={styles.customPickerTrigger} onPress={() => setCityModalVisible(true)}>
                <Text style={styles.pickerTriggerText}>
                  {cityList.find(c => String(c.id) === String(city))?.nombre || 'Seleccionar...'}
                </Text>
                <Text style={styles.pickerArrow}>▼</Text>
              </TouchableOpacity>
              <Modal visible={cityModalVisible} transparent animationType="fade" onRequestClose={() => setCityModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCityModalVisible(false)}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Selecciona una ciudad/localidad</Text>
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

          <Text style={styles.sectionTitle}>Datos Personales</Text>

          <Text style={styles.label}>Nombre Completo *</Text>
          <TextInput style={styles.inputUnified} value={fullName} onChangeText={setFullName} placeholder="Tu nombre" />

          <Text style={styles.label}>Correo Electrónico (No editable)</Text>
          <TextInput style={[styles.inputUnified, styles.inputDisabled]} value={userEmail} editable={false} />
          <Text style={styles.label}>Cédula / DNI *</Text>
          <TextInput style={styles.inputUnified} value={idNumber} onChangeText={setIdNumber} keyboardType="numeric" />
          <Text style={styles.label}>Celular *</Text>
          <TextInput style={styles.inputUnified} value={userProfile?.phone || ''} onChangeText={() => {}} keyboardType="phone-pad" editable={false} />

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
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Guardar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* MODAL DE PAÍS */}
      <Modal visible={countryModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCountryModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona tu país</Text>
            <ScrollView>
              {getCountriesList().map((c) => (
                <TouchableOpacity 
                  key={c.code} 
                  style={[styles.modalOption, country === c.code && {backgroundColor: '#f0f7ff'}]} 
                  onPress={() => { setCountry(c.code as CountryCode); setCountryModalVisible(false); }}
                >
                  <Text style={styles.modalOptionText}>{c.flag} {c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  contentWrapper: { alignItems: 'center', paddingBottom: 40, flexGrow: 1, justifyContent: 'center' },
  content: { width: '100%', maxWidth: 820, padding: 20, alignSelf: 'center', backgroundColor: '#fff', borderRadius: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  title: { fontSize: 24, fontWeight: '800', color: '#1e3a8a', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 20, marginBottom: 12, color: '#1e3a8a', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 10 },
  inputUnified: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1e293b',
  },
  inputDisabled: { backgroundColor: '#f1f5f9', color: '#94a3b8' },
  pickerWrapper: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    height: 55,
    justifyContent: 'center',
    marginBottom: 4,
    overflow: 'hidden'
  },
  pickerNative: { width: '100%', backgroundColor: 'transparent' },
  customPickerTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  pickerTriggerText: { fontSize: 16, color: '#1e293b' },
  pickerArrow: { color: '#94a3b8', fontSize: 12 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 30 },
  button: { flex: 1, height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  saveButton: { backgroundColor: '#1e3a8a' },
  cancelButton: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelButtonText: { color: '#64748b', fontSize: 16, fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 20, padding: 20, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15, textAlign: 'center' },
  modalScroll: { maxHeight: 400 },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, marginBottom: 8, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb' },
  modalOptionSelected: { backgroundColor: '#e0e7ff', borderColor: '#6366f1' },
  modalOptionText: { fontSize: 15, color: '#374151', fontWeight: '500' },
  modalOptionTextSelected: { color: '#6366f1', fontWeight: '600' },
  checkmark: { fontSize: 18, color: '#6366f1', fontWeight: 'bold' },
  modalCloseBtn: { marginTop: 16, padding: 12 },
  modalCloseBtnText: { textAlign: 'center', color: '#6b7280', fontWeight: '600' },
  toast: { position: 'absolute', bottom: 40, left: 20, right: 20, padding: 16, borderRadius: 12, zIndex: 1000, elevation: 5 },
  toastSuccess: { backgroundColor: '#10b981' },
  toastError: { backgroundColor: '#ef4444' },
  toastText: { color: '#fff', textAlign: 'center', fontWeight: '700' }
});