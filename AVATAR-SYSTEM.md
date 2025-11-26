# 📸 Sistema de Fotos de Perfil

Sistema completo para subir y gestionar fotos de perfil de usuarios y profesionales.

---

## 🚀 Instalación

### 1. Backend (Supabase)

Ejecuta en **Supabase SQL Editor**:
```sql
-- Ver archivo: backend/setup-avatar-system.sql
```

Este script:
- ✅ Agrega columnas `avatar_url` a `users` y `professionals`
- ✅ Crea bucket `avatars` en Supabase Storage
- ✅ Configura políticas RLS para seguridad
- ✅ Limita tamaño de archivos a 5MB
- ✅ Solo permite imágenes (jpeg, png, jpg, webp)

### 2. Frontend (Expo)

La dependencia ya está instalada:
```bash
npx expo install expo-image-picker
```

---

## 💻 Uso del Componente

### En perfil de usuario (`app/(tabs)/profile.tsx`):

```typescript
import AvatarUpload from '@/components/AvatarUpload';
import { useAuth } from '@/src/contexts/AuthContext';

export default function ProfileScreen() {
  const { userProfile, refreshProfiles } = useAuth();

  return (
    <View>
      <AvatarUpload
        userId={userProfile.id}
        currentUrl={userProfile.avatar_url}
        onUpload={async (newUrl) => {
          // Actualizar el estado local
          await refreshProfiles();
        }}
        size={120}
        editable={true}
      />
      
      <Text>{userProfile.full_name}</Text>
    </View>
  );
}
```

### En completar perfil de profesional (`app/auth/complete-profile.tsx`):

```typescript
import AvatarUpload from '@/components/AvatarUpload';

export default function CompleteProfileScreen() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  return (
    <ScrollView>
      <AvatarUpload
        userId={session.user.id}
        currentUrl={avatarUrl}
        onUpload={(url) => setAvatarUrl(url)}
      />
      
      {/* Resto del formulario */}
    </ScrollView>
  );
}
```

### Ver foto de perfil (solo lectura):

```typescript
<AvatarUpload
  userId={professional.user_id}
  currentUrl={professional.avatar_url}
  onUpload={() => {}}
  editable={false}  // Solo ver, no editar
  size={80}
/>
```

---

## 🎨 Props del Componente

| Prop | Tipo | Requerido | Default | Descripción |
|------|------|-----------|---------|-------------|
| `userId` | string | ✅ | - | ID del usuario |
| `currentUrl` | string \| null | ❌ | null | URL actual del avatar |
| `onUpload` | (url: string) => void | ✅ | - | Callback cuando se sube foto |
| `size` | number | ❌ | 120 | Tamaño del avatar en px |
| `editable` | boolean | ❌ | true | Si se puede editar |

---

## 🔒 Seguridad

### Políticas RLS Configuradas:

1. **SELECT (público)**: Todos pueden VER los avatars
2. **INSERT**: Solo el dueño puede SUBIR su avatar
3. **UPDATE**: Solo el dueño puede ACTUALIZAR su avatar
4. **DELETE**: Solo el dueño puede ELIMINAR su avatar

### Validaciones:

- ✅ Solo usuarios autenticados pueden subir
- ✅ Solo pueden subir/editar su propio avatar
- ✅ Tamaño máximo: 5MB
- ✅ Solo formatos: JPEG, PNG, JPG, WEBP
- ✅ Relación de aspecto 1:1 (cuadrado)

---

## 📁 Estructura de Storage

```
storage/
└── avatars/
    ├── {user_id_1}/
    │   └── avatar-1234567890.jpg
    ├── {user_id_2}/
    │   └── avatar-0987654321.png
    └── ...
```

Cada usuario tiene su propia carpeta identificada por su `user_id`.

---

## 🔧 Funcionalidades

### ✅ Implementado:

- Seleccionar imagen de la galería
- Recortar a formato cuadrado (1:1)
- Comprimir imagen (calidad 0.7)
- Subir a Supabase Storage
- Actualizar URL en base de datos
- Eliminar imagen anterior automáticamente
- Loading indicator mientras sube
- Mensajes de error/éxito
- Permisos de galería

### 🎨 UI:

- Avatar circular
- Badge de edición (✏️)
- Placeholder cuando no hay foto (📷)
- Indicador de carga
- Texto "Cambiar foto" / "Agregar foto"

---

## 🧪 Testing

### 1. Subir primera foto:
- Abrir perfil
- Tap en placeholder
- Seleccionar imagen
- Verificar que se sube y muestra

### 2. Cambiar foto:
- Tap en avatar actual
- Seleccionar nueva imagen
- Verificar que reemplaza la anterior

### 3. Ver foto de otro usuario:
- Ir al perfil de un profesional
- Ver su foto (sin botón de editar)

### 4. Sin permisos:
- Denegar permisos de galería
- Intentar subir foto
- Debe mostrar alerta pidiendo permisos

---

## 🐛 Troubleshooting

### Problema: "No se pudo subir la imagen"

**Causa:** Políticas RLS incorrectas o bucket no existe

**Solución:**
```sql
-- Verificar bucket
SELECT * FROM storage.buckets WHERE id = 'avatars';

-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'objects';
```

### Problema: "Permiso denegado"

**Causa:** Usuario no autenticado o intentando subir avatar de otro

**Solución:** Verificar que `session.user.id` coincide con `userId` prop

### Problema: Imagen no se muestra

**Causa:** URL incorrecta o imagen no pública

**Solución:**
```typescript
// Verificar URL en consola
console.log('Avatar URL:', userProfile.avatar_url);

// Debe ser algo como:
// https://[project-id].supabase.co/storage/v1/object/public/avatars/[user-id]/avatar-xxx.jpg
```

---

## 📱 Compatibilidad

- ✅ iOS
- ✅ Android
- ⚠️ Web (requiere ajustes en `expo-image-picker`)

---

## 🎯 Próximas Mejoras

- [ ] Tomar foto con la cámara
- [ ] Filtros/efectos de imagen
- [ ] Redimensionar imagen antes de subir (reducir tamaño)
- [ ] Soporte para GIFs
- [ ] Vista previa antes de subir
- [ ] Recorte personalizado (no solo cuadrado)

---

✅ **Sistema de fotos de perfil listo para usar**
