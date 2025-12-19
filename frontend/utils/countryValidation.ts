// Validaciones de teléfono, DNI/Cédula por país

export type CountryCode = 'AR' | 'UY' | 'CL' | 'CO' | 'PE' | 'ES' | 'MX';

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
  CL: {
    code: 'CL',
    name: 'Chile',
    flag: '🇨🇱',
    dialCode: '+56',
    idName: 'RUT',
    phoneExample: '+56 9 1234-5678',
    idExample: '12345678-K',
  },
  CO: {
    code: 'CO',
    name: 'Colombia',
    flag: '🇨🇴',
    dialCode: '+57',
    idName: 'Cédula',
    phoneExample: '+57 301 1234567',
    idExample: '1234567890',
  },
  PE: {
    code: 'PE',
    name: 'Perú',
    flag: '🇵🇪',
    dialCode: '+51',
    idName: 'DNI',
    phoneExample: '+51 912 345678',
    idExample: '12345678',
  },
  ES: {
    code: 'ES',
    name: 'España',
    flag: '🇪🇸',
    dialCode: '+34',
    idName: 'DNI',
    phoneExample: '+34 612 345678',
    idExample: '12345678A',
  },
  MX: {
    code: 'MX',
    name: 'México',
    flag: '🇲🇽',
    dialCode: '+52',
    idName: 'RFC',
    phoneExample: '+52 55 1234-5678',
    idExample: 'ABC123456XYZ0123',
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

function validatePhoneCL(phone: string): boolean {
  // Chile: +56 9 [number] o 9[number]
  // Formato internacional: +56912345678 (11 dígitos)
  // Formato nacional: 912345678 (9 dígitos empezando con 9)
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Formato internacional con +56
  if (digitsOnly.startsWith('56')) {
    return digitsOnly.length === 11;
  }
  
  // Formato nacional chileno
  if (digitsOnly.startsWith('9')) {
    return digitsOnly.length === 9;
  }
  
  return false;
}

function validatePhoneCO(phone: string): boolean {
  // Colombia: +57 [area][number] o 3[number]
  // Formato internacional: +573001234567 (12 dígitos)
  // Formato nacional: 3001234567 (10 dígitos empezando con 3)
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Formato internacional con +57
  if (digitsOnly.startsWith('57')) {
    return digitsOnly.length === 12;
  }
  
  // Formato nacional colombiano
  if (digitsOnly.startsWith('3')) {
    return digitsOnly.length === 10;
  }
  
  return false;
}

function validatePhonePE(phone: string): boolean {
  // Perú: +51 9 [number] o 9[number]
  // Formato internacional: +51912345678 (11 dígitos)
  // Formato nacional: 912345678 (9 dígitos empezando con 9)
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Formato internacional con +51
  if (digitsOnly.startsWith('51')) {
    return digitsOnly.length === 11;
  }
  
  // Formato nacional peruano
  if (digitsOnly.startsWith('9')) {
    return digitsOnly.length === 9;
  }
  
  return false;
}

function validatePhoneES(phone: string): boolean {
  // España: +34 [number] o 6/7[number]
  // Formato internacional: +34612345678 (11 dígitos)
  // Formato nacional: 612345678 (9 dígitos empezando con 6 o 7)
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Formato internacional con +34
  if (digitsOnly.startsWith('34')) {
    return digitsOnly.length === 11;
  }
  
  // Formato nacional español
  if (digitsOnly.startsWith('6') || digitsOnly.startsWith('7')) {
    return digitsOnly.length === 9;
  }
  
  return false;
}

function validatePhoneMX(phone: string): boolean {
  // México: +52 [area][number] o [area][number]
  // Formato internacional: +525512345678 (12 dígitos)
  // Formato nacional: 5512345678 (10 dígitos)
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Formato internacional con +52
  if (digitsOnly.startsWith('52')) {
    return digitsOnly.length === 12;
  }
  
  // Formato nacional mexicano
  return digitsOnly.length === 10;
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

function validateIdCL(id: string): boolean {
  // Chile RUT: 8-9 dígitos + dígito verificador (letra o número)
  // Formato: 12345678-K o 12345678-9
  const parts = id.split('-');
  if (parts.length === 2) {
    const numPart = parts[0].replace(/\D/g, '');
    const verifier = parts[1];
    return numPart.length >= 8 && numPart.length <= 9 && verifier.length === 1;
  }
  // Sin guion: 8-9 dígitos + 1 carácter
  const digitsOnly = id.replace(/\D/g, '');
  const letters = id.replace(/\d/g, '');
  return digitsOnly.length >= 8 && digitsOnly.length <= 9 && letters.length === 1;
}

function validateIdCO(id: string): boolean {
  // Colombia Cédula: 8-10 dígitos
  const digitsOnly = id.replace(/\D/g, '');
  return digitsOnly.length >= 8 && digitsOnly.length <= 10;
}

function validateIdPE(id: string): boolean {
  // Perú DNI: 8 dígitos
  const digitsOnly = id.replace(/\D/g, '');
  return digitsOnly.length === 8;
}

function validateIdES(id: string): boolean {
  // España DNI: 8 dígitos + letra
  const digitsOnly = id.replace(/\D/g, '');
  const letters = id.replace(/\d/g, '').toUpperCase();
  return digitsOnly.length === 8 && letters.length === 1;
}

function validateIdMX(id: string): boolean {
  // México RFC: 18 caracteres (3 letras empresa + 6 fecha + 3 consecutivo + 3 verificador)
  // Simplificado: 18 caracteres alfanuméricos
  return id.length === 18 && /^[A-ZÑ0-9]{18}$/.test(id.toUpperCase());
}

// API pública
export function validatePhone(phone: string, country: CountryCode): { valid: boolean; error?: string } {
  if (!phone || phone.trim() === '') {
    return { valid: false, error: 'El teléfono es requerido' };
  }

  const validators: Record<CountryCode, (p: string) => boolean> = {
    AR: validatePhoneAR,
    UY: validatePhoneUY,
    CL: validatePhoneCL,
    CO: validatePhoneCO,
    PE: validatePhonePE,
    ES: validatePhoneES,
    MX: validatePhoneMX,
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
    CL: validateIdCL,
    CO: validateIdCO,
    PE: validateIdPE,
    ES: validateIdES,
    MX: validateIdMX,
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
    case 'CL':
      // 912345678 -> 56912345678
      if (digitsOnly.startsWith('9')) {
        return dialCode + digitsOnly;
      }
      break;
    case 'CO':
      // 3001234567 -> 573001234567
      if (digitsOnly.startsWith('3')) {
        return dialCode + digitsOnly;
      }
      break;
    case 'PE':
      // 912345678 -> 51912345678
      if (digitsOnly.startsWith('9')) {
        return dialCode + digitsOnly;
      }
      break;
    case 'ES':
      // 612345678 -> 34612345678
      if (digitsOnly.startsWith('6') || digitsOnly.startsWith('7')) {
        return dialCode + digitsOnly;
      }
      break;
    case 'MX':
      // 5512345678 -> 525512345678
      if (digitsOnly.length === 10) {
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
