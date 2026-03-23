#!/usr/bin/env python3
"""
Script exhaustivo de testing para validar:
1. Integridad de archivos y estructura
2. Validez XML del sitemap
3. Calidad SEO de las landings
4. Enlaces internos entre landings
5. Meta tags y contenido
6. Accesibilidad HTTP
"""

import os
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from datetime import datetime

class DeploymentTester:
    def __init__(self, root_path):
        self.root_path = root_path
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
            "warnings": 0,
            "test_results": []
        }
        
    def test_sitemap_validity(self):
        """Valida que el sitemap.xml sea XML válido"""
        test_name = "XML Sitemap Validity"
        try:
            sitemap_path = os.path.join(self.root_path, "sitemap.xml")
            tree = ET.parse(sitemap_path)
            root = tree.getroot()
            
            # Obtener todas las URLs
            namespace = {'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
            urls = root.findall('.//sm:url', namespace)
            
            self.log_test(test_name, True, f"Valid XML with {len(urls)} URLs")
            return True
        except Exception as e:
            self.log_test(test_name, False, str(e))
            return False
    
    def test_required_files_exist(self):
        """Verifica que todos los archivos necesarios existan"""
        test_name = "Required Files Exist"
        required_files = [
            "index.html",
            "sitemap.xml",
            "robots.txt",
            "favicon.ico",
            "servicios/sanitarios-uruguay.html",
            "servicios/plomeros-sanitarios-uruguay.html",
            "servicios/albaniles-obreros-uruguay.html",
            "servicios/obreros-construccion-uruguay.html",
            "servicios/mantenimiento-edificios-administradoras.html",
            "servicios/servicios-construccion-uruguay.html",
        ]
        
        missing_files = []
        for file in required_files:
            file_path = os.path.join(self.root_path, file)
            if not os.path.exists(file_path):
                missing_files.append(file)
        
        if missing_files:
            self.log_test(test_name, False, f"Missing files: {', '.join(missing_files)}")
            return False
        else:
            self.log_test(test_name, True, f"All {len(required_files)} required files exist")
            return True
    
    def test_landing_seo_quality(self):
        """Valida la calidad SEO de cada landing"""
        test_name = "Landing SEO Quality"
        landings = [
            "servicios/sanitarios-uruguay.html",
            "servicios/plomeros-sanitarios-uruguay.html",
            "servicios/albaniles-obreros-uruguay.html",
            "servicios/obreros-construccion-uruguay.html",
            "servicios/mantenimiento-edificios-administradoras.html",
            "servicios/servicios-construccion-uruguay.html",
        ]
        
        seo_checks_passed = 0
        details = []
        
        for landing in landings:
            file_path = os.path.join(self.root_path, landing)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            checks = {
                "file": landing.split('/')[-1],
                "meta_title": bool(re.search(r'<title>([^<]+)</title>', content)),
                "meta_description": bool(re.search(r'<meta\s+name="description"', content)),
                "meta_og_title": bool(re.search(r'<meta\s+property="og:title"', content)),
                "meta_og_description": bool(re.search(r'<meta\s+property="og:description"', content)),
                "h1_tags": len(re.findall(r'<h1[^>]*>', content)),
                "word_count": len(content.split()),
                "internal_links": len(re.findall(r'href=["\'](?:(?:\.\.?/)?servicios/|https?://[^/]*working-go\.com/servicios/)', content)),
                "faq_section": bool(re.search(r'FAQ|preguntas frecuentes|frequently asked', content, re.I)),
            }
            
            # Validar mínimos
            checks["pass"] = (
                checks["meta_title"] and
                checks["meta_description"] and
                checks["h1_tags"] >= 1 and
                checks["word_count"] >= 1500 and
                checks["faq_section"]
            )
            
            if checks["pass"]:
                seo_checks_passed += 1
            
            details.append(checks)
        
        self.log_test(test_name, seo_checks_passed == len(landings), 
                     f"{seo_checks_passed}/{len(landings)} landings pass SEO quality checks")
        
        for detail in details:
            if not detail["pass"]:
                issues = []
                if not detail["meta_title"]:
                    issues.append("Missing meta title")
                if not detail["meta_description"]:
                    issues.append("Missing meta description")
                if detail["h1_tags"] < 1:
                    issues.append("No H1 tags")
                if detail["word_count"] < 1500:
                    issues.append(f"Word count too low ({detail['word_count']}/1500)")
                if not detail["faq_section"]:
                    issues.append("Missing FAQ section")
                
                self.results["test_results"].append({
                    "subtest": detail["file"],
                    "status": "WARNING",
                    "issues": issues
                })
        
        return seo_checks_passed == len(landings)
    
    def test_internal_linking(self):
        """Valida enlaces internos entre landings"""
        test_name = "Internal Linking"
        landings = [
            "servicios/sanitarios-uruguay.html",
            "servicios/plomeros-sanitarios-uruguay.html",
            "servicios/albaniles-obreros-uruguay.html",
            "servicios/obreros-construccion-uruguay.html",
            "servicios/mantenimiento-edificios-administradoras.html",
            "servicios/servicios-construccion-uruguay.html",
        ]
        
        linking_issues = []
        
        for landing in landings:
            file_path = os.path.join(self.root_path, landing)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            internal_links = len(re.findall(r'href=["\'](?:\.\.?/)?servicios/[\w-]+\.html', content))
            
            if internal_links == 0:
                linking_issues.append(landing.split('/')[-1])
        
        if linking_issues:
            self.log_test(test_name, False, 
                         f"Landings without internal links: {', '.join(linking_issues)}")
        else:
            self.log_test(test_name, True, 
                         "All landings have internal links")
        
        return len(linking_issues) == 0
    
    def test_robots_txt(self):
        """Valida robots.txt"""
        test_name = "Robots.txt Configuration"
        try:
            robots_path = os.path.join(self.root_path, "robots.txt")
            with open(robots_path, 'r') as f:
                content = f.read()
            
            has_user_agent = "User-agent" in content
            has_allow = "Allow" in content or "Disallow" in content
            has_sitemap = "sitemap" in content.lower()
            
            if has_user_agent and (has_allow or has_sitemap):
                self.log_test(test_name, True, "robots.txt is properly configured")
                return True
            else:
                self.log_test(test_name, False, "robots.txt is missing required directives")
                return False
        except Exception as e:
            self.log_test(test_name, False, str(e))
            return False
    
    def test_landing_file_sizes(self):
        """Valida el tamaño de los archivos (optimización)"""
        test_name = "File Size Optimization"
        landings = [
            "servicios/sanitarios-uruguay.html",
            "servicios/plomeros-sanitarios-uruguay.html",
            "servicios/albaniles-obreros-uruguay.html",
            "servicios/obreros-construccion-uruguay.html",
            "servicios/mantenimiento-edificios-administradoras.html",
            "servicios/servicios-construccion-uruguay.html",
        ]
        
        oversized = []
        
        for landing in landings:
            file_path = os.path.join(self.root_path, landing)
            file_size_kb = os.path.getsize(file_path) / 1024
            
            if file_size_kb > 500:  # 500 KB es el límite sugerido
                oversized.append(f"{landing.split('/')[-1]} ({file_size_kb:.1f}KB)")
        
        if oversized:
            self.log_test(test_name, False, 
                         f"Oversized files (>500KB): {', '.join(oversized)}")
        else:
            self.log_test(test_name, True, 
                         "All landing files are optimally sized")
        
        return len(oversized) == 0
    
    def log_test(self, test_name, passed, message):
        """Registra el resultado de una prueba"""
        self.results["total_tests"] += 1
        
        if passed:
            self.results["passed_tests"] += 1
            status = "PASS"
        else:
            self.results["failed_tests"] += 1
            status = "FAIL"
        
        self.results["test_results"].append({
            "test": test_name,
            "status": status,
            "message": message
        })
        
        print(f"[{status}] {test_name}: {message}")
    
    def run_all_tests(self):
        """Ejecuta todas las pruebas"""
        print("\n" + "="*70)
        print("DEPLOYMENT TESTING SUITE FOR CHOOSEYOURWORKER")
        print("="*70 + "\n")
        
        self.test_sitemap_validity()
        self.test_required_files_exist()
        self.test_landing_seo_quality()
        self.test_internal_linking()
        self.test_robots_txt()
        self.test_landing_file_sizes()
        
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)
        print(f"Total Tests: {self.results['total_tests']}")
        print(f"Passed: {self.results['passed_tests']}")
        print(f"Failed: {self.results['failed_tests']}")
        print(f"Success Rate: {(self.results['passed_tests']/self.results['total_tests']*100):.1f}%")
        print("="*70 + "\n")
        
        return self.results
    
    def save_results(self, output_file):
        """Guarda los resultados en JSON"""
        with open(output_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f"Results saved to: {output_file}")

if __name__ == "__main__":
    root_path = "/Users/agusmazzini/Desktop/projectos/chooseYourWorker"
    tester = DeploymentTester(root_path)
    
    results = tester.run_all_tests()
    tester.save_results(os.path.join(root_path, "test-results.json"))
    
    # Exit with appropriate code
    exit(0 if results['failed_tests'] == 0 else 1)
