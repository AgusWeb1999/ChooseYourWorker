#!/bin/bash

# Script para ejecutar la migración de la estructura de reviews
# Fecha: 3 de febrero de 2026

echo "🔄 Ejecutando migración de estructura de reviews..."
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que existe el archivo de migración
MIGRATION_FILE="supabase/migrations/20260203_reviews_structure.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Error: No se encontró el archivo de migración${NC}"
    echo "   Buscando: $MIGRATION_FILE"
    exit 1
fi

echo -e "${GREEN}✓${NC} Archivo de migración encontrado"
echo ""

# Opción 1: Usando Supabase CLI (recomendado)
echo "📋 Opción 1: Usar Supabase CLI"
echo "   Comando: supabase db push"
echo ""

# Opción 2: SQL directo
echo "📋 Opción 2: Ejecutar SQL directamente"
echo "   1. Ir a: https://supabase.com/dashboard/project/_/sql"
echo "   2. Copiar el contenido de: $MIGRATION_FILE"
echo "   3. Pegar en el editor SQL"
echo "   4. Hacer click en 'Run'"
echo ""

# Preguntar al usuario qué opción prefiere
echo "¿Deseas ejecutar la migración ahora usando Supabase CLI? (s/n)"
read -r response

if [[ "$response" =~ ^([sS][iI]|[sS])$ ]]; then
    echo ""
    echo -e "${YELLOW}⚠️  Verificando Supabase CLI...${NC}"
    
    # Verificar si existe el comando supabase
    if ! command -v supabase &> /dev/null; then
        echo -e "${RED}❌ Supabase CLI no está instalado${NC}"
        echo ""
        echo "Instalar con:"
        echo "  brew install supabase/tap/supabase"
        echo ""
        echo "O seguir las instrucciones en:"
        echo "  https://supabase.com/docs/guides/cli"
        exit 1
    fi
    
    echo -e "${GREEN}✓${NC} Supabase CLI encontrado"
    echo ""
    
    # Ejecutar migración
    echo -e "${YELLOW}🚀 Ejecutando migración...${NC}"
    echo ""
    
    cd "$(dirname "$0")" || exit
    supabase db push
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ ¡Migración completada exitosamente!${NC}"
        echo ""
        echo "📊 Verificación:"
        echo "   1. Ir a Supabase Dashboard"
        echo "   2. Table Editor → reviews"
        echo "   3. Verificar que tiene las columnas:"
        echo "      - professional_id"
        echo "      - client_id"
        echo "      - hire_id"
        echo "      - rating"
        echo "      - comment"
        echo "      - costo"
        echo ""
    else
        echo ""
        echo -e "${RED}❌ Error durante la migración${NC}"
        echo "Por favor revisa los logs arriba para más detalles"
        exit 1
    fi
else
    echo ""
    echo -e "${YELLOW}ℹ️  Migración no ejecutada${NC}"
    echo ""
    echo "Para ejecutar manualmente:"
    echo "1. Copiar contenido de: $MIGRATION_FILE"
    echo "2. Ir a: Supabase Dashboard → SQL Editor"
    echo "3. Pegar y ejecutar"
    echo ""
fi

echo "📝 Para más información, ver:"
echo "   docs/CHANGELOG_REVIEWS_SYSTEM.md"
echo ""
