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
   * Update database with S3 URLs and create chord records
   * @param {Array} uploadResults - Results from S3 upload
   * @returns {Promise<Object>} Database update results
   */
  async updateDatabaseWithURLs(uploadResults) {
    try {
      this.logger.info(`Starting database integration for ${uploadResults.length} chord positions`);
      
      // Import Supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase environment variables');
      }
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Group upload results by chord name
      const chordGroups = {};
      uploadResults
        .filter(result => result.success)
        .forEach(result => {
          const chordName = result.chord.chordName;
          if (!chordGroups[chordName]) {
            chordGroups[chordName] = [];
          }
          chordGroups[chordName].push(result);
        });
      
      const chordVariations = {};
      let createdVariations = 0;
      let createdPositions = 0;
      
      // Step 1: Create or find chord_variations
      for (const [chordName, results] of Object.entries(chordGroups)) {
        this.logger.info(`Processing chord variation: ${chordName}`);
        
        // Check if chord_variation already exists
        const { data: existingVariation, error: checkError } = await supabase
          .from('chord_variations')
          .select('id')
          .eq('chord_name', chordName)
          .single();
        
        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }
        
        let variationId;
        if (existingVariation) {
          this.logger.info(`Found existing chord_variation: ${chordName}`);
          variationId = existingVariation.id;
        } else {
          // Create new chord_variation
          const { data: newVariation, error: createError } = await supabase
            .from('chord_variations')
            .insert([{ 
              chord_name: chordName,
              display_name: chordName,
              root_note: chordName.replace(/[^A-G#b]/g, ''),
              chord_type: 'major',
              difficulty: 'intermediate',
              category: 'barre_chords',
              total_variations: 1
            }])
            .select()
            .single();
          
          if (createError) throw createError;
          
          this.logger.success(`Created new chord_variation: ${chordName}`);
          variationId = newVariation.id;
          createdVariations++;
        }
        
        chordVariations[chordName] = variationId;
        
        // Step 2: Create chord_positions for each theme
        for (const result of results) {
          const { chordName, positionType, theme } = result.chord;
          // URL encode the chord name for proper S3 URL handling
          const encodedChordName = encodeURIComponent(chordName);
          const chordPositionFullName = `${encodedChordName}-${positionType}`;
          
          // Check if chord_position already exists
          const { data: existingPosition, error: checkError } = await supabase
            .from('chord_positions')
            .select('id')
            .eq('chord_name', chordName)
            .eq('fret_position', positionType)
            .single();
          
          if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
          }
          
          if (existingPosition) {
            this.logger.info(`Found existing chord_position: ${chordPositionFullName}`);
            // Update existing record with new URL
            const updateField = theme === 'light' ? 'aws_svg_url_light' : 'aws_svg_url_dark';
            const { error: updateError } = await supabase
              .from('chord_positions')
              .update({ [updateField]: result.url })
              .eq('id', existingPosition.id);
            
            if (updateError) throw updateError;
            this.logger.success(`Updated ${theme} URL for ${chordPositionFullName}`);
          } else {
            // Create new chord_position
            const { data: newPosition, error: createError } = await supabase
              .from('chord_positions')
              .insert([{
                chord_variation_id: variationId,
                chord_name: chordName,
                fret_position: positionType,
                chord_position_full_name: chordPositionFullName,
                position_type: 'open',
                strings: ['E', 'A', 'D', 'G', 'B', 'E'],
                frets: ['0', '0', '0', '0', '0', '0'],
                fingering: ['0', '0', '0', '0', '0', '0'],
                barre: false,
                barre_fret: null,
                aws_svg_url_light: theme === 'light' ? result.url : null,
                aws_svg_url_dark: theme === 'dark' ? result.url : null,
                metadata: {
                  source: 'chord_library_generator',
                  popularity: 'medium'
                }
              }])
              .select()
              .single();
            
            if (createError) throw createError;
            
            this.logger.success(`Created new chord_position: ${chordPositionFullName}`);
            createdPositions++;
          }
        }
      }
      
      this.logger.success(`Database integration complete`, {
        createdVariations,
        createdPositions,
        totalProcessed: uploadResults.length
      });
      
      return {
        success: true,
        message: 'Database integration completed successfully',
        createdVariations,
        createdPositions,
        totalProcessed: uploadResults.length
      };
      
    } catch (error) {
      this.logger.error('Database integration failed', error);
      throw error;
    }
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
