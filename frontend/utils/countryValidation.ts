// Validaciones de teléfono, DNI/Cédula por país

export type CountryCode = 'AR' | 'UY';

export interface CountryInfo {
  code: CountryCode;
  name: string;
  flag: string;
  dialCode: string;
  idName: string;
  phoneExample: string;
  idExample: string;
}

export const COUNTRIES: Record<CountryCode, CountryInfo> = {
  AR: {
    code: 'AR',
    name: 'Argentina',
    flag: '🇦🇷',
    dialCode: '+54',
    idName: 'DNI',
    phoneExample: '+54 9 11 1234-5678',
    idExample: '12345678',
  },
  UY: {
    code: 'UY',
    name: 'Uruguay',
    flag: '🇺🇾',
    dialCode: '+598',
    idName: 'Cédula',
    phoneExample: '+598 99 123 456 o 099 123 456',
    idExample: '12345678',
  },
};

// Funciones de validación de teléfono
function validatePhoneAR(phone: string): boolean {
  // Argentina: +54 9 [area code][number] o 011[number]
  // Formato internacional: +5491112345678 (13 dígitos)
  // Formato nacional: 01112345678 (10-11 dígitos)
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Formato internacional con +54
  if (digitsOnly.startsWith('54')) {
    return digitsOnly.length >= 12 && digitsOnly.length <= 13;
  }
  
  // Formato nacional argentino
  if (digitsOnly.startsWith('0') || digitsOnly.startsWith('15')) {
    return digitsOnly.length >= 10 && digitsOnly.length <= 11;
  }
  
  return false;
}

function validatePhoneUY(phone: string): boolean {
  // Uruguay: +598 9 [number] o 09[number]
  // Formato internacional: +59899123456 (11 dígitos totales)
  // Formato nacional: 099123456 (9 dígitos empezando con 09)
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Formato internacional con +598
  if (digitsOnly.startsWith('598')) {
    return digitsOnly.length === 11; // +598 9 9123456 = 11 dígitos
  }
  
  // Formato nacional uruguayo (09x xxx xxx)
  if (digitsOnly.startsWith('09')) {
    return digitsOnly.length === 9; // 099123456 = 9 dígitos
  }
  
  return false;
}

// Funciones de validación de DNI/Cédula
function validateIdAR(id: string): boolean {
  // Argentina DNI: 8 dígitos (pueden tener hasta 9 para muy antiguos)
  const digitsOnly = id.replace(/\D/g, '');
  return digitsOnly.length >= 7 && digitsOnly.length <= 9;
}

function validateIdUY(id: string): boolean {
  // Uruguay Cédula: 8 dígitos
  const digitsOnly = id.replace(/\D/g, '');
  return digitsOnly.length === 8;
}

// API pública
export function validatePhone(phone: string, country: CountryCode): { valid: boolean; error?: string } {
  if (!phone || phone.trim() === '') {
    return { valid: false, error: 'El teléfono es requerido' };
  }

  const validators: Record<CountryCode, (p: string) => boolean> = {
    AR: validatePhoneAR,
    UY: validatePhoneUY,
  };

  const isValid = validators[country](phone);
  if (!isValid) {
    const countryInfo = COUNTRIES[country];
    return {
      valid: false,
      error: `Formato de teléfono inválido. Ejemplo: ${countryInfo.phoneExample}`,
    };
  }

  return { valid: true };
}

export function validateId(id: string, country: CountryCode): { valid: boolean; error?: string } {
  if (!id || id.trim() === '') {
    const countryInfo = COUNTRIES[country];
    return { valid: false, error: `${countryInfo.idName} es requerido` };
  }

  const validators: Record<CountryCode, (d: string) => boolean> = {
    AR: validateIdAR,
    UY: validateIdUY,
  };

  const isValid = validators[country](id);
  if (!isValid) {
    const countryInfo = COUNTRIES[country];
    return {
      valid: false,
      error: `Formato de ${countryInfo.idName} inválido. Ejemplo: ${countryInfo.idExample}`,
    };
  }

  return { valid: true };
}

// Normalizar teléfono (guardar en BD en formato internacional)
export function normalizePhone(phone: string, country?: CountryCode): string {
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Si no se especifica país o ya tiene código de país, devolver solo dígitos
  if (!country) {
    return digitsOnly;
  }
  
  // Si ya tiene código de país internacional, devolver como está
  if (digitsOnly.startsWith(COUNTRIES[country].dialCode.replace('+', ''))) {
    return digitsOnly;
  }
  
  // Convertir formato nacional a internacional según el país
  const dialCode = COUNTRIES[country].dialCode.replace('+', '');
  
  switch (country) {
    case 'UY':
      // 099123456 -> 59899123456
      if (digitsOnly.startsWith('09')) {
        return dialCode + '9' + digitsOnly.substring(2);
      }
      break;
    case 'AR':
      // 01112345678 -> 5491112345678
      if (digitsOnly.startsWith('0')) {
        return dialCode + '9' + digitsOnly.substring(1);
      }
      // 1512345678 -> 541512345678
      if (digitsOnly.startsWith('15')) {
        return dialCode + digitsOnly;
      }
      break;
  }
  
  return digitsOnly;
}

// Normalizar ID (guardar en BD sin símbolos)
export function normalizeId(id: string): string {
  // Mantener guiones para RUT chileno
  return id.toUpperCase().replace(/\s+/g, '');
}

// Obtener todos los países para selects
export function getCountriesList(): CountryInfo[] {
  return Object.values(COUNTRIES).sort((a, b) => a.name.localeCompare(b.name));
}
