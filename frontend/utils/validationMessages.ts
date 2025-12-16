// Spanish validation messages and error handling
export const validationMessages = {
  // Email validation
  email: {
    required: 'El email es requerido',
    invalid: 'Por favor ingresa un email válido',
  },

  // Password validation
  password: {
    required: 'La contraseña es requerida',
    tooShort: 'La contraseña debe tener al menos 6 caracteres',
    weak: 'La contraseña debe contener letras y números',
    missingUppercase: 'La contraseña debe contener al menos una letra mayúscula',
    missingNumber: 'La contraseña debe contener al menos un número',
  },

  // Name fields
  name: {
    required: 'El nombre es requerido',
    tooShort: 'El nombre debe tener al menos 2 caracteres',
    invalid: 'El nombre solo puede contener letras y espacios',
  },

  firstName: {
    required: 'El nombre es requerido',
    tooShort: 'El nombre debe tener al menos 2 caracteres',
  },

  lastName: {
    required: 'El apellido es requerido',
    tooShort: 'El apellido debe tener al menos 2 caracteres',
  },

  // Phone
  phone: {
    required: 'El teléfono es requerido',
    invalid: 'Por favor ingresa un teléfono válido',
  },

  // Address
  address: {
    required: 'La dirección es requerida',
    tooShort: 'Por favor ingresa una dirección más completa',
  },

  // City/Location
  city: {
    required: 'La ciudad es requerida',
  },

  // Bio/Description
  bio: {
    required: 'La descripción es requerida',
    tooShort: 'La descripción debe tener al menos 10 caracteres',
    tooLong: 'La descripción no puede exceder 500 caracteres',
  },

  // Skills
  skills: {
    required: 'Debes seleccionar al menos una habilidad',
    tooMany: 'No puedes seleccionar más de 10 habilidades',
  },

  // Category
  category: {
    required: 'Debes seleccionar una categoría',
  },

  // Rate/Price
  rate: {
    required: 'El precio/tarifa es requerida',
    invalid: 'Por favor ingresa un precio válido',
    tooLow: 'El precio debe ser mayor a 0',
  },

  // Title/Job Title
  title: {
    required: 'El título es requerido',
    tooShort: 'El título debe tener al menos 5 caracteres',
    tooLong: 'El título no puede exceder 100 caracteres',
  },

  // Description/Job Description
  description: {
    required: 'La descripción es requerida',
    tooShort: 'La descripción debe tener al menos 20 caracteres',
    tooLong: 'La descripción no puede exceder 1000 caracteres',
  },

  // Message for hire
  message: {
    required: 'Debes escribir un mensaje para el trabajador',
    tooShort: 'El mensaje debe tener al menos 10 caracteres',
    tooLong: 'El mensaje no puede exceder 500 caracteres',
  },

  // General
  general: {
    required: 'Este campo es requerido',
    invalid: 'Por favor verifica los datos ingresados',
    error: 'Ocurrió un error. Intenta nuevamente',
    success: 'Operación completada exitosamente',
    saved: 'Cambios guardados exitosamente',
    loading: 'Cargando...',
    tryAgain: 'Intenta nuevamente',
  },

  // Auth specific
  auth: {
    passwordsNotMatch: 'Las contraseñas no coinciden',
    accountNotFound: 'Usuario no encontrado',
    incorrectPassword: 'Contraseña incorrecta',
    emailAlreadyExists: 'Este email ya está registrado',
    accountCreated: 'Cuenta creada exitosamente',
    loginSuccess: 'Sesión iniciada exitosamente',
    logoutSuccess: 'Sesión cerrada exitosamente',
    sessionExpired: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente',
  },

  // Hire/Contract specific
  hire: {
    messageSent: 'Solicitud enviada al trabajador',
    messageError: 'Error al enviar la solicitud',
    acceptedSuccess: 'Solicitud aceptada exitosamente',
    rejectedSuccess: 'Solicitud rechazada',
    completionRequested: 'Solicitud de finalización enviada',
    completionApproved: 'Trabajo marcado como completado',
    contactShared: 'Datos de contacto compartidos',
  },

  // Network/Connection
  network: {
    noConnection: 'No hay conexión a internet',
    checkConnection: 'Por favor verifica tu conexión',
    serverError: 'Error del servidor. Intenta nuevamente más tarde',
    timeout: 'La solicitud tardó demasiado. Intenta nuevamente',
  },
};

// Function to validate email
export const validateEmail = (email: string): string | null => {
  if (!email) return validationMessages.email.required;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return validationMessages.email.invalid;
  return null;
};

// Function to validate password
export const validatePassword = (password: string): string | null => {
  if (!password) return validationMessages.password.required;
  if (password.length < 6) return validationMessages.password.tooShort;
  if (!/[a-z]/.test(password)) return validationMessages.password.weak;
  if (!/[0-9]/.test(password)) return validationMessages.password.missingNumber;
  return null;
};

// Function to validate name
export const validateName = (name: string, fieldName: string = 'Nombre'): string | null => {
  if (!name) return `${fieldName} es requerido`;
  if (name.length < 2) return `${fieldName} debe tener al menos 2 caracteres`;
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name)) return `${fieldName} solo puede contener letras y espacios`;
  return null;
};

// Function to validate bio
export const validateBio = (bio: string): string | null => {
  if (!bio) return validationMessages.bio.required;
  if (bio.length < 10) return validationMessages.bio.tooShort;
  if (bio.length > 500) return validationMessages.bio.tooLong;
  return null;
};

// Function to validate message for hire
export const validateHireMessage = (message: string): string | null => {
  if (!message) return validationMessages.message.required;
  if (message.length < 10) return validationMessages.message.tooShort;
  if (message.length > 500) return validationMessages.message.tooLong;
  return null;
};
