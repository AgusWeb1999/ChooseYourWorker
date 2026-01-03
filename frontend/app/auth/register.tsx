import { useState, useEffect } from 'react';
// Profesiones para trabajadores
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
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Modal, Linking } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { validatePhone, validateId, normalizePhone, normalizeId, getCountriesList, CountryCode } from '../../utils/countryValidation';
import { getBarriosPorCiudad, Barrio } from '../../utils/barrios';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../src/contexts/AuthContext';
import { useRef } from 'react';



// --- FETCH PROVINCIAS (Departamentos) ---
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

// --- FETCH DEPARTAMENTOS (Municipios intermedios - Solo AR) ---
const fetchDepartments = async (country: string, provinceId: string) => {
  if (country === 'AR') {
    const res = await fetch(`https://apis.datos.gob.ar/georef/api/departamentos?provincia=${provinceId}&campos=id,nombre&max=1000`);
    const data = await res.json();
    return data.departamentos || [];
  }
  return [];
};

// --- FETCH CIUDADES (Localidades Completas UY) ---
const fetchCities = async (country: string, provinceId: string, departmentId: string) => {
  if (country === 'AR') {
    const res = await fetch(`https://apis.datos.gob.ar/georef/api/localidades?provincia=${provinceId}&departamento=${departmentId}&campos=id,nombre&max=1000`);
    const data = await res.json();
    return data.localidades || [];
  }
  
  if (country === 'UY') {
    // Lista exhaustiva de localidades por departamento
    const ciudadesUY: Record<string, {id:string, nombre:string}[]> = {
      AR: [ // Artigas
        {id:'artigas', nombre:'Artigas'}, {id:'bella_union', nombre:'Bella Unión'}, {id:'tomas_gomensoro', nombre:'Tomás Gomensoro'}, 
        {id:'baltasar_brum', nombre:'Baltasar Brum'}, {id:'sequeira', nombre:'Sequeira'}, {id:'berrnabe_rivera', nombre:'Bernabé Rivera'}, 
        {id:'javier_de_viana', nombre:'Javier de Viana'}, {id:'topador', nombre:'Topador'}
      ],
      CA: [ // Canelones (Selección principal)
        {id:'canelones', nombre:'Canelones'}, {id:'ciudad_de_la_costa', nombre:'Ciudad de la Costa'}, {id:'las_piedras', nombre:'Las Piedras'}, 
        {id:'pando', nombre:'Pando'}, {id:'la_paz', nombre:'La Paz'}, {id:'santa_lucia', nombre:'Santa Lucía'}, {id:'progreso', nombre:'Progreso'}, 
        {id:'paso_carrasco', nombre:'Paso Carrasco'}, {id:'barros_blancos', nombre:'Barros Blancos'}, {id:'colonia_nicolich', nombre:'Colonia Nicolich'}, 
        {id:'joaquin_suarez', nombre:'Joaquín Suárez'}, {id:'sauce', nombre:'Sauce'}, {id:'tala', nombre:'Tala'}, {id:'atlantida', nombre:'Atlántida'}, 
        {id:'parque_del_plata', nombre:'Parque del Plata'}, {id:'la_floresta', nombre:'La Floresta'}, {id:'salinas', nombre:'Salinas'}, 
        {id:'san_jacinto', nombre:'San Jacinto'}, {id:'san_bautista', nombre:'San Bautista'}, {id:'san_antonio', nombre:'San Antonio'}, 
        {id:'migues', nombre:'Migues'}, {id:'montes', nombre:'Montes'}, {id:'san_ramon', nombre:'San Ramón'}, {id:'empalme_olmos', nombre:'Empalme Olmos'}, 
        {id:'toledo', nombre:'Toledo'}, {id:'los_cerrillos', nombre:'Los Cerrillos'}, {id:'santa_rosa', nombre:'Santa Rosa'}, 
        {id:'soca', nombre:'Soca'}, {id:'aguas_corrientes', nombre:'Aguas Corrientes'}
      ],
      CL: [ // Cerro Largo
        {id:'melo', nombre:'Melo'}, {id:'rio_branco', nombre:'Río Branco'}, {id:'fraile_muerto', nombre:'Fraile Muerto'}, 
        {id:'isidoro_noblia', nombre:'Isidoro Noblía'}, {id:'acegua', nombre:'Aceguá'}, {id:'tupambae', nombre:'Tupambaé'}, 
        {id:'placido_rosas', nombre:'Plácido Rosas'}, {id:'arbolito', nombre:'Arbolito'}, {id:'arevalo', nombre:'Arévalo'}, 
        {id:'tres_islas', nombre:'Tres Islas'}, {id:'ramon_trigo', nombre:'Ramón Trigo'}, {id:'bañado_de_medina', nombre:'Bañado de Medina'}, 
        {id:'cerro_de_las_cuentas', nombre:'Cerro de las Cuentas'}, {id:'centurion', nombre:'Centurión'}
      ],
      CO: [ // Colonia
        {id:'colonia_del_sacramento', nombre:'Colonia del Sacramento'}, {id:'carmelo', nombre:'Carmelo'}, {id:'juan_lacaze', nombre:'Juan Lacaze'}, 
        {id:'nueva_helvecia', nombre:'Nueva Helvecia'}, {id:'rosario', nombre:'Rosario'}, {id:'nueva_palmira', nombre:'Nueva Palmira'}, 
        {id:'tarariras', nombre:'Tarariras'}, {id:'florencio_sanchez', nombre:'Florencio Sánchez'}, {id:'ombues_de_lavalle', nombre:'Ombúes de Lavalle'}, 
        {id:'colonia_valdense', nombre:'Colonia Valdense'}, {id:'miguelete', nombre:'Miguelete'}, {id:'la_paz_cp', nombre:'La Paz (CP)'}, 
        {id:'conchillas', nombre:'Conchillas'}, {id:'barker', nombre:'Barker'}, {id:'campana', nombre:'Campana'}, {id:'riachuelo', nombre:'Riachuelo'}
      ],
      DU: [ // Durazno
        {id:'durazno', nombre:'Durazno'}, {id:'sarandi_yi', nombre:'Sarandí del Yí'}, {id:'villa_del_carmen', nombre:'Villa del Carmen'}, 
        {id:'la_paloma', nombre:'La Paloma'}, {id:'centenario', nombre:'Centenario'}, {id:'cerro_chato', nombre:'Cerro Chato'}, 
        {id:'santa_bernardina', nombre:'Santa Bernardina'}, {id:'blanquillo', nombre:'Blanquillo'}, {id:'carlos_reyles', nombre:'Carlos Reyles'}, 
        {id:'san_jorge', nombre:'San Jorge'}, {id:'feliaciano', nombre:'Feliciano'}, {id:'rossell_y_rius', nombre:'Rossell y Rius'}
      ],
      FS: [ // Flores
        {id:'trinidad', nombre:'Trinidad'}, {id:'ismael_cortinas', nombre:'Ismael Cortinas'}, {id:'andresito', nombre:'Andresito'}, 
        {id:'juan_jose_castro', nombre:'Juan José Castro'}, {id:'cerro_colorado', nombre:'Cerro Colorado'}
      ],
      FD: [ // Florida
        {id:'florida', nombre:'Florida'}, {id:'sarandi_grande', nombre:'Sarandí Grande'}, {id:'casupa', nombre:'Casupá'}, 
        {id:'fray_marcos', nombre:'Fray Marcos'}, {id:'25_de_mayo', nombre:'25 de Mayo'}, {id:'25_de_agosto', nombre:'25 de Agosto'}, 
        {id:'cardal', nombre:'Cardal'}, {id:'nico_perez', nombre:'Nico Pérez'}, {id:'capilla_del_sauce', nombre:'Capilla del Sauce'}, 
        {id:'mendoza_chico', nombre:'Mendoza Chico'}, {id:'mendoza_grande', nombre:'Mendoza Grande'}, {id:'chamizo', nombre:'Chamizo'}, 
        {id:'cerro_chato', nombre:'Cerro Chato'}, {id:'alejandro_gallinal', nombre:'Alejandro Gallinal'}
      ],
      LA: [ // Lavalleja
        {id:'minas', nombre:'Minas'}, {id:'jose_pedro_varela', nombre:'José Pedro Varela'}, {id:'solis_de_mataojo', nombre:'Solís de Mataojo'}, 
        {id:'jose_batlle_y_ordonez', nombre:'José Batlle y Ordóñez'}, {id:'mariscala', nombre:'Mariscala'}, {id:'piraraja', nombre:'Pirarajá'}, 
        {id:'zapican', nombre:'Zapicán'}, {id:'colon', nombre:'Colón'}, {id:'villa_serrana', nombre:'Villa Serrana'}, {id:'illescas', nombre:'Illescas'}
      ],
      MA: [ // Maldonado
        {id:'maldonado', nombre:'Maldonado'}, {id:'san_carlos', nombre:'San Carlos'}, {id:'punta_del_este', nombre:'Punta del Este'}, 
        {id:'piriapolis', nombre:'Piriápolis'}, {id:'pan_de_azucar', nombre:'Pan de Azúcar'}, {id:'aigua', nombre:'Aiguá'}, 
        {id:'solis_grande', nombre:'Solís Grande'}, {id:'jose_ignacio', nombre:'José Ignacio'}, {id:'garzon', nombre:'Garzón'}, 
        {id:'gregorio_aznarez', nombre:'Gregorio Aznárez'}, {id:'punta_ballena', nombre:'Punta Ballena'}, {id:'pueblo_eden', nombre:'Pueblo Edén'}, 
        {id:'la_barra', nombre:'La Barra'}, {id:'manantiales', nombre:'Manantiales'}, {id:'balneario_buenos_aires', nombre:'Balneario Buenos Aires'}
      ],
      MO: [ // Montevideo
        {id:'montevideo', nombre:'Montevideo'}, {id:'pajas_blancas', nombre:'Pajas Blancas'}, {id:'santiago_vazquez', nombre:'Santiago Vázquez'}, 
        {id:'abadie', nombre:'Abayubá'}
      ],
      PA: [ // Paysandú
        {id:'paysandu', nombre:'Paysandú'}, {id:'guichon', nombre:'Guichón'}, {id:'quebracho', nombre:'Quebracho'}, 
        {id:'piedras_coloradas', nombre:'Piedras Coloradas'}, {id:'porvenir', nombre:'Porvenir'}, {id:'lorenzo_geyres', nombre:'Lorenzo Geyres'}, 
        {id:'chapisuy', nombre:'Chapicuy'}, {id:'tambores', nombre:'Tambores'}, {id:'orgoroso', nombre:'Orgoroso'}, {id:'merinos', nombre:'Merinos'}
      ],
      RN: [ // Río Negro
        {id:'fray_bentos', nombre:'Fray Bentos'}, {id:'young', nombre:'Young'}, {id:'nuevo_berlin', nombre:'Nuevo Berlín'}, 
        {id:'san_javier', nombre:'San Javier'}, {id:'algorta', nombre:'Algorta'}, {id:'grecco', nombre:'Grecco'}, 
        {id:'paso_de_los_mellizos', nombre:'Paso de los Mellizos'}, {id:'bellaco', nombre:'Bellaco'}
      ],
      RV: [ // Rivera
        {id:'rivera', nombre:'Rivera'}, {id:'tranqueras', nombre:'Tranqueras'}, {id:'vichadero', nombre:'Vichadero'}, 
        {id:'minas_de_corrales', nombre:'Minas de Corrales'}, {id:'la_puente', nombre:'La Puente'}, {id:'las_flores', nombre:'Las Flores'}, 
        {id:'moirones', nombre:'Moirones'}, {id:'cerrillada', nombre:'Cerrillada'}
      ],
      RO: [ // Rocha
        {id:'rocha', nombre:'Rocha'}, {id:'chuy', nombre:'Chuy'}, {id:'castillos', nombre:'Castillos'}, {id:'lascano', nombre:'Lascano'}, 
        {id:'la_paloma', nombre:'La Paloma'}, {id:'cebollati', nombre:'Cebollatí'}, {id:'velazquez', nombre:'Velázquez'}, 
        {id:'18_de_julio', nombre:'18 de Julio'}, {id:'san_luis_al_medio', nombre:'San Luis al Medio'}, {id:'la_coronilla', nombre:'La Coronilla'}, 
        {id:'punta_del_diablo', nombre:'Punta del Diablo'}, {id:'aguas_dulces', nombre:'Aguas Dulces'}, {id:'barra_de_chuy', nombre:'Barra de Chuy'}, 
        {id:'cabo_polonio', nombre:'Cabo Polonio'}
      ],
      SA: [ // Salto
        {id:'salto', nombre:'Salto'}, {id:'constitucion', nombre:'Constitución'}, {id:'belen', nombre:'Belén'}, 
        {id:'colonia_lavalleja', nombre:'Colonia Lavalleja'}, {id:'san_antonio', nombre:'San Antonio'}, {id:'mataojo', nombre:'Mataojo'}, 
        {id:'rincon_de_valentin', nombre:'Rincón de Valentín'}, {id:'colonia_itapebi', nombre:'Colonia Itapebí'}, {id:'biassini', nombre:'Biassini'}, 
        {id:'saucedo', nombre:'Saucedo'}, {id:'garibaldi', nombre:'Garibaldi'}
      ],
      SJ: [ // San José
        {id:'san_jose_de_mayo', nombre:'San José de Mayo'}, {id:'ciudad_del_plata', nombre:'Ciudad del Plata'}, {id:'libertad', nombre:'Libertad'}, 
        {id:'rodriguez', nombre:'Rodríguez'}, {id:'ecilda_paullier', nombre:'Ecilda Paullier'}, {id:'rafael_perazza', nombre:'Rafael Perazza'}, 
        {id:'punta_de_valdez', nombre:'Punta de Valdez'}, {id:'ituzaingo', nombre:'Ituzaingó'}, {id:'malabrigo', nombre:'Malabrigo'}, 
        {id:'capurro', nombre:'Capurro'}
      ],
      SO: [ // Soriano
        {id:'mercedes', nombre:'Mercedes'}, {id:'dolores', nombre:'Dolores'}, {id:'cardona', nombre:'Cardona'}, 
        {id:'palmitas', nombre:'Palmitas'}, {id:'jose_enrique_rodo', nombre:'José Enrique Rodó'}, {id:'santa_catalina', nombre:'Santa Catalina'}, 
        {id:'egaña', nombre:'Egaña'}, {id:'risso', nombre:'Risso'}, {id:'villa_soriano', nombre:'Villa Soriano'}, {id:'cañada_nieto', nombre:'Cañada Nieto'}
      ],
      TA: [ // Tacuarembó (Lista Completa)
        {id:'tacuarembo', nombre:'Tacuarembó'}, {id:'paso_de_los_toros', nombre:'Paso de los Toros'}, {id:'san_gregorio_de_polanco', nombre:'San Gregorio de Polanco'}, 
        {id:'villa_ansina', nombre:'Villa Ansina'}, {id:'curtina', nombre:'Curtina'}, {id:'las_toscas', nombre:'Las Toscas'}, 
        {id:'achar', nombre:'Achar'}, {id:'tambores', nombre:'Tambores'}, {id:'paso_bonilla', nombre:'Paso Bonilla'}, 
        {id:'paso_del_cerro', nombre:'Paso del Cerro'}, {id:'clara', nombre:'Clara'}, {id:'cuchilla_de_peralta', nombre:'Cuchilla de Peralta'}, 
        {id:'piedra_sola', nombre:'Piedra Sola'}, {id:'pueblo_de_arriba', nombre:'Pueblo de Arriba'}, {id:'balneario_ipora', nombre:'Balneario Iporá'}, 
        {id:'valle_eden', nombre:'Valle Edén'}
      ],
      TT: [ // Treinta y Tres
        {id:'treinta_y_tres', nombre:'Treinta y Tres'}, {id:'vergara', nombre:'Vergara'}, {id:'santa_clara_de_olimar', nombre:'Santa Clara de Olimar'}, 
        {id:'cerro_chato', nombre:'Cerro Chato'}, {id:'general_enrique_martinez', nombre:'Gral. Enrique Martínez (Charqueada)'}, 
        {id:'rincón', nombre:'Rincón'}, {id:'arrozal_33', nombre:'Arrozal 33'}, {id:'maria_albina', nombre:'María Albina'}, 
        {id:'isla_patrulla', nombre:'Isla Patrulla'}
      ],
    };
    return ciudadesUY[provinceId] || [];
  }
  return [];
};


export default function RegisterScreen() {
  const { refreshProfiles } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [country, setCountry] = useState<CountryCode>('UY');
  const [provinceModalVisible, setProvinceModalVisible] = useState(false);
  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [barrioModalVisible, setBarrioModalVisible] = useState(false);
  const [userType, setUserType] = useState<'client' | 'worker' | null>(null);
  const [province, setProvince] = useState<string>('');
  const [provinceList, setProvinceList] = useState<any[]>([]);
  const [department, setDepartment] = useState<string>('');
  const [departmentList, setDepartmentList] = useState<any[]>([]);
  const [city, setCity] = useState<string>('');
  const [cityList, setCityList] = useState<any[]>([]);
  const [barrio, setBarrio] = useState<string>('');
  const [barrioList, setBarrioList] = useState<Barrio[]>([]);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const toastTimeout = useRef<any>(null);

  // Campos de perfil profesional (solo para trabajadores)
  const [displayName, setDisplayName] = useState('');
  const [profession, setProfession] = useState('');
  const [customProfession, setCustomProfession] = useState('');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');

  // Buscador de profesiones
  const [professionSearch, setProfessionSearch] = useState('');
  const filteredProfessions = PROFESSIONS.filter(p => {
    if (p === 'Otro') return false; // 'Otro' se agrega siempre al final
    return p.toLowerCase().includes(professionSearch.toLowerCase());
  });
  if (!filteredProfessions.includes('Otro')) filteredProfessions.push('Otro');

  // 1. Efecto: Al cambiar País
  useEffect(() => {
    setProvince(''); setDepartment(''); setCity('');
    setProvinceList([]); setDepartmentList([]); setCityList([]);
    fetchProvinces(country).then(setProvinceList);
  }, [country]);

  // 2. Efecto: Al cambiar Provincia
  useEffect(() => {
    setDepartment(''); setCity('');
    setDepartmentList([]); setCityList([]);
    if (province) {
      if (country === 'UY') {
        fetchCities(country, province, '').then(setCityList);
      } else {
        fetchDepartments(country, province).then(setDepartmentList);
      }
    }
  }, [province, country]);

  // 3. Efecto: Al cambiar Departamento
  useEffect(() => {
    setCity('');
    if (country !== 'UY' && department) {
      fetchCities(country, province, department).then(setCityList);
    }
  }, [department, province, country]);

  // 4. Efecto: Al cambiar Ciudad - cargar barrios
  useEffect(() => {
    setBarrio('');
    if (city) {
      const barrios = getBarriosPorCiudad(city);
      setBarrioList(barrios);
    } else {
      setBarrioList([]);
    }
  }, [city]);

  async function handleRegister() {
    const newErrors: Record<string, string> = {};

    if (!fullName) newErrors.fullName = 'El nombre es requerido';
    if (!email) {
      newErrors.email = 'El email es requerido';
    } else {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Email inválido';
      }
    }
    if (!password || password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
    const phoneVal = validatePhone(phone, country);
    if (!phoneVal.valid) newErrors.phone = phoneVal.error || 'Teléfono inválido';
    const idVal = validateId(idNumber, country);
    if (!idVal.valid) newErrors.idNumber = idVal.error || 'ID inválido';

    // Departamento/Provincia y Ciudad requeridos
    if (provinceList.length > 0 && !province) newErrors.province = country === 'UY' ? 'El departamento es requerido' : 'La provincia es requerida';
    if (departmentList.length > 0 && !department) newErrors.department = 'El municipio/localidad es requerido';
    if (cityList.length > 0 && !city) newErrors.city = 'La ciudad es requerida';
    if (barrioList.length > 0 && !barrio) newErrors.barrio = 'El barrio es requerido';

    // Validación de campos profesionales si es trabajador
    if (userType === 'worker') {
      if (!displayName) newErrors.displayName = 'El nombre para mostrar es requerido';
      let finalProfession = profession === 'Otro' ? customProfession : profession;
      if (!finalProfession) newErrors.profession = 'La profesión es requerida';
      if (profession === 'Otro') {
        if (!customProfession.trim()) {
          newErrors.customProfession = 'Por favor ingresa tu profesión específica';
        } else {
          // Filtro de profesiones ilegales/inapropiadas
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
          const lower = customProfession.trim().toLowerCase();
          if (forbiddenWords.some(word => lower.includes(word))) {
            newErrors.customProfession = 'El servicio ingresado no está permitido en la plataforma.';
          }
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Mostrar alerta general si hay algún error
      const firstError = Object.values(newErrors)[0];
      if (firstError) {
        Alert.alert('Error', firstError);
      }
      return;
    }

    if (!userType || !termsAccepted) {
      Alert.alert('Error', 'Debes elegir tipo de cuenta y aceptar los términos');
      return;
    }

    setLoading(true);
    try {
      // Normalize email: trim whitespace and lowercase
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPhone = normalizePhone(phone, country);
      const normalizedIdNumber = normalizeId(idNumber);

      console.log('🔍 Verificando duplicados...');
      console.log('Email normalizado:', normalizedEmail);
      console.log('Teléfono normalizado:', normalizedPhone);
      console.log('Cédula normalizada:', normalizedIdNumber);

      // ========== VALIDACIONES DE DUPLICADOS ==========
      
      // 1. Verificar si el email ya existe usando función RPC pública
      const { data: emailExists, error: emailCheckError } = await supabase
        .rpc('check_email_exists', { email_to_check: normalizedEmail });

      console.log('📧 Verificación email:', { emailExists, emailCheckError });

      if (emailCheckError) {
        console.error('❌ Error verificando email:', emailCheckError);
        setToast({ message: 'Error al verificar disponibilidad del email. Por favor intenta nuevamente.', type: 'error' });
        if (toastTimeout.current) clearTimeout(toastTimeout.current);
        toastTimeout.current = setTimeout(() => setToast(null), 3000);
        setLoading(false);
        return;
      }

      if (emailExists) {
        console.log('⚠️ Email ya existe');
        setToast({ message: 'Este correo electrónico ya está registrado. Verifica tu email o recupera tu contraseña.', type: 'error' });
        if (toastTimeout.current) clearTimeout(toastTimeout.current);
        toastTimeout.current = setTimeout(() => setToast(null), 4000);
        setLoading(false);
        return;
      }

      // 2. Verificar si el teléfono ya existe usando función RPC pública
      const { data: phoneExists, error: phoneCheckError } = await supabase
        .rpc('check_phone_exists', { phone_to_check: normalizedPhone });

      console.log('📱 Verificación teléfono:', { phoneExists, phoneCheckError });

      if (phoneCheckError) {
        console.error('❌ Error verificando teléfono:', phoneCheckError);
        setToast({ message: 'Error al verificar disponibilidad del teléfono. Por favor intenta nuevamente.', type: 'error' });
        if (toastTimeout.current) clearTimeout(toastTimeout.current);
        toastTimeout.current = setTimeout(() => setToast(null), 3000);
        setLoading(false);
        return;
      }

      if (phoneExists) {
        console.log('⚠️ Teléfono ya existe');
        setToast({ message: 'Este número de teléfono ya está asociado a otra cuenta. Cada usuario debe tener un número único.', type: 'error' });
        if (toastTimeout.current) clearTimeout(toastTimeout.current);
        toastTimeout.current = setTimeout(() => setToast(null), 4000);
        setLoading(false);
        return;
      }

      // 3. Verificar si la cédula/DNI ya existe usando función RPC pública
      const { data: idExists, error: idCheckError } = await supabase
        .rpc('check_id_exists', { id_to_check: normalizedIdNumber });

      console.log('🪪 Verificación cédula:', { idExists, idCheckError });

      if (idCheckError) {
        console.error('❌ Error verificando cédula:', idCheckError);
        setToast({ message: 'Error al verificar disponibilidad de la cédula/DNI. Por favor intenta nuevamente.', type: 'error' });
        if (toastTimeout.current) clearTimeout(toastTimeout.current);
        toastTimeout.current = setTimeout(() => setToast(null), 3000);
        setLoading(false);
        return;
      }

      if (idExists) {
        console.log('⚠️ Cédula ya existe');
        setToast({ message: 'Esta cédula/DNI ya está asociada a otra cuenta. Si crees que es un error, contacta a soporte.', type: 'error' });
        if (toastTimeout.current) clearTimeout(toastTimeout.current);
        toastTimeout.current = setTimeout(() => setToast(null), 4000);
        setLoading(false);
        return;
      }

      console.log('✅ Todas las validaciones pasaron, creando cuenta...');

      // ========== CREAR CUENTA ==========
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { 
          data: { full_name: fullName, user_type: userType },
          emailRedirectTo: 'https://working-go.com/auth/email-verified'
        }
      });

      if (authError) {
        // Manejar errores específicos de Supabase Auth
        if (authError.message.includes('already registered')) {
          Alert.alert(
            'Email ya registrado',
            'Este correo ya está en uso. ¿Deseas recuperar tu contraseña?',
            [
              { text: 'Cancelar', style: 'cancel' },
              { 
                text: 'Recuperar contraseña', 
                onPress: () => router.push('/auth/forgot-password')
              }
            ]
          );
          setLoading(false);
          return;
        }
        throw authError;
      }

      if (authData.user) {
        const userId = authData.user.id;
        
        // El trigger de base de datos ya creó el registro base en users
        // Solo actualizamos los campos adicionales que no están en el trigger
        
        // Esperar un momento para que el trigger complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Si es profesional, crear registro en professionals con TODOS los datos necesarios
        if (userType === 'worker') {
          const finalProfession = profession === 'Otro' ? customProfession : profession;
          
          // Intentar usar RPC call para insertar con permisos elevados
          const { error: profError } = await supabase.rpc('create_professional_profile', {
            p_user_id: userId,
            p_display_name: displayName,
            p_profession: finalProfession.charAt(0).toUpperCase() + finalProfession.slice(1).toLowerCase(),
            p_bio: bio || '',
            p_city: city,
            p_state: province,
            p_barrio: barrio,
            p_phone: normalizedPhone,
            p_id_number: normalizedIdNumber,
            p_country: country,
            p_hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
            p_years_experience: yearsExperience ? parseInt(yearsExperience) : null
          });
          
          // Si el RPC falla, intentar insert directo (fallback)
          if (profError) {
            console.log('RPC failed, trying direct insert:', profError);
            const { error: insertError } = await supabase.from('professionals').insert({
              user_id: userId,
              display_name: displayName,
              profession: finalProfession.charAt(0).toUpperCase() + finalProfession.slice(1).toLowerCase(),
              bio: bio || '',
              city: city,
              state: province,
              barrio: barrio,
              zip_code: '',
              hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
              years_experience: yearsExperience ? parseInt(yearsExperience) : null,
              phone: normalizedPhone,
              rating: 0,
              rating_count: 0,
              total_reviews: 0,
              avatar_url: null,
              completed_hires_count: 0
            });
            
            if (insertError) {
              console.error('Error creating professional profile:', insertError);
              // No lanzamos error aquí, permitimos que continúe
            }
          }
        }
        
        // Guardar datos adicionales en localStorage para actualizar después de confirmar email
        if (typeof window !== 'undefined') {
          localStorage.setItem('pending_user_data', JSON.stringify({
            user_id: userId,
            phone: normalizedPhone,
            id_number: normalizedIdNumber,
            country,
            province,
            city,
            barrio
          }));
        }
        
        // Redirigir a pantalla de confirmación de email
        router.replace({ pathname: '/auth/email-confirmation', params: { email: normalizedEmail } });
        return;
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <View style={styles.innerContainer}>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Únete a WorkingGo</Text>

            {errorMsg && (
              <View style={styles.errorBox}><Text style={styles.errorText}>{errorMsg}</Text></View>
            )}

            {/* Selector de País */}
            <Text style={styles.label}>País</Text>
            <TouchableOpacity style={styles.customPickerTrigger} onPress={() => setCountryModalVisible(true)}>
              <Text style={styles.pickerTriggerText}>
                {getCountriesList().find(c => c.code === country)?.flag} {getCountriesList().find(c => c.code === country)?.name}
              </Text>
              <Text style={styles.pickerArrow}>▼</Text>
            </TouchableOpacity>

            {/* Departamento / Provincia */}
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
                {errors.province && <Text style={styles.errorText}>{errors.province}</Text>}
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
                {errors.department && <Text style={styles.errorText}>{errors.department}</Text>}
              </>
            )}

            {/* Ciudad */}
            {cityList.length > 0 && (
              <>
                <Text style={styles.label}>Ciudad *</Text>
                <TouchableOpacity style={styles.customPickerTrigger} onPress={() => setCityModalVisible(true)}>
                  <Text style={styles.pickerTriggerText}>
                    {cityList.find(c => String(c.id) === String(city))?.nombre || 'Selecciona ciudad'}
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
                {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
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
                {errors.barrio && <Text style={styles.errorText}>{errors.barrio}</Text>}
              </>
            )}

            <Text style={styles.label}>Información Personal</Text>

            <TextInput style={[styles.inputUnified, errors.fullName && styles.inputError]} placeholder="Nombre Completo" value={fullName} onChangeText={setFullName} placeholderTextColor="#9ca3af" />
            {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

            <TextInput style={[styles.inputUnified, errors.email && styles.inputError]} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#9ca3af" />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <TextInput style={[styles.inputUnified, errors.password && styles.inputError]} placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#9ca3af" />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            <TextInput style={[styles.inputUnified, errors.phone && styles.inputError]} placeholder="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor="#9ca3af" />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

            <TextInput style={[styles.inputUnified, errors.idNumber && styles.inputError]} placeholder="Cédula / DNI" value={idNumber} onChangeText={setIdNumber} placeholderTextColor="#9ca3af" />
            {errors.idNumber && <Text style={styles.errorText}>{errors.idNumber}</Text>}

            <Text style={styles.label}>¿Qué buscas en WorkingGo?</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity style={[styles.typeButton, userType === 'client' && styles.typeButtonActive]} onPress={() => setUserType('client')}>
                <Text style={userType === 'client' ? styles.typeButtonTextActive : styles.typeButtonText}>🔍 Soy Cliente</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeButton, userType === 'worker' && styles.typeButtonActive]} onPress={() => setUserType('worker')}>
                <Text style={userType === 'worker' ? styles.typeButtonTextActive : styles.typeButtonText}>🛠️ Soy Trabajador</Text>
              </TouchableOpacity>
            </View>


            {/* Campos de perfil profesional solo si elige Trabajador */}
            {userType === 'worker' && (
              <View style={{ marginTop: 10, marginBottom: 10 }}>
                <Text style={styles.label}>Nombre para Mostrar *</Text>
                <TextInput
                  style={[styles.inputUnified, errors.displayName && styles.inputError]}
                  placeholder="Cómo te verán los clientes"
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholderTextColor="#9ca3af"
                />
                {errors.displayName && <Text style={styles.errorText}>{errors.displayName}</Text>}

                <Text style={styles.label}>Profesión *</Text>

                {/* Buscador de profesiones */}
                <TextInput
                  style={[styles.inputUnified, { marginBottom: 8 }]}
                  placeholder="Buscar profesión..."
                  placeholderTextColor="#9ca3af"
                  value={professionSearch}
                  onChangeText={setProfessionSearch}
                />

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  {filteredProfessions.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.typeButton,
                        profession === p && styles.typeButtonActive,
                        { minWidth: 90, marginBottom: 6 },
                      ]}
                      onPress={() => setProfession(p)}
                    >
                      <Text style={profession === p ? styles.typeButtonTextActive : styles.typeButtonText}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.profession && <Text style={styles.errorText}>{errors.profession}</Text>}
                {profession === 'Otro' && (
                  <>
                    <Text style={styles.label}>Especifique su profesión *</Text>
                    <TextInput
                      style={[styles.inputUnified, errors.customProfession && styles.inputError]}
                      placeholder="Ingrese su profesión"
                      value={customProfession}
                      onChangeText={setCustomProfession}
                      placeholderTextColor="#9ca3af"
                    />
                    {errors.customProfession && <Text style={styles.errorText}>{errors.customProfession}</Text>}
                  </>
                )}

                <Text style={styles.label}>Bio</Text>
                <TextInput
                  style={[styles.inputUnified, { height: 100, textAlignVertical: 'top' }]}
                  placeholder="Describe tu experiencia..."
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#9ca3af"
                />

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Tarifa por Hora ($) <Text style={{color:'#9ca3af', fontWeight:'normal'}}>(opcional)</Text></Text>
                    <TextInput
                      style={styles.inputUnified}
                      placeholder="1500"
                      value={hourlyRate}
                      onChangeText={setHourlyRate}
                      keyboardType="numeric"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Años de Experiencia</Text>
                    <TextInput
                      style={[styles.inputUnified, errors.yearsExperience && styles.inputError]}
                      placeholder="5"
                      value={yearsExperience}
                      onChangeText={setYearsExperience}
                      keyboardType="numeric"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>
              </View>
            )}

            <View style={styles.termsContainer}>
              <TouchableOpacity style={styles.checkbox} onPress={() => setTermsAccepted(!termsAccepted)}>
                <View style={[styles.checkboxInner, termsAccepted && styles.checkboxChecked]}>{termsAccepted && <Text style={styles.checkmark}>✓</Text>}</View>
              </TouchableOpacity>
              <View style={{flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap'}}>
                <Text style={styles.termsLabel}>Acepto los </Text>
                <Link href="/auth/terms-of-service" asChild>
                  <TouchableOpacity>
                    <Text style={[styles.link, {textDecorationLine: 'underline'}]}>Términos de Servicio</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>

            <TouchableOpacity style={[styles.buttonPrimary, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
              <Text style={styles.buttonPrimaryText}>{loading ? 'Procesando...' : 'Registrarse Ahora'}</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
              <Link href="/auth/login" asChild>
                <TouchableOpacity><Text style={styles.link}>Inicia Sesión</Text></TouchableOpacity>
              </Link>
            </View>

            <TouchableOpacity 
              style={styles.supportLink}
              onPress={async () => {
                const url = 'mailto:workinggoam@gmail.com?subject=Consulta%20desde%20Registro';
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
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={countryModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona tu país</Text>
            <ScrollView>{getCountriesList().map(c => (<TouchableOpacity key={c.code} style={styles.modalOption} onPress={() => { setCountry(c.code as CountryCode); setCountryModalVisible(false); }}><Text style={styles.modalOptionFlag}>{c.flag} {c.name}</Text></TouchableOpacity>))}</ScrollView>
            <TouchableOpacity onPress={() => setCountryModalVisible(false)} style={styles.modalCloseBtn}><Text style={styles.modalCloseBtnText}>Cerrar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9fafb' },
  keyboardView: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { paddingVertical: 20, paddingHorizontal: 16 },
  innerContainer: { maxWidth: 480, width: '100%', alignSelf: 'center' },
  title: { fontSize: 32, fontWeight: '800', textAlign: 'center', color: '#1e3a5f', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#6b7280', marginBottom: 32 },
  label: { fontSize: 15, fontWeight: '700', marginBottom: 10, color: '#374151', marginTop: 16 },
  
  inputUnified: { 
    backgroundColor: '#fff',
    borderWidth: 1.5, 
    borderColor: '#e5e7eb', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 14, 
    fontSize: 16,
    color: '#1f2937',
    // outlineStyle removed for compatibility
  },
  inputError: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  
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
  
  customPickerTrigger: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fff', height: 58, alignItems: 'center' },
  pickerTriggerText: { fontSize: 16, color: '#1f2937' },
  pickerArrow: { color: '#9ca3af', fontSize: 12 },

  typeContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  typeButton: { flex: 1, padding: 18, borderRadius: 14, borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fff', alignItems: 'center' },
  typeButtonActive: { borderColor: '#1e3a5f', backgroundColor: '#eff6ff', borderWidth: 2 },
  typeButtonText: { color: '#6b7280', fontWeight: '500' },
  typeButtonTextActive: { color: '#1e3a5f', fontWeight: '800' },

  buttonPrimary: { backgroundColor: '#1e3a5f', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 24 },
  buttonPrimaryText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  buttonDisabled: { opacity: 0.5 },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30, marginBottom: 20 },
  footerText: { color: '#6b7280' },
  link: { color: '#1e3a5f', fontWeight: '800' },
  
  errorBox: { backgroundColor: '#fee2e2', padding: 16, borderRadius: 12, marginBottom: 20 },
  errorText: { color: '#b91c1c', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 24, maxHeight: '80%' },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  modalScroll: { maxHeight: 400 },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, marginBottom: 8, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb' },
  modalOptionSelected: { backgroundColor: '#e0e7ff', borderColor: '#6366f1' },
  modalOptionText: { fontSize: 15, color: '#374151', fontWeight: '500' },
  modalOptionTextSelected: { color: '#6366f1', fontWeight: '600' },
  checkmark: { fontSize: 18, color: '#6366f1', fontWeight: 'bold' },
  modalCloseBtn: { marginTop: 16, padding: 12 },
  modalCloseBtnText: { textAlign: 'center', color: '#6b7280', fontWeight: '600' },
  modalOptionFlag: { fontSize: 16, color: '#374151' },

  termsContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  checkbox: { marginRight: 12 },
  checkboxInner: { width: 24, height: 24, borderWidth: 2, borderColor: '#1e3a5f', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#1e3a5f' },
  // checkmark duplicado eliminado para evitar conflicto de propiedades
  termsLabel: { color: '#4b5563', fontSize: 14 },

  toast: { position: 'absolute', bottom: 40, left: 20, right: 20, padding: 16, borderRadius: 12, zIndex: 1000, elevation: 5 },
  toastSuccess: { backgroundColor: '#10b981' },
  toastError: { backgroundColor: '#ef4444' },
  toastText: { color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 15 },

  supportLink: { marginTop: 16, marginBottom: 8, alignItems: 'center' },
  supportLinkText: { fontSize: 12, color: '#9ca3af', textDecorationLine: 'underline' }
});