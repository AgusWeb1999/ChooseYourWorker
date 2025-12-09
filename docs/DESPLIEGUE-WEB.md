# 🌐 DESPLIEGUE WEB - GitHub Pages

## ✅ **ARCHIVOS SUBIDOS EXITOSAMENTE**

La versión web de WorkingGo ha sido exportada y subida al repositorio.

---

## 📋 **CONFIGURAR GITHUB PAGES**

### **Paso 1: Ir a Settings**
1. Abre tu repositorio: https://github.com/AgusWeb1999/ChooseYourWorker
2. Click en **Settings** (⚙️)
3. En el menú lateral, click en **Pages**

### **Paso 2: Configurar Source**
- **Source:** Deploy from a branch
- **Branch:** `main`
- **Folder:** `/ (root)`
- Click **Save**

### **Paso 3: Esperar el deployment**
- GitHub Pages tardará 1-3 minutos en desplegar
- Verás un mensaje: "Your site is live at..."

---

## 🌐 **CONFIGURAR DOMINIO PERSONALIZADO**

### **En GitHub:**
1. En Settings → Pages
2. **Custom domain:** `working-go.com`
3. Click **Save**
4. Marcar ✅ **Enforce HTTPS**

### **En tu proveedor de dominio (GoDaddy, Namecheap, etc):**

Configura estos registros DNS:

**Opción A: Con subdomain www**
```
Type: CNAME
Name: www
Value: agusweb1999.github.io
TTL: 3600
```

**Opción B: Dominio raíz (apex domain)**
```
Type: A
Name: @
Value: 185.199.108.153
TTL: 3600

Type: A
Name: @
Value: 185.199.109.153
TTL: 3600

Type: A
Name: @
Value: 185.199.110.153
TTL: 3600

Type: A
Name: @
Value: 185.199.111.153
TTL: 3600
```

**Redirección www → dominio raíz:**
```
Type: CNAME
Name: www
Value: working-go.com
TTL: 3600
```

---

## ⏱️ **TIEMPO DE PROPAGACIÓN**

- DNS puede tardar 5 minutos a 48 horas
- Normalmente es de 15-30 minutos
- Puedes verificar con: `nslookup working-go.com`

---

## 🧪 **VERIFICAR QUE FUNCIONA**

### **Verificar GitHub Pages:**
```bash
# URL temporal de GitHub Pages
https://agusweb1999.github.io/ChooseYourWorker/
```

### **Verificar dominio personalizado:**
```bash
# Cuando DNS esté configurado
https://working-go.com
```

---

## 📦 **ARCHIVOS DESPLEGADOS**

```
/ (raíz del repo)
├── index.html              ← Página principal
├── CNAME                   ← Configuración de dominio
├── .nojekyll              ← Para que GitHub no ignore _expo
├── _expo/                  ← Bundle de JavaScript
│   └── static/js/web/entry-*.js
├── assets/                 ← Imágenes, fonts, etc.
├── auth/                   ← Páginas de autenticación
│   ├── login.html
│   ├── register.html
│   └── complete-profile.html
├── (tabs)/                 ← Páginas de tabs
│   ├── explore.html
│   ├── messages.html
│   └── profile.html
├── professional/           ← Perfil de profesional
│   └── [id].html
├── chat/                   ← Chat
│   └── [id].html
└── subscription/           ← Suscripciones
    ├── plan.html
    ├── manage.html
    └── ...
```

---

## 🔄 **ACTUALIZAR LA WEB**

Cada vez que hagas cambios en la app:

```bash
# 1. Ir al frontend
cd frontend

# 2. Exportar nueva versión web
npx expo export --platform web

# 3. Copiar archivos a la raíz
cd ..
rm -rf _expo assets *.html (tabs) auth chat professional subscription
cp -r frontend/dist/* .

# 4. Commit y push
git add -A
git commit -m "🔄 Update web version"
git push origin main

# GitHub Pages se actualizará automáticamente en 1-2 minutos
```

---

## 🚀 **URLS FINALES**

- **GitHub Pages:** https://agusweb1999.github.io/ChooseYourWorker/
- **Dominio personalizado:** https://working-go.com
- **Repositorio:** https://github.com/AgusWeb1999/ChooseYourWorker

---

## 🐛 **TROUBLESHOOTING**

| Problema | Solución |
|----------|----------|
| 404 en todas las rutas | Verificar que `.nojekyll` existe en raíz |
| CSS/JS no carga | Verificar que `_expo/` no está en `.gitignore` |
| Dominio no funciona | Esperar propagación DNS (hasta 48h) |
| HTTPS no funciona | Marcar "Enforce HTTPS" en GitHub Pages settings |
| Cambios no se ven | Clear cache del navegador (Cmd+Shift+R) |

---

## 📝 **NOTAS IMPORTANTES**

- ✅ La app web es **completamente funcional**
- ✅ Usa el **mismo backend de Supabase**
- ✅ **No necesitas** reconstruir para cambios de código backend
- ⚠️ **Sí necesitas** reconstruir para cambios de código frontend
- 🔒 Asegúrate de que las **variables de entorno** estén configuradas correctamente

---

**¡Tu app ya está en la web! 🎉**

Fecha de despliegue: 9 de diciembre de 2025
