#!/usr/bin/env node

/**
 * Backup Database Schema - GuitarMagic Platform
 * 
 * This script connects to Supabase and exports the current database schema
 * as a backup before running the enhancement script
 * 
 * Run with: node scripts/backup_schema.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🗄️  Creating Database Schema Backup');
console.log('===================================\n');

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
    
    // 1. Get all tables
    console.log('🔍 Getting table information...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');
    
    if (tablesError) {
      console.log('❌ Error getting tables:', tablesError.message);
      return false;
    }
    
    console.log(`✅ Found ${tables.length} tables`);
    
    // 2. Get table structures
    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`   📋 Processing table: ${tableName}`);
      
      // Get table columns
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('*')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position');
      
      if (columnsError) {
        console.log(`   ❌ Error getting columns for ${tableName}:`, columnsError.message);
        continue;
      }
      
      // Get table constraints
      const { data: constraints, error: constraintsError } = await supabase
        .from('information_schema.table_constraints')
        .select('*')
        .eq('table_schema', 'public')
        .eq('table_name', tableName);
      
      // Get indexes
      const { data: indexes, error: indexesError } = await supabase
        .from('pg_indexes')
        .select('*')
        .eq('tablename', tableName);
      
      // Build CREATE TABLE statement
      backupSQL += `-- Table: ${tableName}\n`;
      backupSQL += `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;
      
      const columnDefinitions = columns.map(col => {
        let def = `  "${col.column_name}" ${col.data_type}`;
        
        if (col.character_maximum_length) {
          def += `(${col.character_maximum_length})`;
        }
        
        if (col.is_nullable === 'NO') {
          def += ' NOT NULL';
        }
        
        if (col.column_default) {
          def += ` DEFAULT ${col.column_default}`;
        }
        
        return def;
      });
      
      backupSQL += columnDefinitions.join(',\n');
      backupSQL += '\n);\n\n';
      
      // Add constraints
      if (constraints && !constraintsError) {
        for (const constraint of constraints) {
          if (constraint.constraint_type === 'PRIMARY KEY') {
            backupSQL += `ALTER TABLE "${tableName}" ADD CONSTRAINT "${constraint.constraint_name}" PRIMARY KEY (${constraint.constraint_definition || 'id'});\n`;
          }
        }
      }
      
      // Add indexes
      if (indexes && !indexesError) {
        for (const index of indexes) {
          if (!index.indexname.includes('_pkey')) { // Skip primary key indexes
            backupSQL += `CREATE INDEX IF NOT EXISTS "${index.indexname}" ON "${tableName}" (${index.indexdef.match(/\((.*?)\)/)?.[1] || 'id'});\n`;
          }
        }
      }
      
      backupSQL += '\n';
    }
    
    // 3. Get functions
    console.log('🔧 Getting function information...');
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_definition')
      .eq('routine_schema', 'public')
      .eq('routine_type', 'FUNCTION');
    
    if (!functionsError && functions && functions.length > 0) {
      backupSQL += `-- Functions\n`;
      for (const func of functions) {
        backupSQL += `-- Function: ${func.routine_name}\n`;
        backupSQL += `-- ${func.routine_definition?.substring(0, 200)}...\n\n`;
      }
    }
    
    // 4. Get views
    console.log('👁️  Getting view information...');
    const { data: views, error: viewsError } = await supabase
      .from('information_schema.views')
      .select('table_name, view_definition')
      .eq('table_schema', 'public');
    
    if (!viewsError && views && views.length > 0) {
      backupSQL += `-- Views\n`;
      for (const view of views) {
        backupSQL += `-- View: ${view.table_name}\n`;
        backupSQL += `-- ${view.view_definition?.substring(0, 200)}...\n\n`;
      }
    }
    
    // 5. Add backup summary
    backupSQL += `-- Backup Summary\n`;
    backupSQL += `-- Tables: ${tables.length}\n`;
    backupSQL += `-- Functions: ${functions?.length || 0}\n`;
    backupSQL += `-- Views: ${views?.length || 0}\n`;
    backupSQL += `-- Backup completed: ${new Date().toISOString()}\n`;
    
    // Write backup to file
    fs.writeFileSync(backupPath, backupSQL, 'utf8');
    
    console.log(`\n✅ Schema backup created successfully!`);
    console.log(`📁 File location: ${backupPath}`);
    console.log(`📊 Backup size: ${(backupSQL.length / 1024).toFixed(2)} KB`);
    console.log(`📋 Tables backed up: ${tables.length}`);
    
    // Show file location
    const absolutePath = path.resolve(backupPath);
    console.log(`\n📍 Absolute path: ${absolutePath}`);
    
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
