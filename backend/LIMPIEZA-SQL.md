# 🧹 LIMPIEZA DE ARCHIVOS SQL

## ✅ ARCHIVO ACTUAL EN USO

**ÚNICO ARCHIVO NECESARIO:**
- `setup-hires-REAL.sql` ✨ (ESTE ES EL BUENO)

---

## ❌ ARCHIVOS OBSOLETOS - PUEDEN ELIMINARSE

Estos archivos son versiones antiguas que ya NO se usan:

```bash
# Para eliminar los archivos obsoletos, ejecuta:
cd /Users/agusmazzini/Desktop/projectos/chooseYourWorker/backend

# Eliminar archivos obsoletos
rm 1-setup-inicial.sql
rm 1-setup-inicial-sin-permisos.sql
rm 1-setup-inicial-sin-permisos-FIXED.sql
rm 2-reparacion.sql
rm 3-utilidades.sql
rm 4-migracion-jobs.sql
rm setup-completo-limpio.sql
rm setup-contracts-system.sql
rm setup-contracts-FINAL.sql
rm setup-minimal.sql
rm setup-avatar-system.sql
rm setup-contracts-FINAL.sql

# Archivos de diagnóstico (opcionales, puedes dejarlos)
# rm diagnose-and-fix-users.sql
# rm diagnose-client-id.sql
# rm create-missing-functions.sql

# Archivos de validación (opcionales)
# rm validar-migracion.sql
# rm validar-rapido.sql
# rm verificar-registro.sql
# rm verificar-reviews-estructura.sql
# rm verify-trigger-working.sql
```

---

## 📋 ESTRUCTURA FINAL RECOMENDADA

```
backend/
  ✅ setup-hires-REAL.sql          (Script principal)
  ✅ execute-sql.js                 (Helper para ejecutar SQL)
  ✅ package.json                   (Configuración Node)
  📝 SCRIPTS-README.md              (Documentación)
  📝 README.md                      (Documentación)
  
  # Opcionales (útiles para debug)
  🔧 diagnose-and-fix-users.sql
  🔧 diagnose-client-id.sql
```

---

## 🗑️ COMANDO PARA LIMPIAR TODO

```bash
cd /Users/agusmazzini/Desktop/projectos/chooseYourWorker/backend

# Backup primero (por las dudas)
mkdir _old_scripts
mv 1-setup-*.sql _old_scripts/
mv 2-*.sql _old_scripts/
mv 3-*.sql _old_scripts/
mv 4-*.sql _old_scripts/
mv setup-completo-limpio.sql _old_scripts/
mv setup-contracts*.sql _old_scripts/ 2>/dev/null
mv setup-minimal.sql _old_scripts/
mv setup-avatar-system.sql _old_scripts/

echo "✅ Archivos obsoletos movidos a _old_scripts/"
echo "✅ Puedes eliminar la carpeta _old_scripts/ cuando estés seguro"
```

---

## ✅ VERIFICAR QUE SOLO QUEDE EL BUENO

```bash
ls -1 backend/*.sql
# Debería mostrar solo:
# setup-hires-REAL.sql
# (y opcionalmente los diagnose-*.sql)
```

---

## 📝 NOTAS

- **NO elimines** `setup-hires-REAL.sql` - es el único que funciona
- Los archivos de diagnóstico (`diagnose-*.sql`) son útiles para debug
- Puedes mover los archivos a `_old_scripts/` en lugar de eliminarlos directamente
- Una vez confirmado que todo funciona, elimina `_old_scripts/`

---

**Fecha de limpieza:** 28 de noviembre de 2025
