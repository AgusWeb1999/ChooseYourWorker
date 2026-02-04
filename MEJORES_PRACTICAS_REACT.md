# 🛡️ Mejores Prácticas React - Evitar Errores de Navegación

## Problemas Solucionados

### 1. **Actualizaciones de estado en componentes desmontados**
❌ **Error común:**
```javascript
useEffect(() => {
  fetchData().then(data => setState(data));
}, []);
```

✅ **Solución:**
```javascript
useEffect(() => {
  let isMounted = true;
  fetchData().then(data => {
    if (isMounted) setState(data);
  });
  return () => { isMounted = false; };
}, []);
```

### 2. **Limpieza de animaciones**
❌ **Error común:**
```javascript
useEffect(() => {
  const interval = setInterval(() => {
    Animated.timing(fadeAnim, {...}).start();
  }, 5000);
  return () => clearInterval(interval);
}, []);
```

✅ **Solución:**
```javascript
useEffect(() => {
  let animationRef;
  const interval = setInterval(() => {
    animationRef = Animated.timing(fadeAnim, {...}).start();
  }, 5000);
  return () => {
    clearInterval(interval);
    fadeAnim.stopAnimation();
  };
}, []);
```

### 3. **Limpieza de event listeners**
❌ **Error común:**
```javascript
useEffect(() => {
  Dimensions.addEventListener('change', handler);
}, []);
```

✅ **Solución:**
```javascript
useEffect(() => {
  const subscription = Dimensions.addEventListener('change', handler);
  return () => {
    if (subscription?.remove) subscription.remove();
  };
}, []);
```

### 4. **useRef para componente montado**
✅ **Patrón recomendado:**
```javascript
const isMountedRef = useRef(true);

useEffect(() => {
  return () => { isMountedRef.current = false; };
}, []);

async function handleAction() {
  const result = await someAsyncCall();
  if (!isMountedRef.current) return; // Evita actualizar si está desmontado
  setState(result);
}
```

### 5. **Navegación segura con setTimeout**
❌ **Error común:**
```javascript
setTimeout(() => {
  router.push('/somewhere');
}, 2000);
```

✅ **Solución:**
```javascript
setTimeout(() => {
  if (isMountedRef.current) {
    router.push('/somewhere');
  }
}, 2000);
```

## Checklist antes de cada componente

- [ ] ¿Todos los `useEffect` tienen función de limpieza?
- [ ] ¿Las llamadas async verifican si el componente está montado?
- [ ] ¿Los `setInterval/setTimeout` se limpian correctamente?
- [ ] ¿Las animaciones se detienen al desmontar?
- [ ] ¿Los event listeners se remueven?
- [ ] ¿Las suscripciones (Supabase, etc.) se cancelan?

## Errores comunes al navegar

### "Can't perform a React state update on unmounted component"
**Causa:** Actualizar estado después de que el componente se desmontó
**Solución:** Usar `isMountedRef` o flag `isMounted` local

### "Memory leak detected"
**Causa:** No limpiar efectos (timers, listeners, suscripciones)
**Solución:** Siempre retornar función de limpieza en `useEffect`

### "Animated: value not initialized"
**Causa:** Animación continúa después de desmontar
**Solución:** Llamar `.stopAnimation()` en cleanup

## Implementado en login.tsx

✅ Flag `isMountedRef` para rastrear si el componente está montado
✅ Limpieza de intervalos del carrusel
✅ Detención de animaciones al desmontar
✅ Verificación antes de actualizar estado en funciones async
✅ Navegación segura con setTimeout
✅ Limpieza de event listeners de Dimensions
