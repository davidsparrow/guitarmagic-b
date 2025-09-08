/**
 * 🎸 All-Guitar-Chords.com Scraper
 * Scrapes chord variations and positions from all-guitar-chords.com
 * Integrates with existing Supabase database system
 */

import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from project root
dotenv.config({ path: '../../.env' });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * All-Guitar-Chords.com Scraper Class
 */
class AllGuitarChordsScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseURL = 'https://www.all-guitar-chords.com';
    this.rateLimitDelay = 1000; // 1 second between requests
    this.scrapedChords = new Set(); // Track processed chords
    this.errors = [];
    this.stats = {
      chordVariationsCreated: 0,
      chordPositionsCreated: 0,
      errors: 0,
      skipped: 0
    };
  }

  /**
   * Initialize Puppeteer browser
   */
  async init() {
    try {
      console.log('🚀 Initializing All-Guitar-Chords scraper...');
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      this.page = await this.browser.newPage();
      
      // Set user agent to avoid detection
      await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      console.log('✅ Browser initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize browser:', error);
      throw error;
    }
  }

  /**
   * Close browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔒 Browser closed');
    }
  }

  /**
   * Rate limiting delay
   */
  async delay(ms = this.rateLimitDelay) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Scrape the main chords index page
   */
  async scrapeMainIndex() {
    try {
      console.log('📋 Scraping main chords index page...');
      await this.page.goto(`${this.baseURL}/chords/index`, { waitUntil: 'networkidle2' });
      await this.delay(2000); // Wait for page to fully load

      // Extract all chord links
      const chordLinks = await this.page.evaluate(() => {
        const links = [];
        const linkElements = document.querySelectorAll('a[href*="/chords/index/"]');
        
        linkElements.forEach(link => {
          const href = link.getAttribute('href');
          const text = link.textContent.trim();
          
          // Skip chords with (*) characters
          if (text.includes('(') && text.includes(')')) {
            return;
          }
          
          // Skip if already processed
          if (links.some(l => l.text === text)) {
            return;
          }
          
          links.push({
            url: href,
            text: text,
            fullUrl: href.startsWith('http') ? href : `https://www.all-guitar-chords.com${href}`
          });
        });
        
        return links;
      });

      console.log(`📊 Found ${chordLinks.length} chord links to process`);
      return chordLinks;
    } catch (error) {
      console.error('❌ Failed to scrape main index:', error);
      throw error;
    }
  }

  /**
   * Scrape individual chord page
   */
  async scrapeChordPage(chordLink) {
    try {
      console.log(`🎵 Scraping chord: ${chordLink.text}`);
      await this.page.goto(chordLink.fullUrl, { waitUntil: 'networkidle2' });
      await this.delay(1000);

      // Extract chord variation data
      const chordVariation = await this.extractChordVariation();
      
      // Extract chord positions (variations)
      const chordPositions = await this.extractChordPositions();

      return {
        chordVariation,
        chordPositions
      };
    } catch (error) {
      console.error(`❌ Failed to scrape chord ${chordLink.text}:`, error);
      this.errors.push({ chord: chordLink.text, error: error.message });
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Extract chord variation metadata from page
   */
  async extractChordVariation() {
    try {
      const variationData = await this.page.evaluate(() => {
        // Extract chord name and display name from page title
        const titleElement = document.querySelector('h1, .chord-title, title');
        if (!titleElement) return null;

        const titleText = titleElement.textContent.trim();
        
        // Parse title like "C guitar chord (C Major)" or "Cdim7 guitar chord (C Diminished Seventh)"
        const match = titleText.match(/([A-G#b]+[^)]*?)\s+guitar\s+chord\s+\(([^)]+)\)/i);
        if (!match) return null;

        const shortName = match[1].trim();
        let longName = match[2].trim();
        
        // Clean up long name
        longName = longName
          .replace(/Seventh/g, '7th')
          .replace(/Added/g, 'Add')
          .replace(/Major\s+7th/g, 'Major 7th')
          .replace(/Minor\s+7th/g, 'Minor 7th');

        // Extract root note (first part before any modifiers)
        const rootMatch = shortName.match(/^([A-G#b]+)/);
        const rootNote = rootMatch ? rootMatch[1] : shortName;

        // Extract chord type (everything after root note)
        const chordType = shortName.replace(rootNote, '').trim() || 'Major';

        return {
          chord_name: shortName,
          display_name: longName,
          root_note: rootNote,
          chord_type: chordType
        };
      });

      if (!variationData) {
        throw new Error('Could not extract chord variation data');
      }

      console.log(`  📝 Chord variation: ${variationData.chord_name} (${variationData.display_name})`);
      return variationData;
    } catch (error) {
      console.error('❌ Failed to extract chord variation:', error);
      throw error;
    }
  }

  /**
   * Extract chord positions (variations) from page
   */
  async extractChordPositions() {
    try {
      const positions = await this.page.evaluate(() => {
        const variations = [];
        
        // Find all ul elements that contain chord instructions
        const ulElements = document.querySelectorAll('ul');
        
        ulElements.forEach((ulElement, index) => {
          try {
            // Check if this ul contains chord instructions (has fret and string info)
            const fullText = ulElement.textContent.trim();
            if (fullText.includes('fret') && fullText.includes('string')) {
              console.log(`    📝 Processing instructions: ${fullText.substring(0, 100)}...`);
              
              const variation = {
                variationNumber: index + 1,
                instructions: fullText,
                strings: ['E', 'A', 'D', 'G', 'B', 'E'], // Static string array
                frets: ['X', 'X', 'X', 'X', 'X', 'X'], // Initialize with X
                fingering: ['X', 'X', 'X', 'X', 'X', 'X'], // Initialize with X (finger numbers)
                fretFingerData: ['X', 'X', 'X', 'X', 'X', 'X'], // Initialize with X (fret-finger)
                positionType: 'open_chords', // Default
                barre: false
              };

              // Extract individual <li> elements and process each one
              const liElements = ulElement.querySelectorAll('li');
              let lowestFret = 999;
              let hasBarre = false;

              liElements.forEach(liElement => {
                const line = liElement.textContent.trim();
                console.log(`      🔍 Processing line: "${line}"`);
                
                // Check for mute instructions first
                const muteMatch = line.match(/mute\s+the\s+(\d+)(?:st|nd|rd|th)?\s+string/);
                if (muteMatch) {
                  const stringNumber = parseInt(muteMatch[1]);
                  // Map string number to array index (6th=0, 5th=1, 4th=2, 3rd=3, 2nd=4, 1st=5)
                  const stringIndex = 6 - stringNumber;
                  if (stringIndex >= 0 && stringIndex < 6) {
                    variation.frets[stringIndex] = 'X';
                    variation.fingering[stringIndex] = 'X';
                    variation.fretFingerData[stringIndex] = 'X';
                    console.log(`        🔇 Muted string ${stringNumber} (index ${stringIndex})`);
                  }
                  return; // Skip other processing for mute lines
                }
                
                // Look for individual finger placement instructions
                // Pattern: "Press down on the B (2nd) string at the 3rd fret using your pinky"
                const fretMatch = line.match(/(\d+)(?:st|nd|rd|th)?\s+fret/);
                const stringMatch = line.match(/([A-G])\s*\((\d+)(?:st|nd|rd|th)?\)/);
                const fingerMatch = line.match(/(?:index|middle|ring|pinky|first|second|third|fourth)(?:\s+finger)?|finger\s+(\d+)|(\d+)(?:st|nd|rd|th)?\s+finger/);

                console.log(`        Fret match: ${fretMatch ? fretMatch[1] : 'NOT FOUND'}`);
                console.log(`        String match: ${stringMatch ? `${stringMatch[1]} (${stringMatch[2]})` : 'NOT FOUND'}`);
                console.log(`        Finger match: ${fingerMatch ? 'FOUND' : 'NOT FOUND'}`);

                if (fretMatch && stringMatch) {
                  const fret = parseInt(fretMatch[1]);
                  const stringName = stringMatch[1];
                  const stringNumber = parseInt(stringMatch[2]);
                  
                  // Update lowest fret (only if fret > 0)
                  if (fret > 0 && fret < lowestFret) {
                    lowestFret = fret;
                  }

                  // Map string name to array index (6th to 1st: E, A, D, G, B, E)
                  const stringIndex = ['E', 'A', 'D', 'G', 'B', 'E'].indexOf(stringName);
                  
                  if (stringIndex !== -1) {
                    // Set fret number
                    variation.frets[stringIndex] = fret.toString();
                    
                    // Extract finger number
                    let fingerNumber = '0';
                    if (fingerMatch) {
                      if (fingerMatch[1]) {
                        fingerNumber = fingerMatch[1];
                      } else if (fingerMatch[2]) {
                        fingerNumber = fingerMatch[2];
                      } else {
                        // Map finger names to numbers
                        const fingerText = line.toLowerCase();
                        if (fingerText.includes('index') || fingerText.includes('first')) fingerNumber = '1';
                        else if (fingerText.includes('middle') || fingerText.includes('second')) fingerNumber = '2';
                        else if (fingerText.includes('ring') || fingerText.includes('third')) fingerNumber = '3';
                        else if (fingerText.includes('pinky') || fingerText.includes('fourth')) fingerNumber = '4';
                      }
                    }
                    
                    // Set fingering array (just the finger numbers)
                    variation.fingering[stringIndex] = fingerNumber;
                    
                    // Set fret_finger_data array (fret-finger format)
                    variation.fretFingerData[stringIndex] = `${fret}-${fingerNumber}`;
                    
                    console.log(`        ✅ Mapped: ${stringName}(${stringNumber}) -> frets[${stringIndex}] = ${fret}, fingering[${stringIndex}] = ${fingerNumber}`);
                  }
                }

                // Check for barre technique
                if (line.toLowerCase().includes('barre')) {
                  hasBarre = true;
                  variation.barre = true;
                }
              });

              // Debug logging for fret parsing
              console.log(`    🔍 Parsed frets: [${variation.frets.join(', ')}]`);
              console.log(`    🔍 Lowest fret: ${lowestFret}`);

              // Determine position type
              if (hasBarre) {
                variation.positionType = 'barre_chords';
              } else if (lowestFret >= 3) {
                variation.positionType = 'complex_chords';
              } else {
                variation.positionType = 'open_chords';
              }

              // Set fret position
              variation.fretPosition = lowestFret === 999 ? 'pos1' : `pos${lowestFret}`;

              variations.push(variation);
            }
          } catch (error) {
            console.warn(`⚠️ Error parsing variation ${index + 1}:`, error.message);
          }
        });

        return variations;
      });

      console.log(`  📊 Found ${positions.length} chord positions`);
      return positions;
    } catch (error) {
      console.error('❌ Failed to extract chord positions:', error);
      throw error;
    }
  }

  /**
   * Create chord variation in database
   */
  async createChordVariation(chordVariation) {
    try {
      // Check if chord variation already exists
      const { data: existing, error: checkError } = await supabase
        .from('chord_variations')
        .select('id')
        .eq('chord_name', chordVariation.chord_name)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existing) {
        console.log(`  ✅ Chord variation already exists: ${chordVariation.chord_name}`);
        return existing.id;
      }

      // Create new chord variation
      const { data: newVariation, error: createError } = await supabase
        .from('chord_variations')
        .insert([{
          chord_name: chordVariation.chord_name,
          display_name: chordVariation.display_name,
          root_note: chordVariation.root_note,
          chord_type: chordVariation.chord_type,
          difficulty: 'intermediate', // Default
          category: 'barre_chords', // Default
          total_variations: 1
        }])
        .select()
        .single();

      if (createError) throw createError;

      console.log(`  ✅ Created chord variation: ${chordVariation.chord_name}`);
      this.stats.chordVariationsCreated++;
      return newVariation.id;
    } catch (error) {
      console.error(`❌ Failed to create chord variation ${chordVariation.chord_name}:`, error);
      throw error;
    }
  }

  /**
   * Create chord position in database
   */
  async createChordPosition(chordPosition, chordVariationId) {
    try {
      // Check if chord position already exists
      const { data: existing, error: checkError } = await supabase
        .from('chord_positions')
        .select('id')
        .eq('chord_variation_id', chordVariationId)
        .eq('fret_position', chordPosition.fretPosition)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existing) {
        console.log(`    ✅ Chord position already exists: ${chordPosition.fretPosition}`);
        return existing.id;
      }

      // Create new chord position
      const { data: newPosition, error: createError } = await supabase
        .from('chord_positions')
        .insert([{
          chord_variation_id: chordVariationId,
          chord_name: chordPosition.chord_name || '',
          fret_position: chordPosition.fretPosition,
          chord_position_full_name: `${chordPosition.chord_name || 'Unknown'}-${chordPosition.fretPosition}`,
          position_type: chordPosition.positionType,
          strings: chordPosition.strings,
          frets: chordPosition.frets,
          fingering: chordPosition.fingering,
          fret_finger_data: chordPosition.fretFingerData, // Store in dedicated column
          barre: chordPosition.barre,
          barre_fret: null, // Ignored as requested
          metadata: {
            source: 'all-guitar-chords.com',
            source_url: chordPosition.sourceUrl, // Add the full URL
            variation_number: chordPosition.variationNumber,
            instructions: chordPosition.instructions
          }
        }])
        .select()
        .single();

      if (createError) throw createError;

      console.log(`    ✅ Created chord position: ${chordPosition.fretPosition}`);
      this.stats.chordPositionsCreated++;
      return newPosition.id;
    } catch (error) {
      console.error(`❌ Failed to create chord position ${chordPosition.fretPosition}:`, error);
      throw error;
    }
  }

  /**
   * Process a single chord
   */
  async processChord(chordLink) {
    try {
      // Skip if already processed
      if (this.scrapedChords.has(chordLink.text)) {
        console.log(`⏭️ Skipping already processed chord: ${chordLink.text}`);
        return;
      }

      // Scrape chord page
      const chordData = await this.scrapeChordPage(chordLink);
      if (!chordData) {
        this.stats.skipped++;
        return;
      }

      // Create chord variation
      const chordVariationId = await this.createChordVariation(chordData.chordVariation);

      // Create chord positions
      for (const position of chordData.chordPositions) {
        position.chord_name = chordData.chordVariation.chord_name;
        position.sourceUrl = chordLink.fullUrl; // Add the source URL
        await this.createChordPosition(position, chordVariationId);
      }

      // Mark as processed
      this.scrapedChords.add(chordLink.text);
      
      // Rate limiting
      await this.delay();
      
    } catch (error) {
      console.error(`❌ Failed to process chord ${chordLink.text}:`, error);
      this.errors.push({ chord: chordLink.text, error: error.message });
      this.stats.errors++;
    }
  }

  /**
   * Main scraping process
   */
  async scrapeAllChords() {
    try {
      console.log('🎸 Starting All-Guitar-Chords scraping process...');
      
      // Initialize browser
      await this.init();

      // Scrape main index page
      const chordLinks = await this.scrapeMainIndex();
      
      console.log(`📋 Processing ${chordLinks.length} chord links...`);
      
      // Process each chord (LIMITED TO 5 FOR TESTING)
      const maxChords = Math.min(5, chordLinks.length);
      console.log(`🧪 TESTING MODE: Processing only ${maxChords} chords`);
      
      for (let i = 0; i < maxChords; i++) {
        const chordLink = chordLinks[i];
        console.log(`\n[${i + 1}/${maxChords}] Processing: ${chordLink.text}`);
        
        try {
          await this.processChord(chordLink);
        } catch (error) {
          console.error(`❌ Error processing chord ${chordLink.text}:`, error);
          this.stats.errors++;
        }
      }

      // Print final statistics
      console.log('\n📊 Scraping Complete!');
      console.log(`✅ Chord variations created: ${this.stats.chordVariationsCreated}`);
      console.log(`✅ Chord positions created: ${this.stats.chordPositionsCreated}`);
      console.log(`❌ Errors: ${this.stats.errors}`);
      console.log(`⏭️ Skipped: ${this.stats.skipped}`);

      if (this.errors.length > 0) {
        console.log('\n❌ Errors encountered:');
        this.errors.forEach(error => {
          console.log(`  - ${error.chord}: ${error.error}`);
        });
      }

    } catch (error) {
      console.error('❌ Scraping process failed:', error);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// Export for use in other modules
export default AllGuitarChordsScraper;

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const scraper = new AllGuitarChordsScraper();
  scraper.scrapeAllChords()
    .then(() => {
      console.log('🎉 Scraping completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Scraping failed:', error);
      process.exit(1);
    });
}
