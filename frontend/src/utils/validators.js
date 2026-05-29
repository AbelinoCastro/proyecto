// Utilidades para validar y restringir entrada en inputs

// Solo dígitos: bloquea cualquier carácter que no sea 0-9
export const onlyDigits = (e) => {
    e.target.value = e.target.value.replace(/[^\d]/g, '');
    return e;
};

// Dígitos con guion: para NIT formato 1234567-8
export const nitFormat = (e) => {
    let v = e.target.value.replace(/[^\d-]/g, '');
    if (v.length > 9) v = v.slice(0, 9);
    e.target.value = v;
    return e;
};

// Limita longitud máxima
export const maxLen = (max) => (e) => {
    if (e.target.value.length > max) e.target.value = e.target.value.slice(0, max);
    return e;
};

// Combina solo dígitos + longitud máxima
export const digitsMax = (max) => (e) => {
    let v = e.target.value.replace(/[^\d]/g, '');
    if (v.length > max) v = v.slice(0, max);
    e.target.value = v;
    return e;
};

// Solo letras y espacios (para nombres)
export const onlyLetters = (e) => {
    e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    return e;
};

// Decimal con un punto
export const decimalFormat = (e) => {
    let v = e.target.value.replace(/[^\d.]/g, '');
    const parts = v.split('.');
    if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
    e.target.value = v;
    return e;
};

// Validación de email (devuelve true si formato es válido)
export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Validación DPI Guatemala (13 dígitos)
export const isValidDPI = (dpi) => /^\d{13}$/.test(dpi);

// Validación teléfono Guatemala (8 dígitos)
export const isValidPhone = (phone) => /^\d{8}$/.test(phone);

// Validación NIT Guatemala (formato XXXXXXX-X o XXXXXXXX-X)
export const isValidNIT = (nit) => /^\d{1,9}-?[\dkK]$/.test(nit);

// Patrones HTML5 pattern attribute para forms
export const PATTERNS = {
    digits:     '\\d+',
    phone:      '\\d{8}',
    dpi:        '\\d{13}',
    nit:        '\\d{1,9}-?[\\dkK]',
    email:      '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}',
    afiliacion: '\\d{7,11}',
};
