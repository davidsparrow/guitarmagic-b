/**
 * 🎸 Chord Library Generator
 * Generates SVG files for all chord positions and uploads to AWS S3
 */

import fs from 'fs';
import path from 'path';
import { renderChord } from './chordRenderer.js';
import ChordS3Uploader from './awsChordUploader.js';
import { CHORD_LIBRARY_CONFIG } from './chordLibraryConfig.js';

/**
 * Main Chord Library Generator
 */
class ChordLibraryGenerator {
  constructor() {
    this.uploader = new ChordS3Uploader();
    this.config = CHORD_LIBRARY_CONFIG;
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
   * Generate SVG for a single chord position
   * @param {Object} chordData - Chord data from database
   * @param {string} theme - Theme ('light' or 'dark')
   * @returns {string} Generated SVG content
   */
  generateChordSVG(chordData, theme) {
    try {
      // Prepare chord data for renderer
      const renderData = {
        strings: chordData.strings,
        frets: chordData.frets,
        fingering: chordData.fingering,
        name: chordData.chord_name || 'Unknown',
        type: chordData.chord_type || 'major',
        root: chordData.root_note || 'C'
      };

      // Generate SVG using existing renderer
      const svgContent = renderChord(renderData, 'open', theme);
      
      this.logger.success(`Generated SVG: ${chordData.chord_name}_${chordData.position_type}_${theme}`, {
        chordName: chordData.chord_name,
        positionType: chordData.position_type,
        theme,
        fileSize: svgContent.length
      });

      return svgContent;

    } catch (error) {
      this.logger.error(`Failed to generate SVG for ${chordData.chord_name}_${chordData.position_type}_${theme}`, error);
      throw error;
    }
  }

  /**
   * Generate SVGs for all chord positions
   * @param {Array} chordPositions - Array of chord position data
   * @returns {Array} Array of chord data with SVG content
   */
  generateAllChordSVGs(chordPositions) {
    const results = [];
    const errors = [];

    this.logger.info(`Generating SVGs for ${chordPositions.length} chord positions`);

    for (const chord of chordPositions) {
      try {
        // Generate for both themes
        for (const theme of this.config.svg.themes) {
          const svgContent = this.generateChordSVG(chord, theme);
          
          results.push({
            chordName: chord.chord_name,
            positionType: chord.position_type,
            theme,
            svgContent,
            fileSize: svgContent.length,
            chordData: chord
          });
        }
      } catch (error) {
        errors.push({
          chord,
          error: error.message
        });
        this.logger.error(`Failed to generate SVG for chord: ${chord.chord_name}`, error);
      }
    }

    this.logger.success(`SVG generation complete`, {
      total: chordPositions.length * this.config.svg.themes.length,
      successful: results.length,
      failed: errors.length
    });

    return { results, errors };
  }

  /**
   * Prepare chord data for upload
   * @param {Array} svgResults - Results from SVG generation
   * @returns {Array} Formatted data for S3 upload
   */
  prepareUploadData(svgResults) {
    return svgResults.map(result => ({
      chordName: result.chordName,
      positionType: result.positionType,
      theme: result.theme,
      svgContent: result.svgContent,
      fileSize: result.fileSize
    }));
  }

  /**
   * Update database with S3 URLs
   * @param {Array} uploadResults - Results from S3 upload
   * @returns {Promise<Object>} Database update results
   */
  async updateDatabaseWithURLs(uploadResults) {
    // This would integrate with your Supabase database
    // For now, we'll return the results for manual review
    this.logger.info(`Database update ready for ${uploadResults.length} chord positions`);
    
    const updateData = uploadResults
      .filter(result => result.success)
      .map(result => ({
        chordName: result.chord.chordName,
        positionType: result.chord.positionType,
        lightThemeURL: result.chord.theme === 'light' ? result.url : null,
        darkThemeURL: result.chord.theme === 'dark' ? result.url : null,
        fileSize: result.fileSize,
        s3Key: result.s3Key
      }));

    return {
      success: true,
      message: 'Database update data prepared',
      updateData,
      totalPositions: uploadResults.length,
      successfulUpdates: updateData.length
    };
  }

  /**
   * Generate complete chord library
   * @param {Array} chordPositions - Chord position data from database
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Complete generation results
   */
  async generateChordLibrary(chordPositions, options = {}) {
    const { uploadToS3 = true, updateDatabase = false, overwrite = false } = options;

    try {
      this.logger.info('Starting chord library generation', {
        totalPositions: chordPositions.length,
        themes: this.config.svg.themes,
        uploadToS3,
        updateDatabase
      });

      // Step 1: Generate all SVGs
      const svgResults = this.generateAllChordSVGs(chordPositions);
      
      if (svgResults.errors.length > 0) {
        this.logger.warn(`SVG generation had ${svgResults.errors.length} errors`);
      }

      // Step 2: Upload to S3 (if enabled)
      let uploadResults = [];
      if (uploadToS3) {
        this.logger.info('Starting S3 upload...');
        
        // Test S3 connection first
        const connectionTest = await this.uploader.testConnection();
        if (!connectionTest) {
          throw new Error('S3 connection test failed');
        }

        // Prepare upload data
        const uploadData = this.prepareUploadData(svgResults.results);
        
        // Upload to S3
        const uploadResult = await this.uploader.uploadMultipleChords(uploadData, { overwrite });
        uploadResults = uploadResult.results;

        this.logger.success('S3 upload complete', uploadResult.summary);
      }

      // Step 3: Update database (if enabled)
      let databaseResults = null;
      if (updateDatabase && uploadResults.length > 0) {
        this.logger.info('Updating database with S3 URLs...');
        databaseResults = await this.updateDatabaseWithURLs(uploadResults);
      }

      // Final summary
      const summary = {
        totalPositions: chordPositions.length,
        totalSVGs: svgResults.results.length,
        svgErrors: svgResults.errors.length,
        uploadSuccess: uploadResults.filter(r => r.success).length,
        uploadErrors: uploadResults.filter(r => !r.success).length,
        databaseUpdated: !!databaseResults
      };

      this.logger.success('Chord library generation complete', summary);

      return {
        success: true,
        summary,
        svgResults,
        uploadResults,
        databaseResults
      };

    } catch (error) {
      this.logger.error('Chord library generation failed', error);
      throw error;
    }
  }

  /**
   * Generate library for specific chord types
   * @param {Array} chordNames - Array of chord names to generate
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generation results
   */
  async generateChordLibraryForChords(chordNames, options = {}) {
    // This would query your database for specific chord positions
    // For now, we'll use the existing chord data
    const mockChordPositions = [
      // This would come from your Supabase database
      // For testing, we'll use the structure we know works
    ];

    return this.generateChordLibrary(mockChordPositions, options);
  }
}

export default ChordLibraryGenerator;
