// Departamentos de Uruguay
export const DEPARTAMENTOS_URUGUAY = [
  { id: 'AR', nombre: 'Artigas' },
  { id: 'CA', nombre: 'Canelones' },
  { id: 'CL', nombre: 'Cerro Largo' },
  { id: 'CO', nombre: 'Colonia' },
  { id: 'DU', nombre: 'Durazno' },
  { id: 'FS', nombre: 'Flores' },
  { id: 'FD', nombre: 'Florida' },
  { id: 'LA', nombre: 'Lavalleja' },
  { id: 'MA', nombre: 'Maldonado' },
  { id: 'MO', nombre: 'Montevideo' },
  { id: 'PA', nombre: 'Paysandú' },
  { id: 'RN', nombre: 'Río Negro' },
  { id: 'RV', nombre: 'Rivera' },
  { id: 'RO', nombre: 'Rocha' },
  { id: 'SA', nombre: 'Salto' },
  { id: 'SJ', nombre: 'San José' },
  { id: 'SO', nombre: 'Soriano' },
  { id: 'TA', nombre: 'Tacuarembó' },
  { id: 'TT', nombre: 'Treinta y Tres' }
];

// Ciudades por departamento de Uruguay
export const CIUDADES_POR_DEPARTAMENTO: Record<string, {id:string, nombre:string}[]> = {
  AR: [ // Artigas
    {id:'artigas', nombre:'Artigas'}, {id:'bella_union', nombre:'Bella Unión'}, {id:'tomas_gomensoro', nombre:'Tomás Gomensoro'}, 
    {id:'baltasar_brum', nombre:'Baltasar Brum'}, {id:'sequeira', nombre:'Sequeira'}, {id:'berrnabe_rivera', nombre:'Bernabé Rivera'}, 
    {id:'javier_de_viana', nombre:'Javier de Viana'}, {id:'topador', nombre:'Topador'}
  ],
  CA: [ // Canelones
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
  TA: [ // Tacuarembó
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

export function getCiudadesPorDepartamento(departmentId: string): {id:string, nombre:string}[] {
  return CIUDADES_POR_DEPARTAMENTO[departmentId] || [];
}
