# 🎯 **DEMAND-DRIVEN SONG DATA STRATEGY**
## **Updated Roadmap for GuitarMagic Auto-Generation System**

---

## **📋 EXECUTIVE SUMMARY**

**REVISED APPROACH**: Instead of randomly scraping thousands of songs hoping users want them, we're building a **demand-driven, user-requested song library** that grows organically based on what our actual users need.

**KEY BENEFITS**:
- ✅ **Quality over Quantity**: Focus on accuracy, not volume
- ✅ **User Satisfaction**: Only generate captions for videos we can do well
- ✅ **Organic Growth**: Library builds based solely on user demand
- ✅ **Resource Efficiency**: No wasted scraping of unwanted songs

---

## **🏗️ ARCHITECTURE OVERVIEW**

### **Data Sources & Storage**
- **Public Data Only**: We scrape websites for public-facing song data only
- **Data Types**: Song titles, artist names, lyrics, chords, tab captions, timeline metadata
- **Storage**: All data stored permanently in Supabase (no public API)
- **No Random Scraping**: We only scrape songs that users specifically request

### **Chord System Architecture**
**Two-Table Design:**
1. **`chord_captions`** (✅ ALREADY BUILT)
   - Placeholder records for organizing schema logically
   - Allows users to select chord names in UI for custom chord captions
   - Links to `chord_sync_groups` for organization

2. **`chord_positions`** (🆕 TO BE BUILT)
   - Actual chord data for rendering (strings, frets, fingering)
   - Final SVG file URLs from AWS S3
   - Multiple position variants per chord (open, barre, different frets)
   - Black/white chord SVG images for light/dark themes

---

## **🚀 AUTO-GENERATION WORKFLOW**

### **User Request Process**
1. **Premium Feature**: Only available to highest-tier paid members
2. **Request Form**: Users submit YouTube video URLs they want auto-generated
3. **Smart Scraping**: We scrape Ultimate Guitar for that specific song
4. **Accuracy Validation**: Compare video length/characteristics with scraped data
5. **Data Linking**: If accurate enough, link caption data to video URL in Supabase
6. **Fallback**: If video differs significantly, notify user and suggest alternatives

### **Accuracy Validation Criteria**
- **Video Length**: Must match song metadata within acceptable tolerance
- **Key Consistency**: Ensure chord progressions match video audio
- **Cover Detection**: Identify if video is original vs. cover version
- **Quality Score**: Rate confidence level of auto-generation accuracy

---

## **📊 NEW DATABASE TABLES**

### **`chord_positions`** - Chord Rendering Data & SVG URLs
```sql
CREATE TABLE chord_positions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    chord_name TEXT NOT NULL, -- e.g., "Am", "C", "F"
    position_type TEXT NOT NULL, -- "open", "barre", "power", "sus2", etc.
    fret_position INTEGER NOT NULL, -- 0 for open, 1-12 for fretted
    strings JSONB NOT NULL, -- ["E", "A", "D", "G", "B", "E"]
    frets JSONB NOT NULL, -- ["X", "0", "2", "2", "1", "0"]
    fingering JSONB NOT NULL, -- ["X", "X", "1", "2", "3", "X"]
    difficulty TEXT, -- "beginner", "intermediate", "advanced"
    aws_svg_url_light TEXT, -- S3 URL for light theme SVG
    aws_svg_url_dark TEXT, -- S3 URL for dark theme SVG
    svg_file_size INTEGER, -- File size in bytes
    metadata JSONB DEFAULT '{}', -- Additional chord info
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **`song_requests`** - User Auto-Generation Requests
```sql
CREATE TABLE song_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    youtube_video_url TEXT NOT NULL,
    youtube_video_id TEXT NOT NULL,
    song_title TEXT,
    artist_name TEXT,
    request_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    accuracy_score DECIMAL(3,2), -- 0.00 to 1.00 confidence rating
    validation_notes TEXT, -- Why accuracy score is what it is
    ultimate_guitar_data JSONB, -- Raw scraped data from UG
    processed_captions JSONB, -- Final processed caption data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **`auto_generated_captions`** - UG-Based Caption Data
```sql
CREATE TABLE auto_generated_captions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    song_request_id UUID REFERENCES song_requests(id) ON DELETE CASCADE,
    youtube_video_id TEXT NOT NULL,
    caption_type TEXT NOT NULL, -- 'chords', 'lyrics', 'tabs'
    start_time TEXT NOT NULL, -- "MM:SS" format
    end_time TEXT NOT NULL, -- "MM:SS" format
    content TEXT NOT NULL, -- Chord name, lyric line, or tab data
    section_type TEXT, -- 'intro', 'verse', 'chorus', 'bridge', 'outro'
    confidence_score DECIMAL(3,2), -- Individual caption accuracy
    metadata JSONB DEFAULT '{}', -- Additional timing or musical info
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## **🎸 IMPLEMENTATION PHASES**

### **Phase 1: Foundation (Weeks 1-2)**
- [ ] Build `chord_positions` table and populate with existing chord data
- [ ] Create AWS S3 integration for SVG storage
- [ ] Build chord position selection UI in existing chord system

### **Phase 2: Auto-Generation Infrastructure (Weeks 3-4)**
- [ ] Create `song_requests` and `auto_generated_captions` tables
- [ ] Build user request form for premium members
- [ ] Implement Ultimate Guitar scraper integration
- [ ] Build accuracy validation system

### **Phase 3: Auto-Generation Features (Weeks 5-6)**
- [ ] Implement smart scraping for user-requested songs
- [ ] Build caption generation from UG data
- [ ] Create accuracy scoring and validation
- [ ] Implement fallback handling for inaccurate matches

### **Phase 4: Integration & Testing (Weeks 7-8)**
- [ ] Integrate auto-generated captions with existing caption system
- [ ] Build user feedback and quality improvement system
- [ ] Comprehensive testing and bug fixes
- [ ] User documentation and onboarding

---

## **🌟 SUCCESS METRICS**

### **Technical Metrics**
- **Accuracy Rate**: 90%+ of auto-generated captions meet quality standards
- **Processing Time**: < 5 minutes from user request to caption generation
- **Fallback Rate**: < 10% of requests require manual intervention

### **User Engagement Metrics**
- **Request Volume**: 50+ song requests per month from premium users
- **Satisfaction Rate**: 4.5+ star rating for auto-generated captions
- **Feature Adoption**: 70% of premium users try auto-generation

### **Business Metrics**
- **Premium Conversion**: 20% increase in premium tier upgrades
- **User Retention**: 85% of users return within 7 days
- **Content Quality**: Professional-grade captions that rival commercial platforms

---

## **🔍 KEY TECHNICAL DECISIONS**

### **Ultimate Guitar Integration**
- **Scraper**: Use existing `https://github.com/Pilfer/ultimate-guitar-scraper`
- **Data Types**: Focus on chord progressions, lyrics, and tab timing
- **Validation**: Implement smart matching between video and scraped data
- **Fallback**: Provide alternatives when accuracy is insufficient

### **AWS S3 Integration**
- **Storage**: Pre-built SVG files for all chord positions
- **URLs**: Predictable, CDN-ready URLs for fast loading
- **Themes**: Separate light/dark theme SVGs for each chord
- **Organization**: `/chords/{theme}/{chordName}_{positionType}.svg`

### **Quality Assurance**
- **Accuracy Scoring**: 0.00 to 1.00 confidence rating system
- **Validation Rules**: Video length, key consistency, cover detection
- **User Feedback**: Continuous improvement based on user ratings
- **Manual Review**: Human oversight for borderline accuracy cases

---

**This demand-driven approach ensures GuitarMagic builds exactly what users want, when they want it, with the highest possible quality standards.** 🎯✨
