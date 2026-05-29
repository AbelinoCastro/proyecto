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

// Solo letras (incl. acentos) y espacios — para nombres de personas
export const onlyLetters = (e) => {
    e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s']/g, '');
    return e;
};

// Texto "seguro" — letras, números, espacios y unos pocos signos básicos (. , - / )
// Bloquea: <>&"';\(){}[]*|@#$%^!?=+`~
export const safeText = (e) => {
    e.target.value = e.target.value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.,\-/]/g, '');
    return e;
};

// Texto seguro con max len
export const safeTextMax = (max) => (e) => {
    let v = e.target.value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.,\-/]/g, '');
    if (v.length > max) v = v.slice(0, max);
    e.target.value = v;
    return e;
};

// Solo letras + espacios + max len (nombres de persona)
export const lettersMax = (max) => (e) => {
    let v = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s']/g, '');
    if (v.length > max) v = v.slice(0, max);
    e.target.value = v;
    return e;
};

// Alfanumérico mayúsculas — para códigos tipo P0001, DED01, J1 (sin chars especiales)
export const codeMax = (max) => (e) => {
    let v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (v.length > max) v = v.slice(0, max);
    e.target.value = v;
    return e;
};

// Decimal con un solo punto (positivo)
export const decimalFormat = (e) => {
    let v = e.target.value.replace(/[^\d.]/g, '');
    const parts = v.split('.');
    if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
    e.target.value = v;
    return e;
};

// Validaciones booleanas
export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const isValidDPI   = (dpi) => /^\d{13}$/.test(dpi);
export const isValidPhone = (phone) => /^\d{8}$/.test(phone);
export const isValidNIT   = (nit) => /^\d{1,9}-?[\dkK]$/.test(nit);

// Formato de números con coma para miles. Ej: 1234567.89 → "1,234,567.89"
export const formatMiles = (n, decimals = 2) => {
    const num = Number(n || 0);
    return num.toLocaleString('es-GT', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
};

// Formato moneda en Quetzales. Ej: 1234567.89 → "Q 1,234,567.89"
export const formatQ = (n) => `Q ${formatMiles(n)}`;

// Slug de nombre para archivos. "Juan Pérez García" → "Juan_Perez_Garcia"
export const slugify = (str) => {
    return (str || '')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')   // quitar acentos
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '_');
};

// Patrones HTML5 pattern attribute para forms
export const PATTERNS = {
    digits:     '\\d+',
    phone:      '\\d{8}',
    dpi:        '\\d{13}',
    nit:        '\\d{1,9}-?[\\dkK]',
    email:      '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}',
    afiliacion: '\\d{7,11}',
};
