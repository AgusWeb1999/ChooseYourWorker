#!/usr/bin/env python3
"""
Script para mejorar las landings restantes
"""

import os

# Diccionario con las mejoras específicas para cada landing
improvements = {
    "albaniles-obreros-uruguay.html": {
        "expanded_services": """            <h3>Trabajos de Albañilería Estructural</h3>
            <p>Realizamos trabajos estructurales complejos incluyendo levantamiento de paredes, pisos, techos y acabados. Nuestros albañiles cuentan con experiencia en construcciones residenciales, comerciales e industriales. Utilizamos materiales de calidad certificados y técnicas constructivas modernas. Cada trabajo se realiza siguiendo normativas de construcción vigentes en Uruguay. Garantizamos estabilidad, durabilidad y acabado de excelencia en todos nuestros proyectos.</p>
            
            <h3>Reformas y Remodelaciones Completas</h3>
            <p>Desde renovaciones parciales hasta remodelaciones integrales, nuestros obreros especializados transforman tu espacio. Realizamos trabajos coordinados en paredes, pisos, techos, ventanas e instalaciones. Planificamos cada proyecto para minimizar disrupciones. Trabajamos con transparencia en presupuestos y cronogramas. La calidad de acabados es nuestra prioridad.</p>
            
            <h3>Instalación de Pisos, Azulejos y Revestimientos</h3>
            <p>Instalación profesional de cerámicos, porcelanatos, pisos de madera, vinílicos y otros revestimientos. Nuestros albañiles preparan adecuadamente la base, aplican morteros de calidad y garantizan nivelación perfecta. Trabajamos con grandes superficies e instalaciones delicadas. Disponemos de contactos con proveedores de materiales de calidad a precios competitivos.</p>
            
            <h3>Construcción y Ampliación de Viviendas</h3>
            <p>Ampliaciones, segundo piso, garage o nuevas habitaciones. Nuestro equipo coordina todos los aspectos constructivos garantizando que tu proyecto se realice con la máxima calidad. Contamos con experiencia en cálculos estructurales, permisos municipales y materiales de construcción.</p>
            
            <h3>Reparación de Grietas y Fisuras</h3>
            <p>Identificamos las causas de grietas y aplicamos reparaciones duraderas. Desde grietas superficiales hasta problemas estructurales, contamos con soluciones profesionales. Realizamos diagnóstico para prevenir que los problemas se repitan.</p>
            
            <h3>Mantenimiento y Restauración</h3>
            <p>Restauración de fachadas antiguas, reparación de humedades, tratamiento de deterioro. Nuestros profesionales revitalizan construcciones antiguas devolviéndoles funcionalidad y estética.""",
        "related_services": [
            ("sanitarios-uruguay.html", "🚰 Instaladores de Sanitarios", "Especialistas en sanitarios e instalaciones hidráulicas"),
            ("plomeros-sanitarios-uruguay.html", "💧 Plomeros Sanitarios", "Reparación y instalación de sistemas de agua"),
            ("obreros-construccion-uruguay.html", "🏗️ Obreros de Construcción", "Equipos de construcción general"),
            ("mantenimiento-edificios-administradoras.html", "🔧 Mantenimiento de Edificios", "Mantenimiento integral para buildings"),
            ("servicios-construccion-uruguay.html", "🛠️ Servicios de Construcción", "Soluciones generales de construcción"),
        ]
    },
    "obreros-construccion-uruguay.html": {
        "expanded_services": """            <h3>Proyectos de Construcción Completos</h3>
            <p>Desde casas unifamiliares hasta proyectos comerciales, nuestro equipo de obreros especializados maneja todas las fases constructivas. Contamos con capataces experimentados que coordinan albañiles, electricistas, plomeros y otros oficios. Garantizamos cronogramas respetados y presupuestos transparentes. Utilizamos materiales certificados y técnicas constructivas modernas.</p>
            
            <h3>Ampliaciones y Segundos Pisos</h3>
            <p>Expandir tu vivienda requiere planificación y coordinación profesional. Nuestros obreros manejan todas las etapas: cimientos, estructura, terminaciones. Contamos con experiencia en cálculos de carga, permisos municipales y materiales adecuados. Trabajamos minimizando disrupciones en tu hogar actual.</p>
            
            <h3>Remodelaciones Integrales</h3>
            <p>Transformar tu hogar completamente requiere expertos coordinados. Realizamos demoliciones controladas, nuevas construcciones y acabados. Nuestro equipo maneja simultáneamente trabajos de estructuras, instalaciones eléctricas, sanitarias y acabados.</p>
            
            <h3>Movimiento de Tierra y Cimientos</h3>
            <p>Preparación de terrenos, excavaciones, rellenos compactados y cimientos profesionales. Contamos con equipamiento y conocimiento técnico para realizar trabajos de movimiento de tierra con precisión. Garantizamos cimientos estables que sostengan correctamente la estructura.</p>
            
            <h3>Obras Especializadas</h3>
            <p>Piscinas, garajes, depósitos, cobertizos y estructuras especiales. Cada proyecto recibe atención personalizada con técnicas y materiales adecuados para el tipo de obra.</p>
            
            <h3>Control de Calidad y Supervisión</h3>
            <p>Supervisión permanente de obras garantizando cumplimiento de especificaciones técnicas, seguridad en obra y cronogramas. Reportes regulares mantienen informado del progreso del proyecto.""",
        "related_services": [
            ("sanitarios-uruguay.html", "🚰 Instaladores de Sanitarios", "Especialistas en sanitarios"),
            ("plomeros-sanitarios-uruguay.html", "💧 Plomeros Sanitarios", "Servicios de plomería profesional"),
            ("albaniles-obreros-uruguay.html", "👷 Albañiles y Obreros", "Trabajos de albañilería"),
            ("mantenimiento-edificios-administradoras.html", "🔧 Mantenimiento de Edificios", "Mantenimiento para buildings"),
            ("servicios-construccion-uruguay.html", "🛠️ Servicios de Construcción", "Soluciones de construcción"),
        ]
    },
    "mantenimiento-edificios-administradoras.html": {
        "expanded_services": """            <h3>Mantenimiento Preventivo Integral</h3>
            <p>Programas de mantenimiento diseñados específicamente para tu edificio o condominio. Inspecciones periódicas identifican problemas antes de que se conviertan en emergencias costosas. Mantenemos en óptimas condiciones estructuras, instalaciones eléctricas, sanitarias y de gas. Reducimos costos a largo plazo y aseguramos seguridad para residentes y usuarios.</p>
            
            <h3>Reparaciones de Emergencia 24/7</h3>
            <p>Fugas críticas, fallas eléctricas, inundaciones. Cuando surge una emergencia en el edificio, disponemos de respuesta rápida 24/7. Nuestros técnicos especializados actúan inmediatamente minimizando daños. Coordinamos múltiples oficios para soluciones integrales y rápidas.</p>
            
            <h3>Administración de Proveedores y Presupuestos</h3>
            <p>Gestión de relaciones con plomeros, electricistas, albañiles y otros proveedores. Obtenemos presupuestos competitivos, coordinamos trabajos y supervisamos calidad. Tu administradora recibe reportes claros y transparentes de todos los gastos y trabajos realizados.</p>
            
            <h3>Limpieza y Mantenimiento de Áreas Comunes</h3>
            <p>Mantenimiento de pasillos, escaleras, patios, terrazas y estacionamiento. Incluye limpieza regular, control de plagas, mantenimiento de jardines y áreas verdes. Aseguramos espacios comunes limpios, seguros y bien mantenidos.</p>
            
            <h3>Inspección Técnica de Edificios</h3>
            <p>Evaluación profesional del estado general de la construcción. Identificamos problemas estructurales, humedades, deterioros y áreas de riesgo. Presentamos reportes detallados con recomendaciones de reparación. Útil para prevención y para cumplir requisitos de seguros.</p>
            
            <h3>Coordinación de Servicios Especializados</h3>
            <p>Desde reparación de ascensores hasta revisión de sistemas de seguridad, coordinamos todos los servicios especializados que requiere tu edificio. Supervisamos calidad y garantizamos cumplimiento de especificaciones técnicas.""",
        "related_services": [
            ("sanitarios-uruguay.html", "🚰 Instaladores de Sanitarios", "Especialistas en sanitarios"),
            ("plomeros-sanitarios-uruguay.html", "💧 Plomeros Sanitarios", "Reparación sanitaria"),
            ("albaniles-obreros-uruguay.html", "👷 Albañiles y Obreros", "Trabajos de construcción"),
            ("obreros-construccion-uruguay.html", "🏗️ Obreros de Construcción", "Construcción general"),
            ("servicios-construccion-uruguay.html", "🛠️ Servicios de Construcción", "Soluciones de construcción"),
        ]
    },
    "servicios-construccion-uruguay.html": {
        "expanded_services": """            <h3>Servicios Integrales de Construcción</h3>
            <p>Desde proyectos pequeños hasta desarrollos inmobiliarios completos, ofrecemos soluciones constructivas. Nuestro equipo maneja todas las disciplinas: estructura, instalaciones, acabados. Garantizamos proyectos realizados con calidad, a tiempo y dentro de presupuesto. Contamos con experiencia en vivienda, comercial, industrial y proyectos especiales.</p>
            
            <h3>Diseño, Planificación y Ejecución</h3>
            <p>Coordinamos arquitectos, ingenieros y constructores para transformar tu visión en realidad. Desde diseño preliminar hasta ejecución final, supervisamos cada detalle. Tramitamos permisos municipales y cumplimos normativas de construcción vigentes.</p>
            
            <h3>Reformas Residenciales Personalizadas</h3>
            <p>Renovaciones parciales o completas de tu hogar. Cocinas modernas, baños de lujo, pisos nuevos, distribuciones optimizadas. Nuestros profesionales trabajan considerando funcionalidad, estética y durabilidad. Minimizamos molestias durante la ejecución.</p>
            
            <h3>Construcción de Viviendas Nuevas</h3>
            <p>Construcción de casas desde los cimientos. Coordinamos todos los aspectos: terreno, cimientos, estructura, instalaciones, acabados. Cada fase es supervisada asegurando calidad. Trabajamos con materiales certificados y técnicas constructivas modernas.</p>
            
            <h3>Proyectos Comerciales e Industriales</h3>
            <p>Locales comerciales, oficinas, fábricas y espacios industriales especializados. Entendemos las necesidades funcionales de espacios comerciales e industriales. Diseñamos y construimos espacios optimizados para tus operaciones.</p>
            
            <h3>Consultoría Técnica y Presupuestos</h3>
            <p>Asesoramiento profesional para tu proyecto de construcción. Evaluamos viabilidad, presupuestos realistas y cronogramas factibles. Te guiamos en decisiones técnicas para optimizar resultados y costos.""",
        "related_services": [
            ("sanitarios-uruguay.html", "🚰 Instaladores de Sanitarios", "Especialistas en sanitarios"),
            ("plomeros-sanitarios-uruguay.html", "💧 Plomeros Sanitarios", "Servicios de plomería"),
            ("albaniles-obreros-uruguay.html", "👷 Albañiles y Obreros", "Trabajos de albañilería"),
            ("obreros-construccion-uruguay.html", "🏗️ Obreros de Construcción", "Equipos de construcción"),
            ("mantenimiento-edificios-administradoras.html", "🔧 Mantenimiento de Edificios", "Mantenimiento integral"),
        ]
    }
}

def update_landing(filename, expanded_content, related_services):
    """Actualiza una landing con contenido expandido y enlaces internos"""
    filepath = f"/Users/agusmazzini/Desktop/projectos/chooseYourWorker/servicios/{filename}"
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Buscar y reemplazar la sección "Servicios de..."
    import re
    
    # Encontrar la sección services-grid y reemplazarla
    pattern = r'(<h2>Servicios de[^<]*</h2>.*?)(</section>)'
    
    replacement = f'''\\1
            {expanded_content}
            
            <div class="services-grid">
                <div class="service-card">
                    <h4>🔧 Servicios Especializados</h4>
                    <p>Acceso a profesionales especializados en múltiples disciplinas.</p>
                </div>
                <div class="service-card">
                    <h4>💼 Asesoramiento Profesional</h4>
                    <p>Consultoría técnica para optimizar tu proyecto.</p>
                </div>
                <div class="service-card">
                    <h4>✓ Garantía de Calidad</h4>
                    <p>Trabajos realizados con máxima calidad y profesionalismo.</p>
                </div>
                <div class="service-card">
                    <h4>📞 Atención Personalizada</h4>
                    <p>Equipo dedicado a resolver tus necesidades específicas.</p>
                </div>
                <div class="service-card">
                    <h4>⏱️ Respuesta Rápida</h4>
                    <p>Disponibilidad para emergencias 24/7.</p>
                </div>
                <div class="service-card">
                    <h4>🎯 Presupuestos Transparentes</h4>
                    <p>Cotizaciones claras sin sorpresas.</p>
                </div>
            </div>
\\2'''
    
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    # Agregar sección de servicios relacionados antes del footer
    related_html = f'''
        <section>
            <h2>Otros Servicios Profesionales que Ofrecemos</h2>
            <p style="font-size: 1.05em; margin-bottom: 30px;">En WorkingGo contamos con profesionales especializados en diversos servicios de construcción y mantenimiento en Uruguay. Explora nuestras otras especialidades:</p>
            
            <div class="services-grid">
'''
    
    for service_file, service_title, service_desc in related_services:
        related_html += f'''                <div class="service-card">
                    <h4><a href="/servicios/{service_file}" style="text-decoration: none; color: inherit;">{service_title}</a></h4>
                    <p>{service_desc}</p>
                </div>
'''
    
    related_html += '''            </div>
        </section>
'''
    
    # Insertar antes del footer
    content = content.replace('</body>', f'{related_html}</body>')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Actualizado: {filename}")

# Actualizar todas las landings
if __name__ == "__main__":
    print("\n" + "="*70)
    print("ACTUALIZANDO LANDINGS SEO")
    print("="*70 + "\n")
    
    for filename, data in improvements.items():
        update_landing(filename, data["expanded_services"], data["related_services"])
    
    print("\n" + "="*70)
    print("✓ TODAS LAS LANDINGS HAN SIDO ACTUALIZADAS")
    print("="*70 + "\n")
