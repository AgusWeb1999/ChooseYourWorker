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
    phoneExample: '+598 9 1234-5678',
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
  // Argentina: +54 9 [area code][number]
  // Formato flexible: solo dígitos, debe tener 10 dígitos (sin +54)
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
}

function validatePhoneUY(phone: string): boolean {
  // Uruguay: +598 9 [number]
  // Debe tener 7-8 dígitos después de +598 9
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 8 && digitsOnly.length <= 10;
}

function validatePhoneCL(phone: string): boolean {
  // Chile: +56 9 [number]
  // Debe tener 8-9 dígitos
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 8 && digitsOnly.length <= 10;
}

function validatePhoneCO(phone: string): boolean {
  // Colombia: +57 [area][number]
  // Debe tener 10 dígitos
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length === 10;
}

function validatePhonePE(phone: string): boolean {
  // Perú: +51 9 [number]
  // Debe tener 9 dígitos
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length === 9;
}

function validatePhoneES(phone: string): boolean {
  // España: +34 6 o +34 7 [number]
  // Debe tener 9 dígitos
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length === 9;
}

function validatePhoneMX(phone: string): boolean {
  // México: +52 [area][number]
  // Debe tener 10 dígitos
  const digitsOnly = phone.replace(/\D/g, '');
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

// Normalizar teléfono (guardar en BD sin símbolos)
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
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
