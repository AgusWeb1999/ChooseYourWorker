#!/usr/bin/env python3
import os
import re

print("\n" + "="*70)
print("QUICK LOCAL TEST - VERIFICACIÓN DE LANDINGS")
print("="*70 + "\n")

root = "/Users/agusmazzini/Desktop/projectos/chooseYourWorker"
landings = [
    "servicios/sanitarios-uruguay.html",
    "servicios/plomeros-sanitarios-uruguay.html",
    "servicios/albaniles-obreros-uruguay.html",
    "servicios/obreros-construccion-uruguay.html",
    "servicios/mantenimiento-edificios-administradoras.html",
    "servicios/servicios-construccion-uruguay.html",
]

for landing in landings:
    filepath = os.path.join(root, landing)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Contar palabras
    word_count = len(content.split())
    
    # Verificar elementos SEO
    has_title = bool(re.search(r'<title>[^<]+</title>', content))
    has_meta_desc = bool(re.search(r'<meta\s+name="description"', content))
    has_h1 = bool(re.search(r'<h1[^>]*>', content))
    has_faq = bool(re.search(r'FAQ|preguntas frecuentes|frequently asked', content, re.I))
    
    # Contar enlaces internos (working-go.com)
    internal_links = len(re.findall(r'working-go\.com/servicios/', content))
    
    # Mostrar resultado
    filename = landing.split('/')[-1]
    print(f"📄 {filename}")
    print(f"   Palabras: {word_count} {'✓' if word_count >= 1500 else '✗ (< 1500)'}")
    print(f"   Meta Title: {'✓' if has_title else '✗'}")
    print(f"   Meta Description: {'✓' if has_meta_desc else '✗'}")
    print(f"   H1 Tags: {'✓' if has_h1 else '✗'}")
    print(f"   FAQ Section: {'✓' if has_faq else '✗'}")
    print(f"   Enlaces internos: {internal_links} {'✓' if internal_links > 0 else '✗'}")
    print()

print("="*70)
print("✓ TEST COMPLETADO")
print("="*70 + "\n")
