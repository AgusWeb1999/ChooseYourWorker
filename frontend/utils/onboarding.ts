// Utilidad para guardar y leer si el onboarding ya fue visto

export function setOnboardingSeen(type: 'cliente' | 'profesional') {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('onboardingSeen_' + type, '1');
    }
  } catch {}
}

export function hasSeenOnboarding(type: 'cliente' | 'profesional') {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('onboardingSeen_' + type) === '1';
    }
  } catch {}
  return false;
}
