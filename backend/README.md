# 🗄️ WorkingGo - Backend Database Scripts

Scripts SQL para configuración del sistema de contrataciones en Supabase.

## 📋 Archivo Principal

### `setup-hires-REAL.sql` ⚡ **PRINCIPAL**
**Ejecutar UNA VEZ para configurar el sistema de contrataciones**

Configura:
- ✅ Tabla `hires` (contrataciones cliente → profesional)
- ✅ Columnas: `phone`, `hires_count`, `completed_hires_count`
- ✅ Columna `hire_id` en tabla `reviews`
- ✅ RLS y políticas de seguridad
- ✅ Trigger para actualizar contadores automáticamente
- ✅ Índices para optimización

**Ver instrucciones:** `../INICIO-RAPIDO.md`

---

## 🔧 Archivos de Diagnóstico (Opcionales)

### `diagnose-and-fix-users.sql`
Para diagnosticar problemas con usuarios duplicados o inconsistentes.

### `diagnose-client-id.sql`
Para verificar referencias de `client_id` en las tablas.

---

## � Cómo Ejecutar

### Método 1: Desde Terminal (macOS/Linux)

```bash
# Copiar script al portapapeles
cat setup-hires-REAL.sql | pbcopy

# Luego pegar en Supabase SQL Editor y ejecutar
```

### Método 2: En Supabase Dashboard

1. **Ir al SQL Editor**
   ```
   https://supabase.com/dashboard/project/[TU_PROJECT_ID]/sql
   ```

2. **Crear Nueva Query**
   - Click en "New Query"
   - Copiar y pegar el contenido de `setup-hires-REAL.sql`
   - Click en "Run" o `Cmd/Ctrl + Enter`

3. **Verificar Éxito**
   - Debes ver mensajes de confirmación al final
   - Verificar que la tabla `hires` existe en Table Editor

---

## 📚 Documentación Adicional

- **Inicio Rápido:** `../INICIO-RAPIDO.md`
- **Implementación Completa:** `../IMPLEMENTACION-HIRES-COMPLETA.md`
- **Archivos Obsoletos:** `LIMPIEZA-SQL.md`

---

## 🗑️ Archivos Movidos

Los scripts antiguos fueron movidos a `_old_scripts/`:
- `1-setup-inicial*.sql`
- `2-reparacion.sql`
- `3-utilidades.sql`
- `setup-contracts*.sql`
- `setup-minimal.sql`
- etc.

Puedes eliminar la carpeta `_old_scripts/` si ya verificaste que todo funciona.

---

## ⚠️ Importante

- ✅ Solo necesitas ejecutar `setup-hires-REAL.sql` una vez
- ✅ El script es idempotente (se puede ejecutar múltiples veces sin problemas)
- ✅ Usa bloques `IF NOT EXISTS` para evitar duplicados
- ⚠️ Haz backup antes si ya tienes datos en producción

---

## 🆘 Troubleshooting

| Problema | Solución |
|----------|----------|
| Error "table already exists" | Normal, el script continúa sin problemas |
| Error "column already exists" | Normal, el script continúa sin problemas |
| Reviews no se vinculan a hires | Verifica que `hire_id` existe en tabla `reviews` |
| Frontend no encuentra `hires` | Verifica RLS políticas en Supabase Dashboard |

---

**Última actualización:** 28 de noviembre de 2025
| Ratings no se actualizan | Ejecutar `2-reparacion.sql` |
| Error de foreign key | Ejecutar `2-reparacion.sql` |

---

**WorkingGo** - Backend limpio y funcional 🚀
