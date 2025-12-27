import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView, Modal, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../src/lib/supabase';
import { validatePhone, validateId, normalizePhone, normalizeId, getCountriesList, CountryCode, COUNTRIES } from '../utils/countryValidation';

// --- INYECCIÓN DE CSS PARA WEB ---
// Esto maneja los bordes negros sin causar errores de TypeScript en el StyleSheet
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
    /* Clase para corregir el Picker en web */
    .r-picker-reset {
      border-width: 0px !important;
    }
  `;
  document.head.append(style);
}

// --- FUNCIONES DE FETCH ---
const fetchProvinces = async (country: string) => {
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
};

const fetchDepartments = async (country: string, provinceId: string) => {
  if (country === 'AR') {
    const res = await fetch(`https://apis.datos.gob.ar/georef/api/departamentos?provincia=${provinceId}&campos=id,nombre&max=1000`);
    const data = await res.json();
    return data.departamentos || [];
  }
  return [];
};

const fetchCities = async (country: string, provinceId: string, departmentId: string) => {
  if (country === 'AR') {
    const res = await fetch(`https://apis.datos.gob.ar/georef/api/localidades?provincia=${provinceId}&departamento=${departmentId}&campos=id,nombre&max=1000`);
    const data = await res.json();
    return data.localidades || [];
  }
  
  if (country === 'UY') {
    // Definimos el tipo explícitamente para evitar errores de índice
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
};

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
    fetchProvinces(country).then((data) => {
      setProvinceList(data);
      if (country !== userProfile?.country) {
        setProvince(''); setDepartment(''); setCity('');
      }
    });
  }, [country]);

  // 2. Cargar deptos/ciudades al cambiar provincia
  useEffect(() => {
    setDepartmentList([]); setCityList([]);
    if (province) {
      if (country === 'UY') {
        fetchCities(country, province, '').then((data) => {
            setCityList(data);
            if (country !== userProfile?.country || province !== userProfile?.province) {
                setCity('');
            }
        });
      } else {
        fetchDepartments(country, province).then((data) => {
            setDepartmentList(data);
             if (country !== userProfile?.country || province !== userProfile?.province) {
                setDepartment('');
            }
        });
      }
    }
  }, [province, country]);

  // 3. Cargar ciudades al cambiar departamento (AR)
  useEffect(() => {
    if (country !== 'UY' && department) {
      fetchCities(country, province, department).then((data) => {
          setCityList(data);
          if (department !== userProfile?.department) setCity('');
      });
    }
  }, [department, province, country]);

  async function handleSave() {
    if (!fullName || !phone || !idNumber) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    const phoneValidation = validatePhone(phone, country);
    if (!phoneValidation.valid) {
      Alert.alert('Error', phoneValidation.error || 'Teléfono inválido');
      return;
    }

    const idValidation = validateId(idNumber, country);
    if (!idValidation.valid) {
      Alert.alert('Error', idValidation.error || 'DNI/Cédula inválido');
      return;
    }

    if (dateOfBirth) {
      const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
      if (!dateRegex.test(dateOfBirth)) {
        Alert.alert('Error', 'La fecha de nacimiento debe estar en formato DD/MM/AAAA');
        return;
      }
    }

    setLoading(true);
    
    try {
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

      const normalizedId = normalizeId(idNumber);
      const { data: idData } = await supabase
        .from('users')
        .select('id')
        .eq('id_number', normalizedId)
        .neq('id', userProfile.id)
        .single();

      if (idData) {
        Alert.alert('Error', 'Este documento ya está registrado en otra cuenta');
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
          zip_code: zipCode || null,
          country,
          province,
          city,
          department: department || null 
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
        <Text style={styles.subtitle}>Mantén tu información actualizada</Text>

        <Text style={styles.sectionTitle}>Ubicación</Text>

        <Text style={styles.label}>País *</Text>
        <TouchableOpacity style={styles.customPickerTrigger} onPress={() => setCountryModalVisible(true)}>
          <Text style={styles.pickerTriggerText}>
            {getCountriesList().find(c => c.code === country)?.flag} {COUNTRIES[country]?.name || 'Selecciona un país'}
          </Text>
          <Text style={styles.pickerArrow}>▼</Text>
        </TouchableOpacity>

        {/* PROVINCIA / DEPARTAMENTO */}
        {provinceList.length > 0 && (
          <>
            <Text style={styles.label}>{country === 'UY' ? 'Departamento *' : 'Provincia/Estado *'}</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={province}
                onValueChange={setProvince}
                style={styles.pickerNative}
              >
                <Picker.Item label="Selecciona una opción" value="" color="#999" />
                {provinceList.map(p => (
                  <Picker.Item key={p.id} label={p.nombre} value={p.id} />
                ))}
              </Picker>
            </View>
          </>
        )}

        {/* MUNICIPIO (AR) */}
        {departmentList.length > 0 && (
          <>
            <Text style={styles.label}>Municipio/Localidad *</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={department}
                onValueChange={setDepartment}
                style={styles.pickerNative}
              >
                <Picker.Item label="Selecciona una opción" value="" color="#999" />
                {departmentList.map(d => (
                  <Picker.Item key={d.id} label={d.nombre} value={d.id} />
                ))}
              </Picker>
            </View>
          </>
        )}

        {/* CIUDAD */}
        {cityList.length > 0 && (
          <>
            <Text style={styles.label}>Ciudad *</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={city}
                onValueChange={setCity}
                style={styles.pickerNative}
              >
                <Picker.Item label="Selecciona una ciudad" value="" color="#999" />
                {cityList.map(c => (
                  <Picker.Item key={c.id} label={c.nombre} value={c.id} />
                ))}
              </Picker>
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Datos Personales</Text>

        <Text style={styles.label}>Nombre Completo *</Text>
        <TextInput
          style={styles.inputUnified}
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={styles.label}>Correo Electrónico</Text>
        <TextInput
          style={[styles.inputUnified, styles.inputDisabled]}
          value={userEmail}
          editable={false}
        />
        
        <Text style={styles.label}>Teléfono *</Text>
        <TextInput
          style={styles.inputUnified}
          placeholder={`Ej: ${COUNTRIES[country].phoneExample}`}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Fecha de Nacimiento</Text>
        <TextInput
          style={styles.inputUnified}
          placeholder="DD/MM/AAAA"
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
        />

        <Text style={styles.label}>Cédula / DNI *</Text>
        <TextInput
          style={styles.inputUnified}
          value={idNumber}
          onChangeText={setIdNumber}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Dirección (Calle y Número)</Text>
        <TextInput
          style={styles.inputUnified}
          placeholder="Ej: Av. Principal 1234"
          value={address}
          onChangeText={setAddress}
        />

        <Text style={styles.label}>Código Postal</Text>
        <TextInput
          style={[styles.inputUnified, { maxWidth: 150 }]}
          placeholder="CP"
          value={zipCode}
          onChangeText={setZipCode}
          keyboardType="number-pad"
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>🔒</Text>
          <Text style={styles.infoText}>
            Tu información personal está protegida.
          </Text>
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
            <Text style={styles.buttonText}>{loading ? 'Guardando...' : 'Guardar Cambios'}</Text>
          </TouchableOpacity>
        </View>
      </View>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  contentWrapper: { alignItems: 'center', paddingHorizontal: 16, paddingBottom: 24 },
  content: { width: '100%', maxWidth: 900, padding: 20 },
  
  // ESTILO UNIFICADO (Sin outlineStyle para evitar errores TS, manejado por CSS global)
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
  inputDisabled: { backgroundColor: '#f3f4f6', color: '#9ca3af', borderColor: '#e5e7eb' },
  
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
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 16, marginTop: 16 },
  sectionMargin: { marginTop: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 10 },
  infoBox: { flexDirection: 'row', backgroundColor: '#f0f4f8', padding: 16, borderRadius: 8, marginTop: 24, borderLeftWidth: 4, borderLeftColor: '#1e3a5f' },
  infoIcon: { fontSize: 20, marginRight: 12 },
  infoText: { flex: 1, fontSize: 14, color: '#666', lineHeight: 20 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 32, marginBottom: 40 },
  button: { flex: 1, padding: 16, borderRadius: 8, alignItems: 'center' },
  saveButton: { backgroundColor: '#1e3a5f' },
  cancelButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  cancelButtonText: { color: '#666', fontSize: 18, fontWeight: '600' },
  
  // Modal Styles
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
  modalCloseBtnText: { textAlign: 'center', color: '#6b7280', fontWeight: '600' }
});