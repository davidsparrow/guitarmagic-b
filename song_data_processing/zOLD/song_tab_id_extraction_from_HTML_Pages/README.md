# 🎸 Song Tab ID Extraction from HTML Pages

This directory contains the complete working system for extracting Ultimate Guitar song data from HTML files and importing it into Supabase.

## 📁 Directory Structure

```
song_tab_id_extraction_from_HTML_Pages/
├── bulk_ug_songs_importer.js    # Main import script
├── check_constraints.js          # Database constraint checker
├── check_existing_songs.js      # Database query utility
├── remove_unique_constraint.js   # Constraint removal utility
├── ugExplorePageScanner.js      # HTML parsing utility
├── ../song_data_processing/ug_html_pages/  # HTML source files (moved to new location)
├── ug_songs_extracted.json      # Sample extracted data
├── HTML_TO_SUPABASE_SONG_IMPORT_PROCESS.md  # Complete documentation
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites
1. **Supabase credentials** in `.env.local` file (one level up)
2. **Node.js dependencies** installed (`npm install` in parent directory)

### Run Extraction
```bash
# From the parent directory (guitarmagic-a/)
cd song_tab_id_extraction_from_HTML_Pages
node bulk_ug_songs_importer.js
```

### Check Database
```bash
node check_existing_songs.js
```

## 📊 Current Status
- **HTML Files**: 9 files with ~50 songs each
- **Total Songs**: ~450 songs available for extraction
- **Database**: Successfully imported 400+ songs
- **Schema**: Perfect match with Supabase `songs` table

## 🔧 Key Features
- ✅ **HTML Parsing**: Extracts song data from Ultimate Guitar HTML files
- ✅ **Database Integration**: Direct import to Supabase
- ✅ **Duplicate Handling**: Allows multiple tab versions of same song
- ✅ **Error Recovery**: Individual song insertion with graceful failure handling
- ✅ **Progress Tracking**: Real-time import status and results

## 📝 File Descriptions
- **`bulk_ug_songs_importer.js`**: Main orchestrator script
- **`../song_data_processing/ug_html_pages/`**: Contains HTML source files from Ultimate Guitar (moved to new location)
- **`ugExplorePageScanner.js`**: HTML parsing and data extraction logic
- **Utility Scripts**: Database verification and constraint management

## 🔍 Troubleshooting
- **Missing .env.local**: Ensure Supabase credentials are in parent directory
- **Database Connection**: Verify Supabase URL and API key
- **HTML Format**: Files must contain `<div id="js-store">` with JSON data
- **Constraints**: `unique_song_artist` constraint must be removed from database

## 📈 Next Steps
1. Add more HTML files to `../song_data_processing/ug_html_pages/` directory
2. Run extraction script to import new songs
3. Monitor database for successful imports
4. Expand to different Ultimate Guitar page types

---
**Status**: FULLY OPERATIONAL
**Last Updated**: Current session
**Dependencies**: Supabase credentials, Node.js, npm packages
