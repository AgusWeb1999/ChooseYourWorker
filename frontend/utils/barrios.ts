// Tipo de dato para los barrios
export type Barrio = { id: string; nombre: string };

export const barriosPorCiudad: Record<string, Barrio[]> = {
  // --- MONTEVIDEO ---
  montevideo: [
    { id: 'ciudad_vieja', nombre: 'Ciudad Vieja' }, { id: 'centro', nombre: 'Centro' },
    { id: 'barrio_sur', nombre: 'Barrio Sur' }, { id: 'cordon', nombre: 'Cordón' },
    { id: 'palermo', nombre: 'Palermo' }, { id: 'parque_rodo', nombre: 'Parque Rodó' },
    { id: 'punta_carretas', nombre: 'Punta Carretas' }, { id: 'pocitos', nombre: 'Pocitos' },
    { id: 'buceo', nombre: 'Buceo' }, { id: 'malvin', nombre: 'Malvín' },
    { id: 'carrasco', nombre: 'Carrasco' }, { id: 'punta_gorda', nombre: 'Punta Gorda' },
    { id: 'union', nombre: 'La Unión' }, { id: 'la_blanqueada', nombre: 'La Blanqueada' },
    { id: 'tres_cruces', nombre: 'Tres Cruces' }, { id: 'aguada', nombre: 'La Aguada' },
    { id: 'prado', nombre: 'Prado' }, { id: 'sayago', nombre: 'Sayago' },
    { id: 'penarol', nombre: 'Peñarol' }, { id: 'colon', nombre: 'Colón' },
    { id: 'cerro', nombre: 'Cerro' }, { id: 'la_teja', nombre: 'La Teja' },
    { id: 'belvedere', nombre: 'Belvedere' }, { id: 'capurro', nombre: 'Capurro' },
    { id: 'manga', nombre: 'Manga' }, { id: 'piedras_blancas', nombre: 'Piedras Blancas' },
    { id: 'jardines_del_hipodromo', nombre: 'Jardines del Hipódromo' },
    { id: 'maroñas', nombre: 'Maroñas' }, { id: 'cerrito', nombre: 'Cerrito de la Victoria' },
    { id: 'jacinto_vera', nombre: 'Jacinto Vera' }, { id: 'brazo_oriental', nombre: 'Brazo Oriental' },
    { id: 'reducto', nombre: 'Reducto' }, { id: 'atahualpa', nombre: 'Atahualpa' },
    { id: 'aires_puros', nombre: 'Aires Puros' }, { id: 'paso_molino', nombre: 'Paso Molino' },
    { id: 'otro', nombre: 'Otro' }
  ],

  // --- CANELONES ---
  canelones: [ // Capital
    { id: 'centro', nombre: 'Centro' }, { id: 'parada_rodo', nombre: 'Parada Rodó' },
    { id: 'la_cantera', nombre: 'La Cantera' }, { id: 'olimpico', nombre: 'Olímpico' },
    { id: 'otro', nombre: 'Otro' }
  ],
  ciudad_de_la_costa: [ // Técnicamente son balnearios que funcionan como barrios
    { id: 'shangrila', nombre: 'Shangrilá' }, { id: 'lagomar', nombre: 'Lagomar' },
    { id: 'solymar', nombre: 'Solymar' }, { id: 'el_pinar', nombre: 'El Pinar' },
    { id: 'lomas_de_solymar', nombre: 'Lomas de Solymar' }, { id: 'el_bosque', nombre: 'El Bosque' },
    { id: 'parque_carrasco', nombre: 'Parque Carrasco' }, { id: 'san_jose_de_carrasco', nombre: 'San José de Carrasco' },
    { id: 'otro', nombre: 'Otro' }
  ],
  las_piedras: [
    { id: 'centro', nombre: 'Centro' }, { id: 'obelisco', nombre: 'El Obelisco' },
    { id: 'pueblo_nuevo', nombre: 'Pueblo Nuevo' }, { id: 'barrio_campisteguy', nombre: 'Campisteguy' },
    { id: 'el_dorado', nombre: 'El Dorado' }, { id: 'san_isidro', nombre: 'San Isidro' },
    { id: 'otro', nombre: 'Otro' }
  ],
  pando: [
    { id: 'centro', nombre: 'Centro' }, { id: 'estadio', nombre: 'Barrio Estadio' },
    { id: 'san_isidro', nombre: 'San Isidro' }, { id: 'talar', nombre: 'El Talar' },
    { id: 'otro', nombre: 'Otro' }
  ],

  // --- MALDONADO ---
  maldonado: [ // Capital
    { id: 'centro', nombre: 'Centro' }, { id: 'cerro_pelado', nombre: 'Cerro Pelado' },
    { id: 'maldonado_nuevo', nombre: 'Maldonado Nuevo' }, { id: 'barrio_rivera', nombre: 'Barrio Rivera' },
    { id: 'pinares', nombre: 'Pinares' }, { id: 'lausana', nombre: 'Lausana' },
    { id: 'hipodromo', nombre: 'Barrio Hipódromo' }, { id: 'b75', nombre: 'Biarritz' },
    { id: 'otro', nombre: 'Otro' }
  ],
  punta_del_este: [
    { id: 'peninsula', nombre: 'Península' }, { id: 'san_rafael', nombre: 'San Rafael' },
    { id: 'cantegril', nombre: 'Cantegril' }, { id: 'aidy_grill', nombre: 'Aidy Grill' },
    { id: 'beverly_hills', nombre: 'Beverly Hills' }, { id: 'roosevelt', nombre: 'Roosevelt' },
    { id: 'las_delicias', nombre: 'Las Delicias' }, { id: 'rincon_del_indio', nombre: 'Rincón del Indio' },
    { id: 'otro', nombre: 'Otro' }
  ],
  san_carlos: [
    { id: 'centro', nombre: 'Centro' }, { id: 'rodriguez_barrios', nombre: 'Rodríguez Barrios' },
    { id: 'lavagna', nombre: 'Barrio Lavagna' }, { id: 'asturias', nombre: 'Asturias' },
    { id: 'otro', nombre: 'Otro' }
  ],

  // --- SALTO ---
  salto: [
    { id: 'centro', nombre: 'Centro' }, { id: 'cerro', nombre: 'Cerro' },
    { id: 'salto_nuevo', nombre: 'Salto Nuevo' }, { id: 'ceibal', nombre: 'Ceibal' },
    { id: 'artigas', nombre: 'Barrio Artigas' }, { id: 'zona_este', nombre: 'Zona Este' },
    { id: 'progreso', nombre: 'Progreso' }, { id: 'dos_naciones', nombre: 'Dos Naciones' },
    { id: 'otro', nombre: 'Otro' }
  ],

  // --- PAYSANDÚ ---
  paysandu: [
    { id: 'centro', nombre: 'Centro' }, { id: 'puerto', nombre: 'Zona del Puerto' },
    { id: 'las_brisas', nombre: 'Las Brisas' }, { id: 'norte', nombre: 'Barrio Norte' },
    { id: 'nuevo_paysandu', nombre: 'Nuevo Paysandú' }, { id: 'san_felix', nombre: 'San Félix' },
    { id: 'otro', nombre: 'Otro' }
  ],

  // --- RIVERA ---
  rivera: [
    { id: 'centro', nombre: 'Centro' }, { id: 'rivera_chico', nombre: 'Rivera Chico' },
    { id: 'santa_isabel', nombre: 'Santa Isabel' }, { id: 'lagun', nombre: 'Lagun' },
    { id: 'saavedra', nombre: 'Saavedra' }, { id: 'mandubi', nombre: 'Mandubí' },
    { id: 'otro', nombre: 'Otro' }
  ],

  // --- TACUAREMBÓ ---
  tacuarembo: [
    { id: 'centro', nombre: 'Centro' }, { id: 'ferrocarril', nombre: 'Barrio Ferrocarril' },
    { id: 'sexto', nombre: 'Barrio Sexto' }, { id: 'lopez', nombre: 'Barrio López' },
    { id: 'molino', nombre: 'El Molino' }, { id: 'centenario', nombre: 'Centenario' },
    { id: 'otro', nombre: 'Otro' }
  ],

  // --- ARTIGAS ---
  artigas: [
    { id: 'centro', nombre: 'Centro' }, { id: 'zorrilla', nombre: 'Zorrilla' },
    { id: 'ayui', nombre: 'Ayuí' }, { id: 'pintadito', nombre: 'Pintadito' },
    { id: 'rampla', nombre: 'Rampla' },
    { id: 'otro', nombre: 'Otro' }
  ],
  bella_union: [
    { id: 'centro', nombre: 'Centro' }, { id: 'las_laminas', nombre: 'Las Láminas' },
    { id: 'tres_fronteras', nombre: 'Tres Fronteras' },
    { id: 'otro', nombre: 'Otro' }
  ],

  // --- CERRO LARGO ---
  melo: [
    { id: 'centro', nombre: 'Centro' }, { id: 'zona_norte', nombre: 'Zona Norte' },
    { id: 'barrio_lopez', nombre: 'Barrio López' }, { id: 'soñora', nombre: 'Soñora' },
    { id: 'el_fogom', nombre: 'El Fogón' },
    { id: 'otro', nombre: 'Otro' }
  ],
  rio_branco: [
    { id: 'centro', nombre: 'Centro' }, { id: 'comercial', nombre: 'Zona Comercial' },
    { id: 'pamer', nombre: 'Pamer' },
    { id: 'otro', nombre: 'Otro' }
  ],

  // --- COLONIA ---
  colonia_del_sacramento: [
    { id: 'centro', nombre: 'Centro' }, { id: 'barrio_historico', nombre: 'Barrio Histórico' },
    { id: 'real_de_san_carlos', nombre: 'Real de San Carlos' }, { id: 'el_general', nombre: 'El General' },
    { id: 'otro', nombre: 'Otro' }
  ],
  carmelo: [
    { id: 'centro', nombre: 'Centro' }, { id: 'barrio_saravia', nombre: 'Barrio Saravia' },
    { id: 'lomas', nombre: 'Lomas' },
    { id: 'otro', nombre: 'Otro' }
  ],
  juan_lacaze: [
    { id: 'centro', nombre: 'Centro' }, { id: 'villa_pancha', nombre: 'Villa Pancha' },
    { id: 'charrúa', nombre: 'Charrúa' },
    { id: 'otro', nombre: 'Otro' }
  ],

  // --- DURAZNO ---
  durazno: [
    { id: 'centro', nombre: 'Centro' }, { id: 'buem', nombre: 'BUEM' },
    { id: 'varona', nombre: 'Varona' }, { id: 'santa_bernardina_b', nombre: 'Santa Bernardina (Barrio)' },
    { id: 'la_lanera', nombre: 'La Lanera' },
    { id: 'otro', nombre: 'Otro' }
  ],

  // --- FLORES ---
  trinidad: [
    { id: 'centro', nombre: 'Centro' }, { id: 'la_pedrera', nombre: 'La Pedrera' },
    { id: 'union', nombre: 'Barrio Unión' },
    { id: 'otro', nombre: 'Otro' }
  ],

  // --- FLORIDA ---
  florida: [
    { id: 'centro', nombre: 'Centro' }, { id: 'prado_espanol', nombre: 'Prado Español' },
    { id: 'san_fernando', nombre: 'San Fernando' }, { id: 'floridablanca', nombre: 'Floridablanca' },
    { id: 'otro', nombre: 'Otro' }
  ],

  // --- LAVALLEJA ---
  minas: [
    { id: 'centro', nombre: 'Centro' }, { id: 'olimpico', nombre: 'Olímpico' },
    { id: 'las_delicias', nombre: 'Las Delicias' }, { id: 'la_filarmonica', nombre: 'La Filarmónica' },
    { id: 'estacion', nombre: 'Barrio Estación' },
    { id: 'otro', nombre: 'Otro' }
  ],

  // --- RÍO NEGRO ---
  fray_bentos: [
    { id: 'centro', nombre: 'Centro' }, { id: 'anglo', nombre: 'Barrio Anglo' },
    { id: 'las_canteras', nombre: 'Las Canteras' }, { id: 'union', nombre: 'Unión' },
    { id: 'otro', nombre: 'Otro' }
  ],
  young: [
    { id: 'centro', nombre: 'Centro' }, { id: 'guerra', nombre: 'Barrio Guerra' },
    { id: 'otro', nombre: 'Otro' }
  ],

  // --- ROCHA ---
  rocha: [
    { id: 'centro', nombre: 'Centro' }, { id: 'belvedere', nombre: 'Belvedere' },
    { id: 'lavalleja', nombre: 'Barrio Lavalleja' }, { id: 'treinta_y_tres', nombre: 'Barrio 33' },
    { id: 'otro', nombre: 'Otro' }
  ],
  chuy: [
    { id: 'centro', nombre: 'Centro' }, { id: 'samuel', nombre: 'Samuel' },
    { id: 'otro', nombre: 'Otro' }
  ],

  // --- SAN JOSÉ ---
  san_jose_de_mayo: [
    { id: 'centro', nombre: 'Centro' }, { id: 'colon', nombre: 'Barrio Colón' },
    { id: 'roberto_mariano', nombre: 'Roberto Mariano' }, { id: 'parque', nombre: 'Barrio Parque' },
    { id: 'molino', nombre: 'El Molino' },
    { id: 'otro', nombre: 'Otro' }
  ],
  ciudad_del_plata: [ // Es una aglomeración de fraccionamientos
    { id: 'delta_el_tigre', nombre: 'Delta El Tigre' }, { id: 'playa_pascual', nombre: 'Playa Pascual' },
    { id: 'parque_postel', nombre: 'Parque Postel' }, { id: 'santa_monica', nombre: 'Santa Mónica' },
    { id: 'otro', nombre: 'Otro' }
  ],

  // --- SORIANO ---
  mercedes: [
    { id: 'centro', nombre: 'Centro' }, { id: 'tunel', nombre: 'El Túnel' },
    { id: 'cerro', nombre: 'Cerro' }, { id: 'treinta_y_tres', nombre: 'Treinta y Tres' },
    { id: 'artigas', nombre: 'Barrio Artigas' },
    { id: 'otro', nombre: 'Otro' }
  ],
  dolores: [
    { id: 'centro', nombre: 'Centro' }, { id: 'sur', nombre: 'Zona Sur' },
    { id: 'otro', nombre: 'Otro' }
  ],

  // --- TREINTA Y TRES ---
  treinta_y_tres: [
    { id: 'centro', nombre: 'Centro' }, { id: 'olimipico', nombre: 'Olímpico' },
    { id: 'artigas', nombre: 'Artigas' }, { id: 'nanni', nombre: 'Nanni' },
    { id: 'abreau', nombre: 'Abreu' },
    { id: 'otro', nombre: 'Otro' }
  ],

  // --- FALLBACK PARA EL RESTO DE LOCALIDADES ---
  // Muchas localidades pequeñas no tienen barrios definidos.
  // Puedes usar esta lista genérica para ellas si es necesario.
  generic_small_town: [
    { id: 'centro', nombre: 'Centro' },
    { id: 'alrededores', nombre: 'Alrededores' },
    { id: 'otro', nombre: 'Otro' }
  ]
};

// Función helper para obtener barrios de una ciudad
export function getBarriosPorCiudad(cityId: string): Barrio[] {
  return barriosPorCiudad[cityId] || barriosPorCiudad.generic_small_town || [];
}
