#!/usr/bin/env python3
"""Expandir contenido de las 4 landings restantes para alcanzar 1500+ palabras"""

import re

landings_to_expand = {
    "servicios/albaniles-obreros-uruguay.html": """
            <h3>Importancia de Contratar Profesionales Certificados</h3>
            <p>La obra civil es un ámbito donde la calidad y la experiencia son fundamentales. Un trabajo mal ejecutado no solo afecta la estética de tu hogar, sino que puede comprometer la seguridad estructural de la construcción. Los albañiles y obreros certificados cuentan con conocimiento de normativas de construcción, técnicas de levante de carga, uso correcto de andamios y medidas de seguridad en obra.</p>
            
            <p>Contratar profesionales verificados reduce riesgos de accidentes laborales, garantiza que se utilicen materiales de calidad certificada y asegura que los trabajos cumplan con estándares técnicos vigentes. En WorkingGo verificamos la experiencia de cada profesional antes de incluirlo en nuestra plataforma.</p>
            
            <h3>Cronograma y Planificación de Obras</h3>
            <p>Una reforma exitosa depende de una buena planificación. Nuestros albañiles establecen cronogramas realistas, comunican avances regularmente y coordinan con otros oficios cuando es necesario. Explicamos el proceso paso a paso para que entiendas qué se está haciendo, cuánto tiempo llevará y qué esperar en cada etapa.</p>
            
            <h3>Materiales de Calidad a Precios Competitivos</h3>
            <p>Nuestros profesionales cuentan con conexiones con distribuidoras de materiales de construcción en todo Uruguay. Pueden asesorarte sobre opciones de calidad variable según tu presupuesto. Desde materiales económicos hasta premium, contamos con alternativas que se ajustan a diferentes necesidades y capacidades de inversión.""",
    
    "servicios/obreros-construccion-uruguay.html": """
            <h3>Coordinación Eficiente de Múltiples Disciplinas</h3>
            <p>Un proyecto de construcción involucra múltiples disciplinas: albañilería, electricidad, plomería, pintura, carpintería y más. Coordinar efectivamente a todos estos profesionales es clave para que los trabajos se realicen en orden lógico y sin retrasos. Nuestro equipo de obreros experimentados entiende las dependencias entre oficios y planifica la secuencia óptima de actividades.</p>
            
            <p>La mala coordinación entre oficios genera retrasos, sobrecostos y calidad deficiente. Evitamos esto con capataces que supervisan simultáneamente todas las fases, coordinan entregas de materiales y garantizan que cada etapa cumple especificaciones antes de pasar a la siguiente.</p>
            
            <h3>Seguridad en Obra y Cumplimiento de Normativas</h3>
            <p>La seguridad en obra no es negociable. Nuestros equipos cumplen con regulaciones laborales vigentes, utilizan equipamiento de protección personal, mantienen orden en el sitio y aplican prácticas seguras en todas las actividades. Proteges tu inversión y evitas problemas legales contratando profesionales responsables con la seguridad.</p>
            
            <h3>Reportes de Progreso y Transparencia</h3>
            <p>Mantenemos comunicación constante con propietarios. Reportes semanales, fotos de avance y actualizaciones sobre cronograma mantienen informado el estado real del proyecto. Cualquier cambio, inconveniente o desviación presupuestaria es comunicado inmediatamente para tomar decisiones oportunas.""",
    
    "servicios/mantenimiento-edificios-administradoras.html": """
            <h2>Preguntas Frecuentes sobre Mantenimiento de Edificios</h2>
            
            <h3>¿Qué incluye un programa de mantenimiento preventivo?</h3>
            <p>Inspecciones regulares de estructuras, tuberías, instalaciones eléctricas, sistemas de gas, limpieza de desagües comunes, mantenimiento de ascensores, control de plagas y reparaciones menores. Varía según necesidades específicas del edificio.</p>
            
            <h3>¿Con qué frecuencia debo hacer mantenimiento?</h3>
            <p>Esto depende de la edad del edificio y su estado. Generalmente recomendamos inspecciones mensuales o trimestrales. Los sistemas críticos como ascensores requieren mantenimiento más frecuente según normativas de seguridad.</p>
            
            <h3>¿Cómo se manejan emergencias?</h3>
            <p>Tenemos servicio de emergencia 24/7. En caso de inundación, falla eléctrica u otros problemas críticos, llamamos inmediatamente a los técnicos especializados. El tiempo de respuesta es crucial para minimizar daños.</p>
            
            <h3>¿Puedo ahorrar costos en mantenimiento?</h3>
            <p>El mantenimiento preventivo es más económico a largo plazo que reparaciones de emergencia. Pequeños problemas detectados tempranamente son más baratos de solucionar que esperar a que se conviertan en desastres costosos.</p>
            
            <h3>¿Qué sucede si un proveedor hace un mal trabajo?</h3>
            <p>Supervisamos calidad de todos los trabajos. Si no estamos satisfechos, coordinamos correcciones sin costo adicional para garantizar que el problema se solucione correctamente.</p>
            
            <h3>¿Cómo se comunican los gastos a los residentes?</h3>
            <p>Reportes detallados mensuales muestran exactamente qué trabajos se realizaron, cuánto costaron y por qué fueron necesarios. Transparencia total en todos los gastos.
            
            <h3>Importancia del Mantenimiento Proactivo</h3>
            <p>Un edificio es una inversión importante para cada residente. El mantenimiento proactivo protege esa inversión evitando que problemas pequeños se conviertan en grandes costosos. Los edificios bien mantenidos mantienen su valor de propiedad y ofrecen mejor calidad de vida a residentes. Administradoras que invierten en mantenimiento integral reportan mayor satisfacción de propietarios y menos conflictos.""",
    
    "servicios/servicios-construccion-uruguay.html": """
            <h3>Tipos de Proyectos que Ejecutamos</h3>
            <p>Tenemos experiencia en proyectos variados: casas unifamiliares, apartamentos, edificios comerciales, oficinas, locales de retail, galpones, depósitos y estructuras especializadas. Cada tipo de proyecto tiene requisitos técnicos diferentes. Nuestro equipo entiende estas particularidades y adapta procesos para cada caso específico.</p>
            
            <p>Proyectos residenciales requieren atención a detalles de terminación y comodidad. Proyectos comerciales e industriales necesitan cumplimiento estricto de cronogramas y funcionalidad operativa. Adaptamos nuestros enfoques según naturaleza del proyecto.</p>
            
            <h3>Gestión de Presupuestos y Financiamiento</h3>
            <p>Ofrecemos presupuestos realistas basados en análisis detallado del proyecto. Desglosamos costos por rubros: estructura, instalaciones, acabados, etc. Esta claridad te permite tomar decisiones informadas. Si necesitas ajustar presupuesto, exploram opciones: materiales alternativos, fases de ejecución, técnicas constructivas que optimizen costos sin sacrificar calidad.</p>
            
            <h3>Cumplimiento de Normativas Municipales y Permisos</h3>
            <p>Toda construcción requiere permisos municipales, planos aprobados y cumplimiento de códigos de construcción vigentes. Facilitamos estos trámites coordinando con municipios, obtuviendo aprobaciones necesarias y garantizando que tu proyecto cumple todo requisito legal. Evitas problemas posteriores cumpliendo regulaciones desde el inicio."""
}

for filepath, content_to_add in landings_to_expand.items():
    full_path = f"/Users/agusmazzini/Desktop/projectos/chooseYourWorker/{filepath}"
    
    with open(full_path, 'r', encoding='utf-8') as f:
        file_content = f.read()
    
    # Insertar contenido antes del último </section> (antes de servicios relacionados)
    # Buscar la sección "Cobertura Geográfica" o similar y agregar contenido después
    
    insertion_point = file_content.rfind('<section>')
    if insertion_point != -1:
        # Encontrar el cierre de esa sección
        section_close = file_content.find('</section>', insertion_point)
        if section_close != -1:
            # Insertar antes de la última sección
            new_content = file_content[:section_close] + f"\n{content_to_add}\n        " + file_content[section_close:]
            
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            print(f"✓ Expandido: {filepath}")

print("\n✓ Todas las landings han sido expandidas")
