#!/usr/bin/env python3
"""
Script para mejorar todas las landings SEO agregando:
1. Contenido expandido (2000+ palabras)
2. Enlaces internos a otras landings
3. Sección de servicios relacionados mejorada
"""

import os
import re

def expand_landing_content(filename, service_name, main_keyword, related_services):
    """
    Expande el contenido de una landing con más detalles
    """
    filepath = f"/Users/agusmazzini/Desktop/projectos/chooseYourWorker/servicios/{filename}"
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Expandir la sección de servicios principales
    expanded_services = f"""    <section>
        <h2>Servicios de {service_name}</h2>
        
        <h3>Instalación Profesional de {service_name}</h3>
        <p>Contamos con especialistas certificados en la instalación de {service_name} con las más altas calidad y profesionalismo. Nuestros instaladores tienen años de experiencia en proyectos residenciales, comerciales e industriales. Utilizamos únicamente materiales de primera calidad de marcas reconocidas internacionalmente. Cada instalación es ejecutada siguiendo normativas técnicas vigentes en Uruguay y se somete a pruebas exhaustivas antes de ser entregada. Garantizamos que el trabajo quedará perfecto y durará años sin problemas.</p>
        
        <h3>Reparación y Mantenimiento de {service_name}</h3>
        <p>Los problemas con {service_name} requieren atención urgente. Nuestros técnicos diagnostican el problema rápidamente y aplican la solución más adecuada. Realizamos mantenimiento preventivo para evitar problemas mayores en el futuro. El servicio de emergencia está disponible 24/7 para garantizar que no quedés sin acceso a servicios esenciales. La experiencia de nuestros plomeros les permite identificar problemas incluso en sistemas antiguos o complejos.</p>
        
        <h3>Upgrade y Modernización de {service_name}</h3>
        <p>¿Tienes {service_name} antiguo? Te ofrecemos la oportunidad de modernizar tu sistema con tecnología actual. Los sistemas nuevos son más eficientes, económicos y fáciles de mantener. Realizamos la deinstalación segura de equipos antiguos y la instalación profesional de nuevos modelos. Te asesoramos en la selección de opciones que se adapten a tu presupuesto y necesidades específicas.</p>
        
        <h3>Servicios de Emergencia</h3>
        <p>Cuando surge un problema urgente, cada minuto cuenta. Ofrecemos servicio de emergencia 24/7 en toda Uruguay. Llamada directa a técnicos especializados, presupuesto verbal y atención inmediata son garantizados. Disponibilidad los 365 días del año incluyendo noches, fines de semana y feriados. Respuesta rápida para minimizar daños en tu propiedad.</p>
        
        <h3>Asesoría Técnica y Presupuestos</h3>
        <p>Antes de contratar cualquier servicio, ofrecemos consulta técnica sin compromiso. Nuestros especialistas evalúan tu situación específica y presentan opciones personalizadas. Los presupuestos son claros, detallados y sin sorpresas. Te explicamos cada paso del proceso para que tomes decisiones informadas. Contamos con múltiples opciones de pago para facilitar tu acceso al servicio.</p>
    </section>
"""
    
    # Reemplazar la sección de servicios
    content = re.sub(
        r'<section>[\s\n]*<h2>Servicios.*?</section>',
        expanded_services,
        content,
        flags=re.DOTALL
    )
    
    # Crear sección de servicios relacionados
    related_html = f"""    <section>
        <h2>Otros Servicios Que Ofrecemos en Uruguay</h2>
        <p style="font-size: 1.05em; margin-bottom: 30px;">En WorkingGo tenemos una amplia red de profesionales especializados en diversos servicios de construcción, plomería y mantenimiento en Uruguay. Si necesitas otros servicios complementarios a {service_name}, aquí te mostramos nuestras otras especialidades:</p>
        
        <div class="services-grid">
"""
    
    # Agregar servicios relacionados con enlaces
    for service_file, service_title, service_desc in related_services:
        related_html += f"""            <div class="service-card">
                <h4><a href="/servicios/{service_file}" style="text-decoration: none; color: inherit;">🔗 {service_title}</a></h4>
                <p>{service_desc}</p>
            </div>
"""
    
    related_html += """        </div>
    </section>"""
    
    # Buscar y reemplazar la sección de "Cómo Funciona" y agregar servicios relacionados
    if "Servicios Relacionados" in content or "servicios complementarios" in content.lower():
        # Ya existe, reemplazar
        content = re.sub(
            r'<section>[\s\n]*<h2>(?:Servicios Relacionados|Otros Servicios).*?</section>',
            related_html,
            content,
            flags=re.DOTALL
        )
    else:
        # No existe, agregar antes del footer
        content = content.replace(
            "</body>",
            f"\n    {related_html}\n</body>"
        )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Mejorada landing: {filename}")

# Landings a mejorar
landings_to_improve = [
    (
        "plomeros-sanitarios-uruguay.html",
        "Plomería y Sanitarios",
        "plomeros sanitarios uruguay",
        [
            ("sanitarios-uruguay.html", "Instaladores de Sanitarios", "Especialistas en instalación y reparación de inodoros modernos"),
            ("albaniles-obreros-uruguay.html", "Albañiles y Obreros", "Profesionales en trabajos de construcción y albañilería estructural"),
            ("obreros-construccion-uruguay.html", "Obreros de Construcción", "Equipos especializados para proyectos de construcción completos"),
            ("mantenimiento-edificios-administradoras.html", "Mantenimiento de Edificios", "Servicio integral de mantenimiento para buildings y consorcios"),
            ("servicios-construccion-uruguay.html", "Servicios de Construcción", "Soluciones integrales en construcción y reformas"),
        ]
    ),
    (
        "albaniles-obreros-uruguay.html",
        "Albañilería y Obrería",
        "albaniles obreros uruguay",
        [
            ("sanitarios-uruguay.html", "Instaladores de Sanitarios", "Especialistas en instalación y reparación de sanitarios"),
            ("plomeros-sanitarios-uruguay.html", "Plomeros Sanitarios", "Profesionales en reparación de tuberías y sistemas de agua"),
            ("obreros-construccion-uruguay.html", "Obreros de Construcción", "Equipos completos para proyectos de construcción"),
            ("mantenimiento-edificios-administradoras.html", "Mantenimiento de Edificios", "Servicio de mantenimiento para administradoras"),
            ("servicios-construccion-uruguay.html", "Servicios de Construcción", "Soluciones generales de construcción y reforma"),
        ]
    ),
    (
        "obreros-construccion-uruguay.html",
        "Construcción General",
        "obreros construccion uruguay",
        [
            ("sanitarios-uruguay.html", "Instaladores de Sanitarios", "Especialistas en sanitarios e instalaciones"),
            ("plomeros-sanitarios-uruguay.html", "Plomeros Sanitarios", "Reparación y instalación de sistemas de agua"),
            ("albaniles-obreros-uruguay.html", "Albañiles y Obreros", "Profesionales en trabajos estructurales"),
            ("mantenimiento-edificios-administradoras.html", "Mantenimiento de Edificios", "Mantenimiento integral para edificios"),
            ("servicios-construccion-uruguay.html", "Servicios de Construcción", "Soluciones generales de construcción"),
        ]
    ),
    (
        "mantenimiento-edificios-administradoras.html",
        "Mantenimiento de Edificios",
        "mantenimiento edificios administradoras uruguay",
        [
            ("sanitarios-uruguay.html", "Instaladores de Sanitarios", "Especialistas en instalación de sanitarios"),
            ("plomeros-sanitarios-uruguay.html", "Plomeros Sanitarios", "Reparación de sistemas sanitarios"),
            ("albaniles-obreros-uruguay.html", "Albañiles y Obreros", "Trabajos de albañilería y construcción"),
            ("obreros-construccion-uruguay.html", "Obreros de Construcción", "Equipos de construcción general"),
            ("servicios-construccion-uruguay.html", "Servicios de Construcción", "Soluciones de construcción integral"),
        ]
    ),
    (
        "servicios-construccion-uruguay.html",
        "Servicios de Construcción",
        "servicios construccion uruguay",
        [
            ("sanitarios-uruguay.html", "Instaladores de Sanitarios", "Especialistas en sanitarios"),
            ("plomeros-sanitarios-uruguay.html", "Plomeros Sanitarios", "Servicios de plomería profesional"),
            ("albaniles-obreros-uruguay.html", "Albañiles y Obreros", "Profesionales en albañilería"),
            ("obreros-construccion-uruguay.html", "Obreros de Construcción", "Equipos de construcción general"),
            ("mantenimiento-edificios-administradoras.html", "Mantenimiento de Edificios", "Mantenimiento integral de edificios"),
        ]
    ),
]

if __name__ == "__main__":
    print("\n" + "="*70)
    print("MEJORANDO LANDINGS SEO")
    print("="*70 + "\n")
    
    for landing_file, service_name, keyword, related in landings_to_improve:
        expand_landing_content(landing_file, service_name, keyword, related)
    
    print("\n" + "="*70)
    print("✓ TODAS LAS LANDINGS HAN SIDO MEJORADAS")
    print("="*70 + "\n")
