export const RECAPTCHA_CONFIG = {
  secretKey: process.env.RECAPTCHA_SECRET_KEY || '',
  minScore: parseFloat(process.env.RECAPTCHA_MIN_SCORE || '0.5'),
  skipValidation: String(process.env.RECAPTCHA_SKIP_VALIDATION || 'false').toLowerCase() === 'true',
  verifyUrl: 'https://www.google.com/recaptcha/api/siteverify',
};

// Validar que la secret key esté configurada
if (!RECAPTCHA_CONFIG.secretKey) {
  console.warn('⚠ RECAPTCHA_SECRET_KEY not configured. Recaptcha validation will not work properly.');
}
