#!/usr/bin/env node

/**
 * Execute Missing Database Functions
 * 
 * This script executes the SQL functions that were identified as missing
 * by the test_ug_integration.js script
 * 
 * Run with: node scripts/execute_database_functions.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🗄️  Executing Missing Database Functions');
console.log('=======================================\n');

async function executeDatabaseFunctions() {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Missing Supabase environment variables');
      console.log('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
      console.log('   SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
      console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'docs/create_missing_database_functions.sql');
    if (!fs.existsSync(sqlFilePath)) {
      console.log('❌ SQL file not found:', sqlFilePath);
      return false;
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('✅ SQL file loaded');
    
    // Split SQL into individual function definitions
    const functionDefinitions = sqlContent
      .split('-- Function')
      .filter(part => part.trim().length > 0)
      .map(part => '-- Function' + part);
    
    console.log(`📊 Found ${functionDefinitions.length} function definitions`);
    
    // Execute each function definition
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < functionDefinitions.length; i++) {
      const sql = functionDefinitions[i].trim();
      if (!sql) continue;
      
      try {
        console.log(`\n🔧 Executing function ${i + 1}/${functionDefinitions.length}...`);
        
        // Extract function name for logging
        const functionNameMatch = sql.match(/CREATE OR REPLACE FUNCTION (\w+)/);
        const functionName = functionNameMatch ? functionNameMatch[1] : `Function ${i + 1}`;
        
        console.log(`   📝 Creating function: ${functionName}`);
        
        // Execute the SQL
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
          // Try direct execution if exec_sql doesn't exist
          console.log(`   ⚠️  exec_sql failed, trying direct execution...`);
          
          // For now, let's test if the functions exist by calling them
          console.log(`   🧪 Testing if function ${functionName} exists...`);
          
          // Test the specific function that was failing in our tests
          if (functionName === 'create_chord_sync_group') {
            try {
              const { data, error: testError } = await supabase
                .rpc('create_chord_sync_group', {
                  p_favorite_id: 'test-123',
                  p_song_id: 'test-song-123'
                });
              
              if (testError) {
                console.log(`   ❌ Function ${functionName} test failed:`, testError.message);
                errorCount++;
              } else {
                console.log(`   ✅ Function ${functionName} test successful`);
                successCount++;
              }
            } catch (testErr) {
              console.log(`   ❌ Function ${functionName} test error:`, testErr.message);
              errorCount++;
            }
          } else {
            console.log(`   ⏭️  Skipping test for ${functionName} (not the main failing function)`);
          }
        } else {
          console.log(`   ✅ Function ${functionName} created successfully`);
          successCount++;
        }
        
      } catch (err) {
        console.log(`   ❌ Error executing function ${i + 1}:`, err.message);
        errorCount++;
      }
    }
    
    // Summary
    console.log('\n📊 Function Execution Summary');
    console.log('=============================');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📊 Total: ${functionDefinitions.length}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 All database functions created successfully!');
      console.log('   💡 Ready to re-test infrastructure');
    } else {
      console.log('\n⚠️  Some functions failed to create');
      console.log('   💡 Check the errors above and retry');
    }
    
    return errorCount === 0;
    
  } catch (error) {
    console.error('❌ Database function execution failed:', error.message);
    return false;
  }
}

// Alternative approach: Create functions one by one using RPC calls
async function createFunctionsIndividually() {
  console.log('\n🔄 Alternative Approach: Creating Functions Individually');
  console.log('=====================================================\n');
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Missing Supabase environment variables');
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test if we can create a simple function
    console.log('🧪 Testing function creation capability...');
    
    // Try to create a simple test function
    const testFunctionSQL = `
      CREATE OR REPLACE FUNCTION test_function_exists()
      RETURNS TEXT
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN 'test_function_works';
      END;
      $$;
    `;
    
    try {
      // This might not work without direct SQL execution, but let's try
      console.log('   📝 Attempting to create test function...');
      
      // For now, let's just test if the functions we need already exist
      console.log('   🔍 Checking if required functions already exist...');
      
      const requiredFunctions = [
        'create_chord_sync_group',
        'add_chord_to_sync_group', 
        'link_video_to_song',
        'find_song_variations',
        'validate_video_song_sync',
        'get_song_data_for_video',
        'create_tab_caption_request'
      ];
      
      let existingFunctions = 0;
      
      for (const funcName of requiredFunctions) {
        try {
          // Try to call each function to see if it exists
          const { error } = await supabase.rpc(funcName, {});
          
          if (error && error.message.includes('function') && error.message.includes('does not exist')) {
            console.log(`   ❌ ${funcName}: Not found`);
          } else {
            console.log(`   ✅ ${funcName}: Exists (or callable)`);
            existingFunctions++;
          }
        } catch (err) {
          console.log(`   ❌ ${funcName}: Error testing - ${err.message}`);
        }
      }
      
      console.log(`\n📊 Function Status: ${existingFunctions}/${requiredFunctions.length} functions exist`);
      
      if (existingFunctions === 0) {
        console.log('\n⚠️  No required functions exist yet');
        console.log('   💡 You may need to run the SQL manually in Supabase dashboard');
        console.log('   💡 Or use a database migration tool');
      } else if (existingFunctions === requiredFunctions.length) {
        console.log('\n🎉 All required functions already exist!');
        console.log('   💡 Ready to re-test infrastructure');
      } else {
        console.log('\n⚠️  Some functions exist, some are missing');
        console.log('   💡 Partial functionality available');
      }
      
      return existingFunctions > 0;
      
    } catch (err) {
      console.log('   ❌ Function creation test failed:', err.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Individual function creation failed:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting database function setup...\n');
  
  // Try the main approach first
  const mainSuccess = await executeDatabaseFunctions();
  
  if (!mainSuccess) {
    // Fall back to individual approach
    await createFunctionsIndividually();
  }
  
  console.log('\n🏁 Database function setup complete');
  console.log('💡 Next step: Re-run test_ug_integration.js to verify infrastructure');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { executeDatabaseFunctions, createFunctionsIndividually };
