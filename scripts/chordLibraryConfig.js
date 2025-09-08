/**
 * 🎸 Chord Library Configuration
 * AWS S3 integration for chord SVG storage and delivery
 */

export const CHORD_LIBRARY_CONFIG = {
  // AWS Configuration
  aws: {
    region: 'us-west-2', // Your preferred region
    bucketName: 'guitarmagic-chord-library', // NEW dedicated bucket
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },

  // SVG Generation Settings
  svg: {
    width: 160,
    height: 140,
    themes: ['light', 'dark'],
    quality: 'high',
    fileFormat: 'svg',
  },

  // Chord Position Types
  positionTypes: {
    open: 'open',
    barre: 'barre', 
    power: 'power',
    complex: 'complex',
    sus2: 'sus2',
    sus4: 'sus4',
    add9: 'add9',
    maj7: 'maj7',
    m7: 'm7',
    dim: 'dim',
    aug: 'aug'
  },

  // Difficulty Levels
  difficulties: {
    beginner: 'beginner',
    intermediate: 'intermediate', 
    advanced: 'advanced',
    expert: 'expert'
  },

  // Categories
  categories: {
    openChords: 'open_chords',
    barreChords: 'barre_chords',
    powerChords: 'power_chords',
    complexChords: 'complex_chords',
    suspendedChords: 'suspended_chords',
    extendedChords: 'extended_chords'
  },

  // File Naming Convention
  naming: {
    // Format: /chords/{theme}/{chordName}_{positionType}.svg
    // Examples: 
    // /chords/light/Am_open.svg
    // /chords/dark/F_barre.svg
    // /chords/light/B6add9_complex.svg
    basePath: 'chords',
    separator: '_',
    extension: '.svg'
  },

  // AWS S3 URL Structure
  urls: {
    // Base URL format: https://{bucketName}.s3.{region}.amazonaws.com
    base: 'https://guitarmagic-chord-library.s3.us-west-2.amazonaws.com',
    // Full URL format: {base}/{basePath}/{theme}/{chordName}_{positionType}.svg
    // Example: https://guitarmagic-chord-library.s3.us-west-2.amazonaws.com/chords/light/Am_open.svg
  },

  // Error Handling
  errors: {
    maxRetries: 3,
    retryDelay: 1000, // milliseconds
    timeout: 30000, // milliseconds
  },

  // Logging
  logging: {
    enabled: true,
    level: 'info', // 'debug', 'info', 'warn', 'error'
    includeTimestamps: true,
  }
};

/**
 * Generate S3 key for chord SVG
 * @param {string} chordName - Chord name (e.g., "Am", "C", "F")
 * @param {string} positionType - Position type (e.g., "open", "barre", "complex")
 * @param {string} theme - Theme ("light" or "dark")
 * @returns {string} S3 key path
 */
export const generateS3Key = (chordName, positionType, theme) => {
  const { basePath, separator, extension } = CHORD_LIBRARY_CONFIG.naming;
  return `${basePath}/${theme}/${chordName}${separator}${positionType}${extension}`;
};

/**
 * Generate full S3 URL for chord SVG
 * @param {string} chordName - Chord name
 * @param {string} positionType - Position type  
 * @param {string} theme - Theme
 * @returns {string} Full S3 URL
 */
export const generateS3URL = (chordName, positionType, theme) => {
  const { urls } = CHORD_LIBRARY_CONFIG;
  const s3Key = generateS3Key(chordName, positionType, theme);
  return `${urls.base}/${s3Key}`;
};

/**
 * Validate chord configuration
 * @param {Object} config - Configuration object
 * @returns {boolean} True if valid
 */
export const validateConfig = (config) => {
  const required = ['aws', 'svg', 'naming', 'urls'];
  return required.every(key => config[key] !== undefined);
};

export default CHORD_LIBRARY_CONFIG;
