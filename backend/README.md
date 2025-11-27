# 🗄️ WorkingGo - Backend Database Scripts

Scripts SQL esenciales para configuración y mantenimiento de la base de datos Supabase.

## 📋 Archivos Disponibles

### 1. `1-setup-inicial.sql` ⚙️
**Ejecutar UNA SOLA VEZ al crear el proyecto**

Configura todo el sistema desde cero:
- ✅ Sistema de avatares (columnas + storage + políticas RLS)
- ✅ Trigger de sincronización de usuarios (auth → public)
- ✅ Trigger de sincronización de avatares (users → professionals)
- ✅ Trigger de ratings automáticos (reviews → professionals)

### 2. `2-reparacion.sql` 🔧
**Ejecutar cuando haya problemas o inconsistencias**

Repara problemas comunes:
- 🔄 Elimina usuarios duplicados
- 🔄 Sincroniza usuarios de auth a public
- 🔄 Sincroniza avatares entre tablas
- 🔄 Repara professionals sin user_id válido
- 🔄 Repara conversaciones y mensajes rotos
- 🔄 Recalcula todos los ratings

### 3. `3-utilidades.sql` 🛠️
**Scripts útiles para mantenimiento**

Incluye:
- 🗑️ Eliminar un usuario completo
- 🗑️ Resetear todos los clientes (solo desarrollo)
- 🌐 Actualizar profesiones a español
- 🧹 Limpiar avatares huérfanos
- 📊 Ver estadísticas generales
- ✅ Verificar integridad de datos

## 🚀 Cómo Ejecutar

### En Supabase Dashboard:

1. **Ir al SQL Editor**
   ```
   https://supabase.com/dashboard/project/[TU_PROJECT_ID]/sql
   ```

2. **Crear Nueva Query**
   - Click en "New Query"
   - Copiar y pegar el contenido del script
   - Click en "Run" o `Cmd/Ctrl + Enter`

3. **Verificar Resultados**
   - Revisar los mensajes de éxito/error
   - Verificar los SELECT al final de cada script

## ⚠️ Importante

- **Backup**: Siempre haz backup antes de ejecutar scripts de reparación
- **Desarrollo vs Producción**: Algunos scripts son SOLO para desarrollo
- **Orden**: Ejecutar `1-setup-inicial.sql` primero, luego los demás según necesidad
- **Idempotencia**: Los scripts se pueden ejecutar múltiples veces sin problemas

## 🆘 Troubleshooting

| Problema | Solución |
|----------|----------|
| Usuarios no se sincronizan | Ejecutar `2-reparacion.sql` |
| Avatares no se ven | Ejecutar `2-reparacion.sql` |
| Ratings no se actualizan | Ejecutar `2-reparacion.sql` |
| Error de foreign key | Ejecutar `2-reparacion.sql` |

---

**WorkingGo** - Backend limpio y funcional 🚀
