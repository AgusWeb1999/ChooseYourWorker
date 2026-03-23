#!/usr/bin/env python3
"""
Script para validar que todas las landings tengan links correctos a la home y a otras landings
"""

import os
import re
from pathlib import Path

def check_landing_links(filepath):
    """Verifica los links de una landing"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    filename = os.path.basename(filepath)
    issues = []
    
    # Verificar que haya links a home
    home_links = re.findall(r'href="(?:/|https://working-go\.com/?)"', content)
    cta_buttons = re.findall(r'class="cta-button"', content)
    
    if len(home_links) < 2:
        issues.append(f"Pocas referencias a home ({len(home_links)} encontrados)")
    
    # Verificar que haya enlaces internos a otras landings
    internal_links = re.findall(r'href="/servicios/[\w-]+\.html"', content)
    
    if len(internal_links) == 0:
        issues.append("Sin enlaces internos a otras landings")
    
    # Verificar que haya buttons CTA
    if len(cta_buttons) < 2:
        issues.append(f"Pocos CTAs ({len(cta_buttons)} encontrados)")
    
    # Verificar meta tags
    has_title = bool(re.search(r'<title>[^<]+</title>', content))
    has_description = bool(re.search(r'<meta\s+name="description"', content))
    has_og_title = bool(re.search(r'<meta\s+property="og:title"', content))
    
    if not (has_title and has_description and has_og_title):
        issues.append("Meta tags incompletos")
    
    # Contar palabras (aproximado)
    text = re.sub(r'<[^>]+>', '', content)
    words = len(text.split())
    
    if words < 1500:
        issues.append(f"Contenido bajo ({words} palabras, necesita 1500+)")
    
    return {
        "file": filename,
        "home_links": len(home_links),
        "internal_links": len(internal_links),
        "cta_buttons": len(cta_buttons),
        "word_count": words,
        "issues": issues
    }

def main():
    landings_dir = "/Users/agusmazzini/Desktop/projectos/chooseYourWorker/servicios"
    
    # Buscar todas las landings SEO
    landings = [
        "sanitarios-uruguay.html",
        "plomeros-sanitarios-uruguay.html",
        "albaniles-obreros-uruguay.html",
        "obreros-construccion-uruguay.html",
        "mantenimiento-edificios-administradoras.html",
        "servicios-construccion-uruguay.html",
    ]
    
    print("\n" + "="*80)
    print("VALIDACIÓN DE LINKS EN LANDINGS SEO")
    print("="*80 + "\n")
    
    total_issues = 0
    
    for landing in landings:
        filepath = os.path.join(landings_dir, landing)
        
        if not os.path.exists(filepath):
            print(f"❌ {landing}: ARCHIVO NO ENCONTRADO")
            continue
        
        result = check_landing_links(filepath)
        
        if result["issues"]:
            print(f"⚠️  {result['file']}:")
            print(f"   Links a home: {result['home_links']}")
            print(f"   Enlaces internos: {result['internal_links']}")
            print(f"   CTAs: {result['cta_buttons']}")
            print(f"   Palabras: {result['word_count']}")
            for issue in result['issues']:
                print(f"   ❌ {issue}")
            total_issues += len(result['issues'])
        else:
            print(f"✅ {result['file']}: OK")
            print(f"   Links a home: {result['home_links']}, Enlaces internos: {result['internal_links']}, CTAs: {result['cta_buttons']}, Palabras: {result['word_count']}")
        print()
    
    print("="*80)
    if total_issues == 0:
        print("✅ TODAS LAS LANDINGS ESTÁN CORRECTAMENTE CONFIGURADAS")
    else:
        print(f"⚠️  ENCONTRADOS {total_issues} PROBLEMAS A CORREGIR")
    print("="*80 + "\n")

if __name__ == "__main__":
    main()
