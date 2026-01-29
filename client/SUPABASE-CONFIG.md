# 🔧 Guía: Configurar Supabase para WorkingGo

## Problema Actual
El flujo de cliente intenta conectar a Supabase para obtener profesionales reales, pero sin credenciales válidas, usa datos **fallback/mock**.

## ¿Por qué error 401?
- La clave anónima (`SUPABASE_ANON_KEY`) no es válida
- O las políticas de seguridad de la tabla `professionals` no permiten acceso público

## Solución: Obtener Credenciales Reales

### Paso 1: Ir a Supabase Dashboard
1. Ve a https://app.supabase.com
2. Selecciona tu proyecto "WorkingGo"
3. Ve a **Configuración → API**

### Paso 2: Copiar la Clave Anónima
1. Busca la sección **"Project API keys"**
2. Copia el valor de **`anon` public key**
3. Debería verse así: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3...`

### Paso 3: Actualizar el archivo
1. Abre `/client/supabase-config.js`
2. Reemplaza `SUPABASE_ANON_KEY`:
```javascript
const SUPABASE_ANON_KEY = 'TU_CLAVE_AQUI_COPIADA_DE_SUPABASE';
```

### Paso 4: Verificar Políticas de Seguridad
1. En Supabase, ve a **Table Editor**
2. Selecciona tabla `professionals`
3. Ve a **RLS (Row Level Security)**
4. Verifica que hay una política que permite `SELECT` para usuarios anónimos

## Testing Rápido

Después de actualizar las credenciales:

1. Abre http://localhost:8000/client/test-supabase.html
2. Deberías ver: "✅ Se encontraron X profesionales"
3. Si funciona, ve a http://localhost:8000/client/test-flow.html

## Fallback Actual
Mientras tanto, el sistema usa datos **mock/fallback**:
- Nombre: Carlos Rodríguez
- Categoría: La que seleccionaste
- Rating: 4.9
- Experiencia: 156 trabajos

Esto permite testear el flujo completo sin Supabase real.

## Próximos Pasos
- Una vez que Supabase funcione, el sistema cargará profesionales reales
- Verás distintos profesionales según la categoría que selecciones
- Los nombres, ratings y precios serán datos reales de tu base de datos
