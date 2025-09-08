# 🎸 Song Data Processing Pipeline

This directory contains the complete Ultimate Guitar (UG) data processing pipeline that transforms raw UG tab data into structured, database-ready song information.

## 🏗️ Architecture Overview

The pipeline consists of three main phases:

1. **HTML Extraction** → `song_tab_id_extraction_from_HTML_Pages/` (completed, now integrated)
2. **Tab ID Processing** → This directory (current phase)
3. **API Integration** → Future phase

## 📁 File Structure

```
song_data_processing/
├── README.md                           # This documentation
├── parent_script.js                    # Main orchestration script
├── bulk_ug_songs_importer.js          # HTML extraction and Tab ID import script
├── songDataServiceUG.js               # Core data transformation service
├── songDatabaseUG.js                  # Database operations layer
├── ugScraperIntegration.js            # Go tool integration
├── chord_processing/                  # Dedicated chord processing system
│   ├── chordData.js                   # Music theory chord generation
│   ├── chordCaptionUtils.js           # Chord caption utilities
│   ├── chordDataServiceUG.js          # Chord data service
│   ├── ChordCaptionDatabase.js        # Chord database operations
│   ├── chordRenderer.js               # Chord SVG rendering
│   ├── chordFretPositioning.js       # Chord positioning logic
│   ├── generateChordFingering.js      # Chord fingering generation
│   ├── generateChordLibrary.js        # Chord library generation
│   ├── test_chord_renderer.html       # Chord renderer testing
│   └── chord_caption_plan.md          # Chord caption planning
├── chordDataMapperUG.js               # Chord data mapping utility
├── ug_html_pages/                     # HTML source files
├── song_tab_id_extraction_from_HTML_Pages/  # HTML extraction utilities
│   ├── ugExplorePageScanner.js        # HTML parsing utility
│   ├── check_constraints.js           # Database constraint utilities
│   ├── remove_unique_constraint.js    # Constraint removal utility
│   ├── check_existing_songs.js        # Song verification utility
│   ├── ug_songs_extracted.json       # Sample extracted data
│   ├── pending_extraction.md          # Failed extraction tracking
│   ├── unprocessed.md                 # Unprocessed songs tracking
│   └── README.md                      # HTML extraction documentation
├── test_database_integration.js       # Database integration tests
├── test_chord_storage.js              # Chord storage tests
├── test_song_data_service.js          # Service functionality tests
└── test_ug_integration.js             # Integration tests
```
1. -- Core song data
songs: id, title, artist, ug_tab_id, instrument_type, tuning, etc.

-- Song structure
song_sections: section_name, section_type, start_time, end_time, repeat_count, performance_notes

-- Chord data
song_chord_progressions: chord_name, start_time, end_time, sequence_order, chord_data

-- Rich metadata
song_attributes: contains_lyrics, contains_chords, contains_chord_progressions, data_completeness_score

-- Quality scoring
songs: data_completeness_score, tab_quality_score, complexity_score



## 🔧 Core Components

### `songDataServiceUG.js`
- **Purpose**: Transforms raw UG data into structured song objects
- **Key Functions**:
  - `getSongDataUG(tabId)` - Main entry point for data requests
  - `transformUGDataToSongData()` - Converts raw UG output to structured format
  - `extractSongSections()` - Parses song sections with timing
  - `extractChordProgressions()` - Extracts chord changes and progressions
- **Output**: Structured song data ready for database storage

### `songDatabaseUG.js`
- **Purpose**: Handles all database operations for song storage and retrieval
- **Key Functions**:
  - `createCompleteSong()` - Stores complete song with sections and chords
  - `getSongWithStructure()` - Retrieves song with full structure
  - `searchSongs()` - Searches by various criteria
  - `getSongByUGTabId()` - Looks up songs by UG tab ID
- **Database Tables**: `songs`, `song_attributes`, `song_sections`, `song_chord_progressions`

### `ugScraperIntegration.js`
- **Purpose**: Integrates with the Go-based UG web scraper
- **Key Functions**:
  - `callUGScraper(tabId)` - Fetches detailed song data using tab ID
  - `searchSongs(query)` - Searches UG for songs
  - `executeScraper()` - Manages subprocess execution
- **Dependencies**: Go executable `ultimate-guitar-scraper`

### `bulk_ug_songs_importer.js`
- **Purpose**: Extracts Tab IDs from HTML files and imports basic song data to Supabase
- **Key Functions**:
  - `getHTMLFiles()` - Scans `ug_html_pages/` directory for HTML files
  - `extractSongsFromHTML()` - Parses HTML and extracts song metadata
  - `insertSongsToSupabase()` - Stores basic song data in database
- **Input**: HTML files from Ultimate Guitar explore pages
- **Output**: Basic song records with `ug_tab_id` in Supabase

## 🧪 Test Files

### `test_database_integration.js`
- **Purpose**: Comprehensive testing of the complete database pipeline
- **Tests**: Create, retrieve, search, and lookup operations
- **Status**: Ready for testing with real UG tab IDs

### `test_chord_storage.js`
- **Purpose**: Verifies chord progression storage functionality
- **Tests**: Chord data insertion and retrieval
- **Status**: Ready for testing

### `test_song_data_service.js`
- **Purpose**: Tests the UG data transformation service
- **Tests**: Data fetching and transformation
- **Status**: Ready for testing

### `test_ug_integration.js`
- **Purpose**: Tests Go tool integration
- **Tests**: Subprocess execution and data parsing
- **Status**: Ready for testing

## 🚀 Pipeline Flow

```
1. HTML Files → Extract Tab IDs → Store in Supabase
   ↓
2. Query Supabase → Get stored Tab IDs
   ↓
3. For each Tab ID → Call Go tool → Fetch rich UG data
   ↓
4. Transform data → Create structured song objects
   ↓
5. Store in database → Sections + Chords + Metadata
```

## 🔄 Current Status

- ✅ **HTML Extraction Phase**: Complete
- ✅ **Core Utilities**: All moved and import paths fixed
- ✅ **Test Infrastructure**: All test files ready
- 🔄 **Tab ID Processing Pipeline**: Ready for implementation
- ⏳ **Parent Script**: To be created
- ⏳ **End-to-End Testing**: Pending

## 🎯 Next Steps

1. **Create Parent Script**: Main orchestration script that queries Supabase for stored Tab IDs
2. **Test Pipeline**: Run end-to-end tests with real data
3. **Batch Processing**: Process all stored Tab IDs automatically
4. **Error Handling**: Implement robust error handling and retry logic
5. **Progress Tracking**: Add progress monitoring for large batches

## 🛠️ Usage Examples

### Test Individual Components
```bash
# Test database integration
node song_data_processing/test_database_integration.js

# Test chord storage
node song_data_processing/test_chord_storage.js

# Test service functionality
node song_data_processing/test_song_data_service.js
```

### Process Specific Tab ID
```javascript
import { getSongDataUG } from './songDataServiceUG.js'
import { createCompleteSong } from './songDatabaseUG.js'

const songData = await getSongDataUG(12345)
if (songData) {
  const result = await createCompleteSong(songData)
  console.log('Song stored:', result)
}
```

## 🔗 Dependencies

- **Supabase**: Database operations and storage
- **Go Tool**: `ultimate-guitar-scraper` for UG data fetching
- **Environment**: `.env.local` with Supabase credentials
- **Node.js**: ES modules support required

## 📊 Data Flow

```
UG Tab ID → Go Tool → Raw UG Data → Transformation → Structured Song → Database Storage
    ↓              ↓           ↓            ↓              ↓              ↓
  12345    →   Scraper   →   JSON     →   Parser    →   Song Obj   →   Supabase
```

## 🚨 Important Notes

- **Import Paths**: All files use relative imports (`./`) within this directory
- **Environment**: Ensure `.env.local` is accessible from parent directory
- **Go Tool**: Verify `ultimate-guitar-scraper` executable is available
- **Database**: Confirm Supabase schema is properly set up
- **Testing**: Test with small batches before processing all stored Tab IDs

## 📈 Performance Considerations

- **Rate Limiting**: UG scraping includes built-in delays
- **Batch Processing**: Process Tab IDs in manageable chunks
- **Error Handling**: Implement retry logic for failed requests
- **Progress Tracking**: Monitor progress for large datasets
- **Resource Management**: Clean up test data after verification

---

**Last Updated**: August 29, 2024  
**Status**: Ready for Tab ID Processing Pipeline Implementation  
**Next Phase**: Create Parent Script and Test End-to-End Flow
