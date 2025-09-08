#!/usr/bin/env node

/**
 * Simple Database Schema Backup - GuitarMagic Platform
 * 
 * This script uses direct SQL queries to backup the current database schema
 * 
 * Run with: node scripts/backup_schema_simple.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🗄️  Creating Simple Database Schema Backup');
console.log('==========================================\n');

async function backupDatabaseSchema() {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Missing Supabase environment variables');
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');
    
    // Get current timestamp for backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `supabase_schema_backup_${timestamp}.sql`;
    const backupPath = path.join(process.cwd(), backupFilename);
    
    console.log(`📝 Creating backup: ${backupFilename}`);
    
    // Start building the backup SQL
    let backupSQL = `-- Database Schema Backup - GuitarMagic Platform\n`;
    backupSQL += `-- Created: ${new Date().toISOString()}\n`;
    backupSQL += `-- Project: ${supabaseUrl}\n\n`;
    
    // List of tables we know exist from our testing
    const knownTables = [
      'songs',
      'song_attributes', 
      'song_sections',
      'song_chord_progressions',
      'video_song_mappings',
      'chord_sync_groups',
      'chord_sync_chords',
      'tab_caption_requests',
      'favorites',
      'captions',
      'chord_captions',
      'chord_positions',
      'chord_variations',
      'user_profiles',
      'subscriptions',
      'admin_settings',
      'feature_gates'
    ];
    
    console.log(`🔍 Checking ${knownTables.length} known tables...`);
    
    let tablesFound = 0;
    
    for (const tableName of knownTables) {
      try {
        console.log(`   📋 Checking table: ${tableName}`);
        
        // Try to query the table to see if it exists and get its structure
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          if (error.message.includes('does not exist')) {
            console.log(`      ❌ Table ${tableName} does not exist`);
            continue;
          } else {
            console.log(`      ⚠️  Table ${tableName} exists but query failed: ${error.message}`);
          }
        } else {
          console.log(`      ✅ Table ${tableName} exists`);
          tablesFound++;
          
          // Get table structure by examining the data
          if (data && data.length > 0) {
            const sampleRow = data[0];
            const columns = Object.keys(sampleRow);
            
            backupSQL += `-- Table: ${tableName}\n`;
            backupSQL += `-- Columns: ${columns.join(', ')}\n`;
            backupSQL += `-- Sample data structure found\n`;
            backupSQL += `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;
            
            // Create basic column definitions based on sample data
            const columnDefinitions = columns.map(col => {
              const value = sampleRow[col];
              let dataType = 'TEXT';
              
              if (typeof value === 'number') {
                if (Number.isInteger(value)) {
                  dataType = 'INTEGER';
                } else {
                  dataType = 'NUMERIC';
                }
              } else if (typeof value === 'boolean') {
                dataType = 'BOOLEAN';
              } else if (value === null) {
                dataType = 'TEXT';
              } else if (typeof value === 'object') {
                dataType = 'JSONB';
              }
              
              return `  "${col}" ${dataType}`;
            });
            
            backupSQL += columnDefinitions.join(',\n');
            backupSQL += '\n);\n\n';
          }
        }
        
      } catch (err) {
        console.log(`      ❌ Error checking ${tableName}: ${err.message}`);
      }
    }
    
    // Add backup summary
    backupSQL += `-- Backup Summary\n`;
    backupSQL += `-- Tables found: ${tablesFound}\n`;
    backupSQL += `-- Total tables checked: ${knownTables.length}\n`;
    backupSQL += `-- Backup completed: ${new Date().toISOString()}\n`;
    backupSQL += `-- Note: This is a basic schema backup. For complete schema,\n`;
    backupSQL += `-- use the Supabase Dashboard SQL Editor to run:\n`;
    backupSQL += `-- SELECT table_name, column_name, data_type, is_nullable, column_default\n`;
    backupSQL += `-- FROM information_schema.columns \n`;
    backupSQL += `-- WHERE table_schema = 'public'\n`;
    backupSQL += `-- ORDER BY table_name, ordinal_position;\n`;
    
    // Write backup to file
    fs.writeFileSync(backupPath, backupSQL, 'utf8');
    
    console.log(`\n✅ Schema backup created successfully!`);
    console.log(`📁 File location: ${backupPath}`);
    console.log(`📊 Backup size: ${(backupSQL.length / 1024).toFixed(2)} KB`);
    console.log(`📋 Tables found: ${tablesFound}`);
    
    // Show file location
    const absolutePath = path.resolve(backupPath);
    console.log(`\n📍 Absolute path: ${absolutePath}`);
    
    // Also show the file in the current directory
    console.log(`\n📂 Current directory contents:`);
    const files = fs.readdirSync(process.cwd()).filter(f => f.includes('backup'));
    files.forEach(f => {
      const stats = fs.statSync(f);
      console.log(`   📄 ${f} (${(stats.size / 1024).toFixed(2)} KB)`);
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Schema backup failed:', error.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  backupDatabaseSchema().catch(console.error);
}

module.exports = { backupDatabaseSchema };
