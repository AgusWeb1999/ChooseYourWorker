#!/bin/bash

# Script para iniciar el servidor HTTP local de WorkingGo
# Uso: ./start-server.sh

PROJECT_DIR="/Users/agusmazzini/Desktop/projectos/chooseYourWorker"
PORT=8000

echo "🚀 Iniciando servidor WorkingGo..."
echo "📁 Directorio: $PROJECT_DIR"
echo "🌐 Puerto: $PORT"
echo ""

# Cambiar al directorio del proyecto
cd "$PROJECT_DIR" || exit 1

# Iniciar servidor Python
echo "✅ Servidor iniciando en http://localhost:$PORT"
echo ""
echo "📌 URLs útiles:"
echo "  • Inicio flujo: http://localhost:$PORT/client/step-1-describe.html"
echo "  • Testing:     http://localhost:$PORT/client/test-simple.html"
echo "  • Home:        http://localhost:$PORT/index.html"
echo ""
echo "⏹️  Para detener el servidor: Ctrl+C"
echo ""

python3 -m http.server $PORT
