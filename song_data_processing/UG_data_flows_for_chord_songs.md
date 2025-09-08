# Ultimate Guitar Data Flows for Chord Songs
## Comprehensive Documentation of Processing Pipelines

**Document Version:** 1.0  
**Date:** September 1, 2025  
**Scope:** Chord-type song processing from Ultimate Guitar  

---

## 🎯 Overview

This document details three distinct data flows for processing Ultimate Guitar chord songs:

1. **HTML Tab Discovery Flow** - Extracts song metadata from saved Ultimate Guitar HTML pages and populates the database
2. **HTML Tab ID Flow** - Processes songs from URLs with tab IDs
3. **Parent Script DB Query Flow** - Processes songs already stored in database with tab IDs (depends on Flow 1)

The HTML Tab Discovery Flow feeds into the Parent Script DB Query Flow, while the HTML Tab ID Flow operates independently. All flows eventually merge to use the same core processing modules for data transformation, scoring, and storage.

---

## 📊 Data Flow 1: HTML Tab Discovery Processing

### **Entry Point:** `bulk_ug_songs_importer.js`

#### **Step 1: HTML File Discovery**
**File:** `bulk_ug_songs_importer.js`  
**Function:** `getHTMLFiles()`  
**Dependencies:** `fs`, `path`

**Process:**
1. Scans `./ug_html_pages/` directory for HTML files
2. Filters for files ending in `.html`
3. Returns array of HTML file paths
4. Currently processes files like:
   - `Explore chords and tabs @ Ultimate-Guitar.ComTOP.html`
   - `Explore chords and tabs @ Ultimate-Guitar.ComTOP2.html`

**Output:** `["./ug_html_pages/file1.html", "./ug_html_pages/file2.html"]`

#### **Step 2: HTML Content Extraction**
**File:** `bulk_ug_songs_importer.js`  
**Function:** `extractSongsFromHTML(htmlFilePath)`  
**Dependencies:** `fs`

**Process:**
1. Reads HTML file content from disk
2. Finds `<div id="js-store">` containing JSON data
3. Extracts embedded song objects with structure:
   ```javascript
   {
     tab_id: "225441",
     artist_name: "Metallica", 
     song_name: "Nothing Else Matters",
     tab_url: "https://tabs.ultimate-guitar.com/tab/metallica/nothing-else-matters-guitar-pro-225441",
     type: "Pro",
     difficulty: "Intermediate",
     rating: 4.5,
     votes: 1234,
     tonality: "Em"
   }
   ```
4. Parses JSON data and extracts ~50 songs per HTML file

**Output:** Array of song objects with basic metadata

#### **Step 3: Data Transformation for Database**
**File:** `bulk_ug_songs_importer.js`  
**Function:** `extractSongsFromHTML(htmlFilePath)`  
**Dependencies:** None

**Process:**
1. Maps extracted Ultimate Guitar data to Supabase schema:
   ```javascript
   {
     ug_tab_id: song.tab_id,
     title: song.song_name,
     artist: song.artist_name,
     tab_url: song.tab_url,
     type: song.type,
     difficulty: song.difficulty,
     rating: song.rating,
     votes: song.votes,
     tonality: song.tonality
   }
   ```
2. Ensures data types match database requirements
3. Handles missing or invalid fields

**Output:** Database-ready song objects

#### **Step 4: Database Population**
**File:** `bulk_ug_songs_importer.js`  
**Function:** `insertSongsToSupabase(songs)`  
**Dependencies:** `@supabase/supabase-js`

**Process:**
1. Connects to Supabase using service role key
2. Inserts songs one by one with 50ms delay (rate limiting)
3. Relies on `ug_tab_id` uniqueness constraint for duplicate prevention
4. Returns success/failure status for each song
5. Handles network errors and database constraints
6. Creates basic song records with minimal data (no rich content)

**Output:** `{ success: true, inserted: 45, errors: [], skipped: 5 }`

#### **Step 5: Pending Song Management**
**File:** `bulk_ug_songs_importer.js`  
**Function:** `savePendingSongs(songs)`  
**Dependencies:** `fs`

**Process:**
1. Tracks songs that failed to insert due to network/database errors
2. Saves failed songs to `pending_extraction.md`
3. Implements retry logic with maximum retry counts
4. Provides mechanism for batch reprocessing of failed songs

**Output:** Markdown file with pending songs for retry

---

## 📊 Data Flow 2: HTML Tab ID Processing

### **Entry Point:** `url_tab_id_processor.js`

#### **Step 1: URL Input & Tab ID Extraction**
**File:** `url_tab_id_processor.js`  
**Function:** `processUrl()`  
**Dependencies:** `shared/urlParser.js`

**Process:**
1. Receives Ultimate Guitar URL (e.g., `https://tabs.ultimate-guitar.com/tab/elvis-presley/cant-help-falling-in-love-chords-1086983`)
2. Calls `extractTabIdAndTypeFromUrl()` from `shared/urlParser.js`
3. Extracts tab ID (1086983) and song type ("chords")
4. Validates URL format and tab ID

**Output:** `{ tabId: 1086983, songType: "chords" }`

#### **Step 2: Database Lookup**
**File:** `url_tab_id_processor.js`  
**Function:** `processUrl()`  
**Dependencies:** `songDatabaseUG.js`

**Process:**
1. Calls `getSongByUGTabId(tabId)` from `songDatabaseUG.js`
2. Checks if song already exists in database
3. If exists: proceeds to update flow
4. If not exists: proceeds to create flow

**Output:** Existing song record or null

#### **Step 3A: Basic Song Record Creation (New Songs)**
**File:** `url_tab_id_processor.js`  
**Function:** `processUrl()`  
**Dependencies:** `songDatabaseUG.js`

**Process:**
1. Calls `createBasicSongRecord()` from `songDatabaseUG.js`
2. Creates minimal song record with:
   - `title`: "Cant Help Falling In Love Chords"
   - `artist`: "Elvis Presley"
   - `ug_tab_id`: 1086983
   - `ug_url`: "https://tabs.ultimate-guitar.com/tab/1086983"
   - `instrument_type`: "guitar"
   - `tuning`: "E A D G B E"
   - `tabbed_by`: "Unknown"
3. Stores in `songs` table
4. Returns song ID for next steps

**Output:** `{ success: true, songId: "uuid" }`

#### **Step 4: Ultimate Guitar Data Fetching**
**File:** `url_tab_id_processor.js`  
**Function:** `processUrl()`  
**Dependencies:** `ugScraperIntegration.js`

**Process:**
1. Calls `fetchSongDataUG(tabId)` from `ugScraperIntegration.js`
2. Executes Go scraper binary: `ultimate-guitar-scraper export -id 1086983`
3. Receives HTML output from Ultimate Guitar
4. Parses HTML structure for song data
5. Extracts sections, chord progressions, and metadata

**Output:** Raw UG data structure

#### **Step 5: Data Transformation**
**File:** `url_tab_id_processor.js`  
**Function:** `processUrl()`  
**Dependencies:** `songDataServiceUG.js`

**Process:**
1. Calls `transformUGDataToSongFormat()` from `songDataServiceUG.js`
2. Transforms raw HTML into structured song object:
   - Extracts song sections (Intro, Verse, Chorus, etc.)
   - Extracts chord progressions with timing
   - Extracts chord definitions with fingerings
   - Extracts metadata (album, year, genre, etc.)
3. Creates standardized song data structure

**Output:** Structured song data object

#### **Step 6: Data Completeness Scoring**
**File:** `url_tab_id_processor.js`  
**Function:** `processUrl()`  
**Dependencies:** `shared/dataCompletenessScorer.js`, `shared/booleanFlagCalculator.js`

**Process:**
1. Calls `calculateDataCompletenessScore()` from `shared/dataCompletenessScorer.js`
2. Calculates 0-1 completeness score based on:
   - Basic song info (title, artist, etc.)
   - Sections data (lyrics, timing)
   - Chord progressions (timing, definitions)
   - Timing data quality
3. Calls `calculateContentAvailabilityFlags()` from `shared/booleanFlagCalculator.js`
4. Sets boolean flags:
   - `has_lyric_captions`: true/false
   - `has_chord_captions`: true/false
   - `has_tab_captions`: true/false
5. Calls `calculateTimingAssistanceFlags()` from `shared/booleanFlagCalculator.js`
6. Sets timing assistance flags:
   - `lyrics_need_timing`: true/false
   - `chords_need_timing`: true/false
   - `tabs_need_timing`: true/false
7. Applies admin cascade logic for `needs_user_assistance`

**Output:** `{ data_completeness_score: 0.68, boolean_flags: {...} }`

#### **Step 7: Database Update**
**File:** `url_tab_id_processor.js`  
**Function:** `processUrl()`  
**Dependencies:** `songDatabaseUG.js`

**Process:**
1. Calls `updateExistingSong()` from `songDatabaseUG.js`
2. Updates existing song record with complete data
3. Stores sections in `song_sections` table
4. Stores chord progressions in `song_chord_progressions` table
5. Stores chord definitions in `song_chord_definitions` table
6. Updates boolean flags and completeness score
7. Applies admin cascade logic

**Output:** `{ success: true, songId: "uuid" }`

---

## 📊 Data Flow 3: Parent Script DB Query Processing

### **Entry Point:** `parent_script.js`

> **Note:** This flow processes songs that were initially populated by Data Flow 1 (HTML Tab Discovery). It queries songs with `ug_tab_id` but lacking rich content data.

#### **Step 1: Database Query for Stored Tab IDs**
**File:** `parent_script.js`  
**Function:** `queryStoredTabIds()`  
**Dependencies:** `@supabase/supabase-js`

**Process:**
1. Queries `songs` table for records with `ug_tab_id IS NOT NULL`
2. Filters for songs that need processing
3. Orders by title for consistent processing
4. Returns array of song records

**Output:** `[{ id, title, artist, ug_tab_id }, ...]`

#### **Step 2: Song Processing Loop**
**File:** `parent_script.js`  
**Function:** `processTabIdsBatch()`  
**Dependencies:** `songDatabaseUG.js`

**Process:**
1. Iterates through songs in batches (5 songs per batch)
2. For each song, calls `getSongByUGTabId(ug_tab_id)` from `songDatabaseUG.js`
3. Checks if song already has complete data
4. If complete: skips to next song
5. If incomplete: proceeds to data fetching

**Output:** List of songs needing processing

#### **Step 3: Ultimate Guitar Data Fetching**
**File:** `parent_script.js`  
**Function:** `processTabIdsBatch()`  
**Dependencies:** `songDataServiceUG.js`

**Process:**
1. Calls `getSongDataUG(tabId)` from `songDataServiceUG.js`
2. This internally calls `ugScraperIntegration.js` for Go scraper execution
3. Executes: `ultimate-guitar-scraper export -id 1086983`
4. Receives and parses HTML output
5. Returns structured song data

**Output:** Structured song data object

#### **Step 4: Complete Song Creation**
**File:** `parent_script.js`  
**Function:** `processTabIdsBatch()`  
**Dependencies:** `songDatabaseUG.js`

**Process:**
1. Calls `createCompleteSong(songData)` from `songDatabaseUG.js`
2. This function internally handles:
   - Data completeness scoring (via `shared/dataCompletenessScorer.js`)
   - Boolean flag calculation (via `shared/booleanFlagCalculator.js`)
   - Database storage across multiple tables
3. Creates new complete song record
4. Stores all related data (sections, chord progressions, etc.)

**Output:** `{ success: true, songId: "uuid" }`

---

## 🔄 Shared Processing Modules

### **Core Data Processing Files (Used by Both Flows)**

#### **1. `songDataServiceUG.js`**
**Purpose:** Ultimate Guitar data fetching and transformation  
**Used by:** Both flows  
**Key Functions:**
- `getSongDataUG(tabId)` - Main entry point for UG data fetching
- `transformUGDataToSongFormat(rawData)` - Transforms HTML to structured data
- `extractSongSections(ugData)` - Extracts song sections from UG data
- `extractChordProgressions(ugData)` - Extracts chord progressions from UG data

**Dependencies:**
- `ugScraperIntegration.js` - For Go scraper execution

#### **2. `ugScraperIntegration.js`**
**Purpose:** Go scraper execution and output parsing  
**Used by:** Both flows (via `songDataServiceUG.js`)  
**Key Functions:**
- `fetchSongDataUG(tabId)` - Executes Go scraper and parses output
- `parseUGScraperOutput(output)` - Parses HTML output from Go scraper
- `extractRichSongData(htmlContent)` - Extracts structured data from HTML

**Dependencies:**
- Go scraper binary: `ultimate-guitar-scraper`
- `child_process` - For subprocess execution

#### **3. `songDatabaseUG.js`**
**Purpose:** Database operations for song storage and retrieval  
**Used by:** Both flows  
**Key Functions:**
- `createBasicSongRecord(songData)` - Creates minimal song record
- `updateExistingSong(songData)` - Updates existing song with complete data
- `createCompleteSong(songData)` - Creates new complete song record
- `getSongByUGTabId(tabId)` - Retrieves song by UG tab ID
- `getSongWithStructure(songId)` - Retrieves song with all related data

**Dependencies:**
- `@supabase/supabase-js` - Database client
- `shared/dataCompletenessScorer.js` - For scoring calculations
- `shared/booleanFlagCalculator.js` - For boolean flag calculations

### **Shared Scoring and Flag Calculation Files**

#### **4. `shared/dataCompletenessScorer.js`**
**Purpose:** Calculates data completeness scores and main boolean flags  
**Used by:** Both flows (via `songDatabaseUG.js`)  
**Key Functions:**
- `calculateDataCompletenessScore(songData)` - Calculates 0-1 completeness score
- Implements admin cascade logic for `needs_user_assistance`
- Calculates `is_ui_ready` flag

**Scoring Logic:**
- Basic info (title, artist): 0.2 points
- Sections data: 0.3 points
- Chord progressions: 0.3 points
- Timing data: 0.2 points

#### **5. `shared/booleanFlagCalculator.js`**
**Purpose:** Calculates content availability and timing assistance flags  
**Used by:** Both flows (via `songDatabaseUG.js`)  
**Key Functions:**
- `calculateContentAvailabilityFlags(songData)` - Sets has_*_captions flags
- `calculateTimingAssistanceFlags(songData)` - Sets *_need_timing flags

**Flag Logic:**
- `has_lyric_captions`: true if sections contain lyrics
- `has_chord_captions`: true if chord progressions exist
- `has_tab_captions`: true if sections or chord progressions exist
- `*_need_timing`: true if content exists but lacks real timing (not 0:00)

#### **6. `shared/urlParser.js`**
**Purpose:** URL parsing and tab ID extraction  
**Used by:** HTML Tab ID flow only  
**Key Functions:**
- `extractTabIdAndTypeFromUrl(url)` - Extracts tab ID and song type from URL
- `extractTabIdFromUrl(url)` - Extracts just tab ID from URL

**Parsing Logic:**
- Supports multiple URL formats
- Extracts song types: chords, tabs, guitar-pro, bass, ukulele, piano
- Validates tab ID format

---

## 🔄 Flow Convergence Points

### **Flow Dependencies and Relationships**

#### **Primary Data Source Flow**
**HTML Tab Discovery Flow (1)** feeds into **Parent Script DB Query Flow (3)**:
```
ug_html_pages/ → bulk_ug_songs_importer.js → Supabase songs table (basic records)
                                                    ↓
                                              parent_script.js (queries for processing)
```

#### **Independent Processing Flow**
**HTML Tab ID Flow (2)** operates independently for direct URL processing:
```
Ultimate Guitar URL → url_tab_id_processor.js → Complete song processing
```

### **Convergence Point 1: Ultimate Guitar Data Fetching**
Flows 2 and 3 converge at the UG data fetching step:
- **HTML Tab ID Flow (2):** `url_tab_id_processor.js` → `ugScraperIntegration.js`
- **Parent Script Flow (3):** `parent_script.js` → `songDataServiceUG.js` → `ugScraperIntegration.js`

**Shared Process:**
1. Execute Go scraper: `ultimate-guitar-scraper export -id {tabId}`
2. Parse HTML output
3. Extract structured song data
4. Return standardized song object

### **Convergence Point 2: Data Scoring and Flag Calculation**
Flows 2 and 3 use identical scoring logic:
- **HTML Tab ID Flow (2):** `url_tab_id_processor.js` → `shared/dataCompletenessScorer.js`
- **Parent Script Flow (3):** `parent_script.js` → `songDatabaseUG.js` → `shared/dataCompletenessScorer.js`

**Shared Process:**
1. Calculate data completeness score (0-1)
2. Calculate content availability flags
3. Calculate timing assistance flags
4. Apply admin cascade logic for `needs_user_assistance`

### **Convergence Point 3: Database Storage**
Flows 2 and 3 use identical database storage logic:
- **HTML Tab ID Flow (2):** `url_tab_id_processor.js` → `songDatabaseUG.js`
- **Parent Script Flow (3):** `parent_script.js` → `songDatabaseUG.js`

**Shared Process:**
1. Store song record in `songs` table
2. Store sections in `song_sections` table
3. Store chord progressions in `song_chord_progressions` table
4. Store chord definitions in `song_chord_definitions` table
5. Update boolean flags and completeness scores

---

## 📋 File Dependency Matrix

| File | Discovery Flow (1) | HTML Flow (2) | Parent Flow (3) | Purpose |
|------|-------------------|---------------|----------------|---------|
| `bulk_ug_songs_importer.js` | ✅ Entry | ❌ | ❌ | HTML extraction & database population |
| `url_tab_id_processor.js` | ❌ | ✅ Entry | ❌ | URL processing entry point |
| `parent_script.js` | ❌ | ❌ | ✅ Entry | Database query entry point |
| `shared/urlParser.js` | ❌ | ✅ | ❌ | URL parsing |
| `songDataServiceUG.js` | ❌ | ✅ | ✅ | UG data fetching & transformation |
| `ugScraperIntegration.js` | ❌ | ✅ | ✅ | Go scraper execution |
| `songDatabaseUG.js` | ✅ | ✅ | ✅ | Database operations |
| `shared/dataCompletenessScorer.js` | ❌ | ✅ | ✅ | Data completeness scoring |
| `shared/booleanFlagCalculator.js` | ❌ | ✅ | ✅ | Boolean flag calculation |

| `ug_html_pages/` (directory) | ✅ Data Source | ❌ | ❌ | Source HTML files with song metadata |

---

## 🎯 Key Differences Between Flows

### **HTML Tab Discovery Flow (1)**
- **Input:** HTML files from `ug_html_pages/` directory
- **Database Operation:** Creates basic song records with metadata only
- **Use Case:** Initial song discovery and database population
- **Unique Steps:** HTML parsing, JSON extraction, bulk database insertion
- **Output:** Songs with `ug_tab_id` but no rich content

### **HTML Tab ID Flow (2)**
- **Input:** Ultimate Guitar URL
- **Database Operation:** Updates existing basic song record OR creates new complete record
- **Use Case:** Processing individual songs from URLs
- **Unique Steps:** URL parsing, basic record creation/update

### **Parent Script DB Query Flow (3)**
- **Input:** Database query for stored tab IDs (from Flow 1)
- **Database Operation:** Updates existing basic song records with rich content
- **Use Case:** Batch processing songs already in database with basic metadata
- **Unique Steps:** Database querying, batch processing of existing records

---

## 🔧 Configuration and Environment

### **Required Environment Variables**
Both flows require:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### **Required External Dependencies**
Both flows require:
- Go scraper binary: `ultimate-guitar-scraper`
- Node.js with ES modules support
- Supabase database with enhanced schema

### **Database Schema Requirements**
Both flows require:
- `songs` table with enhanced schema
- `song_sections` table
- `song_chord_progressions` table
- `song_chord_definitions` table
- `song_attributes` table

---

## 🚀 Performance Considerations

### **HTML Tab ID Flow**
- **Processing Speed:** Single song processing
- **Rate Limiting:** Built-in delays between requests
- **Error Handling:** Individual song error handling
- **Memory Usage:** Low (single song at a time)

### **Parent Script DB Query Flow**
- **Processing Speed:** Batch processing (5 songs per batch)
- **Rate Limiting:** Delays between batches and songs
- **Error Handling:** Batch error handling with retry logic
- **Memory Usage:** Moderate (batch of songs in memory)

---

## 🔍 Testing and Validation

### **Test Files**
- `test_single_song.js` - Tests single song processing (Parent flow logic)
- `test_song_data_service.js` - Tests UG data service
- `test_database_integration.js` - Tests database operations

### **Validation Points**
1. **URL Parsing:** Validates tab ID extraction
2. **Data Fetching:** Validates UG scraper output
3. **Data Transformation:** Validates structured data creation
4. **Scoring:** Validates completeness score calculation
5. **Storage:** Validates database record creation/update

---

## 📝 Conclusion

All three data flows are designed to process Ultimate Guitar chord songs efficiently while sharing common processing logic. The HTML Tab Discovery flow provides the foundation by populating the database with basic song metadata. The HTML Tab ID flow is optimized for processing individual songs from URLs, while the Parent Script DB Query flow is optimized for batch processing of songs already stored in the database with basic metadata.

The convergence points ensure consistent data quality and processing standards across both flows, while the modular design allows for easy maintenance and extension of the processing pipeline.

**Key Benefits:**
- **Comprehensive Song Discovery:** HTML Tab Discovery flow ensures broad song coverage from UG explore pages
- **Flexible Processing Options:** Multiple entry points for different use cases (bulk discovery, individual URLs, batch processing)
- **Consistent Data Processing:** Shared scoring and validation logic across flows 2 and 3
- **Modular Design:** Easy maintenance and extension of the processing pipeline
- **Comprehensive Error Handling:** Retry mechanisms and pending song management
- **Scalable Batch Processing:** Efficient processing of large song collections
- **Data Flow Separation:** Clear separation between discovery (Flow 1) and rich content processing (Flows 2 & 3)
