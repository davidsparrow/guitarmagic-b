#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkTableStructure() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    console.log('🔍 Checking video_song_mappings table structure...\n');
    
    // Get sample data to see structure
    const { data, error } = await supabase
      .from('video_song_mappings')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      const sample = data[0];
      console.log('📋 Current columns:');
      Object.keys(sample).forEach(col => {
        const value = sample[col];
        const type = typeof value;
        const isNull = value === null;
        console.log(`   ${col}: ${type}${isNull ? ' (NULL)' : ''}`);
      });
    } else {
      console.log('📋 Table exists but has no data');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTableStructure();
