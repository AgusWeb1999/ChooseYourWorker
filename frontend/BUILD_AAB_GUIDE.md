# 📱 Guía para Generar y Subir el AAB a Google Play Store

## Paso 1: Configurar tu cuenta de Expo (si no lo has hecho)

```bash
eas login
```

Se abrirá una ventana de navegador. Inicia sesión o crea una cuenta Expo gratis.

## Paso 2: Generar el AAB (Android App Bundle)

Ejecuta este comando en la carpeta `frontend`:

```bash
eas build --platform android --build-type aab
```

El proceso tardará entre 10-20 minutos. Al finalizar, obtendrás:
- Un enlace para descargar el archivo `.aab`
- El archivo se guardará localmente

## Paso 3: Configurar Google Play Console

1. Ve a https://play.google.com/console
2. Inicia sesión con tu cuenta Google (la que usa para desarrollador)
3. Crea una nueva app o selecciona la existente:
   - **Nombre de la app**: WorkingGo
   - **Idioma predeterminado**: Español
   - **Categoría**: Servicios de empleo/Trabajo
4. Completa el formulario inicial

## Paso 4: Firmar el AAB

En Google Play Console:
1. Ve a **Configuración** → **Claves de aplicación**
2. Google Play te proporciona una clave de firma automáticamente (recomendado)
3. Si usas tu propia clave, guárdala segura en `service-account-key.json`

## Paso 5: Subir el AAB

1. Ve a **Lanzamiento** → **Producción** (o **Testing interno**)
2. Haz clic en **Crear lanzamiento**
3. Carga el archivo `.aab` descargado
4. Llena toda la información requerida:
   - **Cambios en esta versión**
   - **Clasificación de contenido**
   - **País de origen**

## Paso 6: Revisar datos de la tienda

Completa:
- Descripción de la app
- Capturas de pantalla (mínimo 2)
- Icono de la app
- Imagen destacada
- Categoría
- Clasificación de contenido
- Datos de contacto de privacidad

## Paso 7: Enviar para revisión

1. Verifica que todo esté completado
2. Haz clic en **Enviar para revisión**
3. Google revisará la app (2-7 días típicamente)

## Alternativa: Compilar localmente

Si prefieres compilar sin EAS:

```bash
expo build:android -t aab
```

(Este método es más lento pero no requiere cuenta EAS Pro)

## Problemas comunes

### Error: "eas login required"
```bash
eas login
```

### Error: "No credentials for Android"
EAS generará credenciales automáticamente en el primer build

### Error: "version code already used"
En `app.json`, incrementa el `versionCode`:
```json
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 2
    }
  }
}
```

## Versiones futuras

Para subir una nueva versión:
1. Incrementa `version` en `app.json`
2. Ejecuta: `eas build --platform android --build-type aab`
3. Carga el nuevo AAB en Google Play Console

---

📧 **Soporte**: Si tienes problemas, verifica:
- Tienes permiso de desarrollador en Google Play ($25 USD)
- Tu cuenta Expo está verificada
- El `app.json` está configurado correctamente
