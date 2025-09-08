/**
 * 🚀 AWS S3 Chord SVG Uploader
 * Handles uploading chord SVG files to dedicated S3 bucket
 * 
 * UPDATED: Uses new naming convention with fretStartNumber instead of positionType
 * Format: chords/{theme}/{chordName}_{fretStartNumber}_{theme}.svg
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { CHORD_LIBRARY_CONFIG, generateS3Key, generateS3URL } from './chordLibraryConfig.js';

/**
 * AWS S3 Client for chord library
 */
class ChordS3Uploader {
  constructor() {
    this.config = CHORD_LIBRARY_CONFIG;
    this.s3Client = new S3Client({
      region: this.config.aws.region,
      credentials: {
        accessKeyId: this.config.aws.accessKeyId,
        secretAccessKey: this.config.aws.secretAccessKey,
      },
    });
    
    this.bucketName = this.config.aws.bucketName;
    this.logger = this.createLogger();
  }

  /**
   * Create logger instance
   */
  createLogger() {
    return {
      info: (message, data = {}) => {
        if (this.config.logging.enabled) {
          const timestamp = this.config.logging.includeTimestamps ? `[${new Date().toISOString()}] ` : '';
          console.log(`${timestamp}ℹ️ ${message}`, data);
        }
      },
      success: (message, data = {}) => {
        if (this.config.logging.enabled) {
          const timestamp = this.config.logging.includeTimestamps ? `[${new Date().toISOString()}] ` : '';
          console.log(`${timestamp}✅ ${message}`, data);
        }
      },
      warn: (message, data = {}) => {
        if (this.config.logging.enabled) {
          const timestamp = this.config.logging.includeTimestamps ? `[${new Date().toISOString()}] ` : '';
          console.warn(`${timestamp}⚠️ ${message}`, data);
        }
      },
      error: (message, error = {}) => {
        if (this.config.logging.enabled) {
          const timestamp = this.config.logging.includeTimestamps ? `[${new Date().toISOString()}] ` : '';
          console.error(`${timestamp}❌ ${message}`, error);
        }
      }
    };
  }

  /**
   * Check if file already exists in S3
   * @param {string} chordName - Chord name
   * @param {number} fretStartNumber - Fret start position (0 = NUT, 1 = 1st fret, etc.)
   * @param {string} theme - Theme (lt or dk)
   * @returns {Promise<boolean>} True if exists
   */
  async fileExists(chordName, fretStartNumber, theme) {
    try {
      const key = generateS3Key(chordName, fretStartNumber, theme);
      await this.s3Client.send(new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key
      }));
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Upload chord SVG to S3
   * @param {string} chordName - Chord name
   * @param {number} fretStartNumber - Fret start position (0 = NUT, 1 = 1st fret, etc.)
   * @param {string} theme - Theme (lt or dk)
   * @param {string} svgContent - SVG content
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadChordSVG(chordName, fretStartNumber, theme, svgContent, options = {}) {
    const { overwrite = false, retryCount = 0 } = options;
    
    try {
      // Check if file exists
      const exists = await this.fileExists(chordName, fretStartNumber, theme);
      if (exists && !overwrite) {
        this.logger.warn(`File already exists: ${chordName}_${fretStartNumber}_${theme}.svg`);
        return {
          success: false,
          exists: true,
          message: 'File already exists (use overwrite: true to force upload)',
          url: generateS3URL(chordName, fretStartNumber, theme)
        };
      }

      // Generate S3 key and URL
      const s3Key = generateS3Key(chordName, fretStartNumber, theme);
      const s3URL = generateS3URL(chordName, fretStartNumber, theme);

      // Prepare upload parameters
      const uploadParams = {
        Bucket: this.bucketName,
        Key: s3Key,
        Body: svgContent,
        ContentType: 'image/svg+xml',
        CacheControl: 'public, max-age=31536000', // 1 year cache
        Metadata: {
          'chord-name': chordName,
          'fret-start': fretStartNumber.toString(),
          'theme': theme,
          'uploaded-at': new Date().toISOString(),
          'file-size': svgContent.length.toString()
        }
      };

      // Upload to S3
      const command = new PutObjectCommand(uploadParams);
      const result = await this.s3Client.send(command);

      this.logger.success(`Uploaded: ${s3Key}`, {
        chordName,
        fretStartNumber,
        theme,
        fileSize: svgContent.length,
        etag: result.ETag
      });

      return {
        success: true,
        exists: false,
        s3Key,
        url: s3URL,
        etag: result.ETag,
        fileSize: svgContent.length,
        message: 'Upload successful'
      };

    } catch (error) {
      this.logger.error(`Upload failed: ${chordName}_${fretStartNumber}_${theme}`, error);

      // Retry logic
      if (retryCount < this.config.errors.maxRetries) {
        this.logger.info(`Retrying upload (${retryCount + 1}/${this.config.errors.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, this.config.errors.retryDelay));
        return this.uploadChordSVG(chordName, fretStartNumber, theme, svgContent, {
          ...options,
          retryCount: retryCount + 1
        });
      }

      throw new Error(`Failed to upload ${chordName}_${fretStartNumber}_${theme} after ${this.config.errors.maxRetries} retries: ${error.message}`);
    }
  }

  /**
   * Upload multiple chord SVGs
   * @param {Array} chordData - Array of chord data objects
   * @param {Object} options - Upload options
   * @returns {Promise<Array>} Upload results
   */
  async uploadMultipleChords(chordData, options = {}) {
    const { overwrite = false, concurrency = 3 } = options;
    const results = [];
    const errors = [];

    this.logger.info(`Starting batch upload of ${chordData.length} chord SVGs`);

    // Process in batches for controlled concurrency
    for (let i = 0; i < chordData.length; i += concurrency) {
      const batch = chordData.slice(i, i + concurrency);
      const batchPromises = batch.map(async (chord) => {
        try {
          const result = await this.uploadChordSVG(
            chord.chordName,
            chord.fretStartNumber,
            chord.theme,
            chord.svgContent,
            { overwrite }
          );
          return { ...result, chord };
        } catch (error) {
          const errorResult = {
            success: false,
            chord,
            error: error.message
          };
          errors.push(errorResult);
          return errorResult;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Progress logging
      this.logger.info(`Processed batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(chordData.length / concurrency)}`);
    }

    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const existing = results.filter(r => r.exists).length;

    this.logger.success(`Batch upload complete`, {
      total: chordData.length,
      successful,
      failed,
      existing,
      errors: errors.length
    });

    return {
      results,
      summary: { total: chordData.length, successful, failed, existing, errors: errors.length }
    };
  }

  /**
   * Test S3 connectivity
   * @returns {Promise<boolean>} True if connection successful
   */
  async testConnection() {
    try {
      this.logger.info('Testing S3 connection...');
      
      // Try to list objects (limited to 1 to test permissions)
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: 'test-connection'
      });
      
      await this.s3Client.send(command);
      this.logger.success('S3 connection test successful');
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        // This is expected for a test key - means we can connect
        this.logger.success('S3 connection test successful (bucket accessible)');
        return true;
      }
      
      this.logger.error('S3 connection test failed', error);
      return false;
    }
  }
}

export default ChordS3Uploader;
