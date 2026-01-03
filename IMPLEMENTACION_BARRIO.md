# Guía de Implementación - Campo Barrio

## ✅ Archivos Creados

### 1. `/frontend/utils/barrios.ts`
- ✅ Contiene todos los barrios organizados por ciudad
- ✅ Función helper `getBarriosPorCiudad(cityId: string)`
- ✅ Incluye barrios de todas las ciudades principales de Uruguay

### 2. `/database/add_barrio_column.sql`
- ✅ Agrega columna `barrio` a tablas `users` y `professionals`
- ✅ Crea índices para mejorar performance de búsquedas
- ✅ Agrega comentarios de documentación

### 3. `/database/update_rpc_with_barrio.sql`
- ✅ Actualiza función RPC `create_professional_profile` para incluir parámetro `p_barrio`

## ✅ Archivos Actualizados

### 1. `/frontend/app/auth/register.tsx`
- ✅ Importa `getBarriosPorCiudad` y tipo `Barrio`
- ✅ Agrega estado `barrio` y `barrioList`
- ✅ Agrega estado `barrioModalVisible`
- ✅ Agrega useEffect para cargar barrios cuando cambia la ciudad
- ✅ Agrega validación de barrio requerido
- ✅ Incluye barrio en llamada RPC y fallback insert
- ✅ Guarda barrio en localStorage para pending_user_data
- ✅ Agrega UI del selector de barrio con modal

### 2. `/frontend/components/EditProfessionalProfile.tsx`
- ✅ Importa `getBarriosPorCiudad` y tipo `Barrio`
- ✅ Agrega estado `barrio` y `barrioList`
- ✅ Agrega estado `barrioModalVisible`
- ✅ Agrega useEffect para cargar barrios cuando cambia city
- ✅ Agrega validación de barrio en handleSave
- ✅ Incluye barrio en el update de professionals
- ✅ Agrega UI del selector de barrio con modal

### 3. `/frontend/components/EditClientProfile.tsx`
- ✅ Importa `getBarriosPorCiudad` y tipo `Barrio`
- ✅ Agrega estado `barrio` y `barrioList`
- ✅ Agrega estado `barrioModalVisible`
- ✅ Agrega useEffect para cargar barrios cuando cambia city
- ✅ Agrega validación de barrio en handleSave
- ✅ Incluye barrio en el update de users
- ✅ Agrega UI del selector de barrio con modal

### 4. `/frontend/app/auth/email-verified.tsx`
- ✅ Agrega `barrio` al update de pending_user_data

### 5. `/frontend/app/(tabs)/index.tsx`
- ✅ Importa `getBarriosPorCiudad`
- ✅ Agrega campo `barrio` a interfaz Professional
- ✅ Agrega estados `selectedBarrio`, `barrioModalVisible`, `barrios`
- ✅ Agrega useEffect para cargar barrios cuando cambia selectedCity
- ✅ Agrega filtro de barrio en función filterProfessionals
- ✅ Resetea selectedBarrio en botón "Limpiar filtros"
- ✅ Agrega botón de filtro de barrio en vista mobile
- ✅ Agrega modal de selección de barrio

## 📋 Próximos Pasos Necesarios

### 1. Ejecutar Scripts SQL en Supabase

```sql
-- Paso 1: Ejecutar add_barrio_column.sql en Supabase SQL Editor
-- Esto agregará la columna barrio a las tablas

-- Paso 2: Ejecutar update_rpc_with_barrio.sql
-- Esto actualizará la función RPC con el nuevo parámetro
```

### 2. ✅ COMPLETADO - Actualizar EditProfessionalProfile.tsx

### 3. ✅ COMPLETADO - Actualizar EditClientProfile.tsx

### 4. ✅ COMPLETADO - Actualizar Filtros de Búsqueda en Home

### 5. ✅ COMPLETADO - Actualizar email-verified.tsx

### 6. Testing Local

## 🎨 Estructura del Selector de Barrio (Copiar y Adaptar)

```tsx
// En el JSX, después del selector de ciudad:
{barrioList.length > 0 && (
  <>
    <Text style={styles.label}>Barrio *</Text>
    <TouchableOpacity 
      style={styles.customPickerTrigger} 
      onPress={() => setBarrioModalVisible(true)}
    >
      <Text style={styles.pickerTriggerText}>
        {barrioList.find(b => String(b.id) === String(barrio))?.nombre || 'Selecciona barrio'}
      </Text>
      <Text style={styles.pickerArrow}>▼</Text>
    </TouchableOpacity>
    
    <Modal 
      visible={barrioModalVisible} 
      transparent 
      animationType="fade" 
      onRequestClose={() => setBarrioModalVisible(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setBarrioModalVisible(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Selecciona un barrio</Text>
          <ScrollView style={styles.modalScroll}>
            {barrioList.map((b) => {
              const selected = String(b.id) === String(barrio);
              return (
                <TouchableOpacity
                  key={String(b.id)}
                  style={[styles.modalOption, selected && styles.modalOptionSelected]}
                  onPress={() => {
                    setBarrio(String(b.id));
                    setBarrioModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, selected && styles.modalOptionTextSelected]}>
                    {b.nombre}
                  </Text>
                  {selected && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity 
            onPress={() => setBarrioModalVisible(false)} 
            style={styles.modalCloseBtn}
          >
            <Text style={styles.modalCloseBtnText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
    {errors.barrio && <Text style={styles.errorText}>{errors.barrio}</Text>}
  </>
)}
```

## 📊 Resumen de Estado

| Tarea | Estado |
|-------|--------|
| Crear archivo barrios.ts | ✅ Completado |
| Crear SQL add_barrio_column.sql | ✅ Completado |
| Crear SQL update_rpc_with_barrio.sql | ✅ Completado |
| Actualizar register.tsx | ✅ Completado |
| Actualizar EditProfessionalProfile.tsx | ✅ Completado |
| Actualizar EditClientProfile.tsx | ✅ Completado |
| Actualizar email-verified.tsx | ✅ Completado |
| Actualizar filtros de búsqueda (index.tsx) | ✅ Completado |
| Ejecutar SQL en Supabase | ⏳ Pendiente |
| Testing completo | ⏳ Pendiente |

## 🔍 Verificación Final

Antes de desplegar a producción, verificar:
- [ ] Barrio se guarda correctamente en registro
- [ ] Barrio se muestra en perfil profesional
- [ ] Barrio se puede editar en EditProfessionalProfile
- [ ] Barrio se puede editar en EditClientProfile
- [ ] Filtro de barrio funciona en búsqueda
- [ ] RLS policies permiten insertar/actualizar barrio
- [ ] Índices de búsqueda funcionan correctamente

## 🎯 Instrucciones de Ejecución Inmediata

### Paso 1: Ejecutar SQL en Supabase (IMPORTANTE - HACER PRIMERO)

1. Ir a Supabase Dashboard → SQL Editor
2. Ejecutar el contenido de `/database/add_barrio_column.sql`
3. Ejecutar el contenido de `/database/update_rpc_with_barrio.sql`
4. Verificar que las columnas se crearon: `SELECT barrio FROM users LIMIT 1;`

### Paso 2: Testing Local

```bash
# En el directorio del proyecto
cd frontend
npx expo start
```

- Presionar `w` para abrir en web
- Probar registro con ciudad que tenga barrios (ej: Montevideo)
- Verificar que aparece selector de barrio
- Completar registro y verificar en Supabase que el barrio se guardó

### Paso 3: Deploy a Producción

Una vez confirmado que funciona localmente:
```bash
cd frontend && npx expo export -p web && cd .. && cp -r frontend/dist/* . && git add -A && git commit -m "feat: Agregar campo barrio a registro, perfiles y filtros" && git push
```
