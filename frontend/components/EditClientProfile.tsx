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
        AR: [ {id:'artigas', nombre:'Artigas'}, {id:'bella_union', nombre:'Bella Unión'} ],
        CA: [ {id:'canelones', nombre:'Canelones'}, {id:'ciudad_de_la_costa', nombre:'Ciudad de la Costa'} ],
        // ... (resto de ciudades de tu lista original)
        MO: [ {id:'montevideo', nombre:'Montevideo'} ],
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
              <View style={styles.pickerWrapper}>
                <Picker selectedValue={province} onValueChange={setProvince} style={styles.pickerNative}>
                  <Picker.Item label="Seleccionar..." value="" color="#999" />
                  {provinceList.map(p => <Picker.Item key={String(p.id)} label={p.nombre} value={String(p.id)} />)}
                </Picker>
              </View>
            </>
          )}

          {departmentList.length > 0 && (
            <>
              <Text style={styles.label}>Municipio/Partido *</Text>
              <View style={styles.pickerWrapper}>
                <Picker selectedValue={department} onValueChange={setDepartment} style={styles.pickerNative}>
                  <Picker.Item label="Seleccionar..." value="" color="#999" />
                  {departmentList.map(d => <Picker.Item key={String(d.id)} label={d.nombre} value={String(d.id)} />)}
                </Picker>
              </View>
            </>
          )}

          {cityList.length > 0 && (
            <>
              <Text style={styles.label}>Ciudad/Localidad *</Text>
              <View style={styles.pickerWrapper}>
                <Picker selectedValue={city} onValueChange={setCity} style={styles.pickerNative}>
                  <Picker.Item label="Seleccionar..." value="" color="#999" />
                  {cityList.map(c => <Picker.Item key={String(c.id)} label={c.nombre} value={String(c.id)} />)}
                </Picker>
              </View>
            </>
          )}

          <Text style={styles.sectionTitle}>Datos Personales</Text>

          <Text style={styles.label}>Nombre Completo *</Text>
          <TextInput style={styles.inputUnified} value={fullName} onChangeText={setFullName} placeholder="Tu nombre" />

          <Text style={styles.label}>Correo Electrónico (No editable)</Text>
          <TextInput style={[styles.inputUnified, styles.inputDisabled]} value={userEmail} editable={false} />
          <Text style={styles.label}>Cédula / DNI *</Text>
          <TextInput style={styles.inputUnified} value={idNumber} onChangeText={setIdNumber} keyboardType="numeric" />
          <Text style={styles.label}>Cédula / DNI *</Text>
          <TextInput style={styles.inputUnified} value={idNumber} onChangeText={setIdNumber} keyboardType="numeric" />

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
  contentWrapper: { alignItems: 'center', paddingBottom: 40 },
  content: { width: '100%', maxWidth: 600, padding: 20 },
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
  modalOption: { padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  modalOptionText: { fontSize: 16, color: '#1e293b' },
  toast: { position: 'absolute', bottom: 40, left: 20, right: 20, padding: 16, borderRadius: 12, zIndex: 1000, elevation: 5 },
  toastSuccess: { backgroundColor: '#10b981' },
  toastError: { backgroundColor: '#ef4444' },
  toastText: { color: '#fff', textAlign: 'center', fontWeight: '700' }
});