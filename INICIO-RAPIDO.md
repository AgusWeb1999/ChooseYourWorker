# 🚀 INICIO RÁPIDO - SISTEMA DE CONTRATACIONES

## ✅ Paso 1: Abrir Supabase SQL Editor

Ir a: https://supabase.com/dashboard/project/kfqrubwmtknvjnucwyob/sql/new

## ✅ Paso 2: Copiar y Ejecutar Script

En tu terminal:
```bash
cat /Users/agusmazzini/Desktop/projectos/chooseYourWorker/backend/setup-hires-REAL.sql | pbcopy
```

En Supabase:
1. `Cmd + V` (pegar)
2. Click "Run"
3. Esperar ~5 segundos

## ✅ Paso 3: Verificar Éxito

Debes ver al final:
```
✅ Tabla hires creada correctamente
✅ Columnas agregadas a users y professionals
✅ RLS y políticas configuradas
✅ Trigger de contadores creado
```

---

## 🎉 ¡Listo!

Tu base de datos ahora tiene:
- ✅ Sistema de **hires** (contrataciones cliente → profesional)
- ✅ Reviews vinculadas a hires con `hire_id`
- ✅ Campo teléfono visible solo después de contratar
- ✅ Contadores automáticos de contrataciones
- ✅ RLS configurado

---

## 🧪 Probar la App

1. Abre la app en tu dispositivo/simulador
2. Ve al perfil de un profesional
3. Click "Contratar" → Se crea un hire
4. Verás el teléfono del profesional
5. Finaliza el trabajo → Podrás dejar review

---

## 📚 Documentación

- **Implementación completa:** `IMPLEMENTACION-HIRES-COMPLETA.md`
- **Script SQL usado:** `backend/setup-hires-REAL.sql`

---

**¡Éxito!** 🎊
