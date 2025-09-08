Architecture

// Design and Logic for GuitarMagic Webapp //


# 🏗️ System Architecture

## 🎯 Overview
GuitarMagic is a Next.js SaaS application that enhances YouTube viewing with custom controls and chord diagram generation.

## 🔧 Tech Stack
- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Payments**: Stripe
- **External APIs**: YouTube Data API v3, YouTube Player API
- **Chord Data**: Ultimate Guitar Scraper (Go tool)
- **Deployment**: Vercel (Frontend) + Supabase (Backend)

## 🎨 User Experience
- **Mobile**: 3 pages (HOME → SEARCH → DETAIL)
- **Desktop**: 2 pages (HOME + SEARCH+DETAIL combined)
- **Navigation**: Hamburger menu for utilities
- **Focus**: Video-centric, clean interface with chord diagram integration

## 💎 Business Model
- **Free Tier**: Basic flipping, 20 daily searches
- **Premium Tier**: Custom loops, unlimited searches, chord diagrams ($9/mo)
- **Monetization**: Stripe subscriptions with feature gating

## 🎸 Component Architecture

### Chord Caption Modal (`components/ChordCaptionModal.js`)
**Purpose**: Standalone modal for managing chord captions with full snapshot functionality

**Key Features**:
- **Snapshot System**: Creates deep copy of all chord captions when modal opens
- **Cancel Functionality**: Reverts all changes using `originalChordCaptionsSnapshot`
- **State Management**: Comprehensive state reset on cancellation
- **User Experience**: Feature parity with Text Caption Modal
- **Chord Selection**: Root note + modifier selection for chord names

**State Variables**:
- `chords`: Array of current chord captions
- `originalChordCaptionsSnapshot`: Deep copy for revert functionality
- `originalChordSnapshot`: Individual chord snapshot for single edits
- Various UI states for forms and validation

**Key Functions**:
- `handleCancelChordModal()`: Main cancel function that reverts all changes
- `loadChordCaptions()`: Loads chords from database
- `handleEditChord()`: Manages individual chord editing with snapshot
- `handleCancelEditChord()`: Cancels individual chord edits

**Snapshot Implementation**:
- Uses `JSON.parse(JSON.stringify())` for deep copying
- Snapshot created when modal opens and chords are loaded
- Complete state restoration on cancel including all nested objects

### Chord Diagram Manager (`components/ChordDiagramManager.js`)
**Purpose**: Manages chord diagram display and rendering

**Key Features**:
- **SVG Rendering**: Displays chord diagrams with proper string/fret positioning
- **Theme Support**: Light and dark theme variants
- **Dynamic Positioning**: Automatically calculates optimal fret display range
- **Responsive Layout**: Adapts to different screen sizes

## 🎵 Chord System Architecture

### Core Chord Rendering Engine

#### Chord Renderer (`utils/chordRenderer.js`)
**Purpose**: Core SVG generation engine for chord diagrams

**Key Features**:
- **Two.js Integration**: Advanced SVG manipulation and rendering
- **Dynamic Fret Positioning**: Automatically calculates optimal display range
- **Theme Support**: Light and dark theme variants
- **Finger Positioning**: Colored circles with finger numbers
- **String/Fret Labels**: Proper string names and fret numbers

**Data Structure**:
```javascript
{
  name: 'Am',
  type: 'minor',
  root: 'A',
  strings: ['E', 'A', 'D', 'G', 'B', 'E'],
  frets: ['X', '0', '2', '2', '1', '0'],
  fingering: ['X', 'X', '2', '3', '1', 'X'],
  metadata: { difficulty, category, barre, source, popularity }
}
```

#### Chord Fret Positioning (`utils/chordFretPositioning.js`)
**Purpose**: Dynamic fret positioning algorithm

**Key Features**:
- **Optimal Range Calculation**: Determines best fret display range
- **Left-Most Fret Detection**: Finds starting fret for positioning
- **Display Range Optimization**: Shows relevant fret range only
- **Positioning Logic**: Handles open chords, barre chords, and high fret positions

#### Chord Data Generator (`utils/chordData.js`)
**Purpose**: Music theory-based chord data generation

**Key Features**:
- **Music Theory Engine**: Generates chords using proper music theory
- **Fretboard Mapping**: Maps string/fret positions to musical notes
- **Chord Theory**: Defines chord structures (major, minor, 7th, etc.)
- **Ergonomic Fingering**: Assigns optimal finger positions

### Chord Caption Management

#### Chord Caption Utils (`utils/chordCaptionUtils.js`)
**Purpose**: Chord caption validation and management utilities

**Key Features**:
- **Time Validation**: Ensures proper time format and ranges
- **Chord Name Building**: Constructs chord names from root + modifier
- **Database Operations**: Handles chord caption CRUD operations
- **Sync Group Management**: Manages master/child chord relationships

#### Chord Caption Database (`utils/ChordCaptionDatabase.js`)
**Purpose**: Database operations for chord captions

**Key Features**:
- **Supabase Integration**: Direct database operations
- **Chord Caption CRUD**: Create, read, update, delete operations
- **User Association**: Links chords to specific users and videos
- **Sync Group Support**: Manages chord timing synchronization

### AWS Integration

#### AWS Chord Uploader (`scripts/awsChordUploader.js`)
**Purpose**: S3 upload functionality for chord SVG files

**Key Features**:
- **S3 Integration**: Uploads generated SVGs to AWS S3
- **File Organization**: Structured S3 key generation
- **Batch Processing**: Handles multiple chord uploads
- **Error Handling**: Comprehensive error management and retry logic

#### Chord Library Config (`scripts/chordLibraryConfig.js`)
**Purpose**: S3 configuration and chord library settings

**Key Features**:
- **S3 Configuration**: Bucket settings and region configuration
- **Chord Library Settings**: Library structure and naming conventions
- **URL Generation**: Creates public URLs for chord SVGs
- **Environment Management**: Handles different deployment environments

#### Generate Chord Library (`scripts/generateChordLibrary.js`)
**Purpose**: Main chord library generation script

**Key Features**:
- **Batch Processing**: Generates multiple chord variations
- **Theme Support**: Creates light and dark theme variants
- **S3 Upload**: Automatically uploads generated SVGs
- **Library Management**: Organizes chord library structure

## 🚀 Ultimate Guitar Integration (Planned)

### New Integration Layer

#### Chord Data Service (`utils/chordDataService.js`) - **NEW FILE**
**Purpose**: Service layer for Ultimate Guitar chord data

**Key Features**:
- **UG Scraper Integration**: Calls Go tool for real chord data
- **Data Transformation**: Converts UG format to internal format
- **Fallback Logic**: Falls back to hardcoded data if scraper fails
- **Caching**: Implements caching for performance

#### UG Scraper Integration (`utils/ugScraperIntegration.js`) - **NEW FILE**
**Purpose**: Direct integration with Go scraper tool

**Key Features**:
- **Subprocess Management**: Spawns Go tool as Node.js subprocess
- **Command Execution**: Runs UG scraper with proper parameters
- **Output Parsing**: Parses JSON response from Go tool
- **Error Handling**: Comprehensive error management

#### Chord Data Mapper (`utils/chordDataMapper.js`) - **NEW FILE**
**Purpose**: Data format transformation

**Key Features**:
- **UG to Internal Mapping**: Converts UG data format to internal format
- **String/Fret Processing**: Handles 6-string guitar data
- **Finger Assignment**: Maps finger positions correctly
- **Metadata Enrichment**: Adds difficulty, category, and other metadata

#### Chord Lookup API (`pages/api/chord-lookup.js`) - **NEW FILE**
**Purpose**: Next.js API endpoint for chord data lookup

**Key Features**:
- **REST API**: POST endpoint for chord data requests
- **Request Validation**: Validates chord name input
- **UG Scraper Call**: Triggers Ultimate Guitar data fetching
- **Response Formatting**: Returns standardized chord data format

### Integration Flow

```
ChordCaptionModal.js → chordDataService.js → ugScraperIntegration.js → Go Tool → Data Transformation → Return
```

## 📁 File Organization

### Production Files (Current)
```
utils/
├── chordRenderer.js              # Core SVG rendering engine
├── chordFretPositioning.js      # Dynamic fret positioning
├── chordData.js                 # Music theory chord generation
├── chordCaptionUtils.js         # Chord caption management
├── ChordCaptionDatabase.js      # Database operations
└── videoPlayerUtils.js          # Video player utilities

components/
├── ChordCaptionModal.js         # Main chord UI component
├── ChordDiagramManager.js       # Chord display management
└── [other components...]

scripts/
├── awsChordUploader.js          # S3 upload functionality
├── chordLibraryConfig.js        # S3 configuration
└── generateChordLibrary.js      # Main library generation
```

### Archived Files (`docs/zOldFiles/`)
```
docs/zOldFiles/
├── chord-tests/                 # Old test files (16 files)
├── chord-systems/               # Old chord generation systems (2 files)
├── test-results/                # Test SVGs and outputs
├── aws-utilities/               # AWS testing scripts (5 files)
├── caption-backups/             # Old caption system backups (1 file)
└── README.md                    # Comprehensive documentation
```

## 🔄 Data Flow

### Chord Generation Flow
1. **User Input**: Selects root note + modifier in ChordCaptionModal
2. **Chord Name**: System builds chord name (e.g., "Am", "C", "Fmaj7")
3. **Data Lookup**: Calls Ultimate Guitar scraper via integration layer
4. **Data Transformation**: Converts UG format to internal format
5. **SVG Generation**: chordRenderer.js creates SVG with dynamic positioning
6. **Display**: ChordDiagramManager.js displays the rendered chord
7. **Storage**: Saves to database and optionally uploads to S3

### Fallback Flow
1. **Primary**: Ultimate Guitar scraper integration
2. **Fallback**: Hardcoded chord data from chordData.js
3. **Error Handling**: User-friendly error messages and logging

## 🎯 Future Enhancements

### Phase 1: UG Integration (Current Focus)
- [ ] Create chord data service layer
- [ ] Implement UG scraper integration
- [ ] Add data transformation layer
- [ ] Create chord lookup API endpoint
- [ ] Test integration with real UG data

### Phase 2: Advanced Features
- [ ] Chord progression detection
- [ ] Song structure analysis
- [ ] Automatic chord timing
- [ ] Chord difficulty ratings
- [ ] Alternative voicing suggestions

### Phase 3: Performance & Scale
- [ ] Chord data caching
- [ ] Batch processing
- [ ] Rate limiting
- [ ] Error recovery
- [ ] Monitoring and analytics

## 📝 Notes

- **Clean Architecture**: Old test files and duplicate systems moved to `docs/zOldFiles/`
- **Production Ready**: Core system fully functional and optimized
- **UG Integration**: Foundation prepared for Ultimate Guitar scraper integration
- **Scalable Design**: Architecture supports future enhancements and scaling
- **Documentation**: Comprehensive documentation for all components and systems

**Last Updated**: January 2024
**Status**: Production system clean, ready for Ultimate Guitar integration