#!/usr/bin/env node

/**
 * Investigate Database Function Signatures
 * 
 * This script investigates the actual function signatures of database functions
 * to fix the test call issues in test_ug_integration.js
 * 
 * Run with: node scripts/investigate_function_signature.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 Investigating Database Function Signatures');
console.log('===========================================\n');

async function investigateFunctionSignatures() {
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
    
    // List of functions to investigate
    const functionsToTest = [
      'create_chord_sync_group',
      'add_chord_to_sync_group',
      'link_video_to_song',
      'find_song_variations',
      'validate_video_song_sync',
      'get_song_data_for_video',
      'create_tab_caption_request'
    ];
    
    console.log('🔍 Testing function signatures...\n');
    
    for (const funcName of functionsToTest) {
      console.log(`📝 Function: ${funcName}`);
      console.log('   Testing different parameter combinations...');
      
      // Test 1: No parameters
      try {
        const { data, error } = await supabase.rpc(funcName, {});
        
        if (error) {
          if (error.message.includes('function') && error.message.includes('does not exist')) {
            console.log(`   ❌ Function does not exist`);
          } else if (error.message.includes('missing')) {
            console.log(`   ⚠️  Function exists but missing required parameters`);
            console.log(`   📋 Error: ${error.message}`);
          } else {
            console.log(`   ⚠️  Function exists but parameter error: ${error.message}`);
          }
        } else {
          console.log(`   ✅ Function called successfully with no parameters`);
          console.log(`   📊 Returned: ${JSON.stringify(data)}`);
        }
      } catch (err) {
        console.log(`   ❌ Error calling function: ${err.message}`);
      }
      
      // Test 2: With favorite_id parameter (for create_chord_sync_group)
      if (funcName === 'create_chord_sync_group') {
        console.log(`   🧪 Testing with favorite_id parameter...`);
        
        try {
          const { data, error } = await supabase.rpc(funcName, {
            favorite_id: 'test-123'
          });
          
          if (error) {
            console.log(`   📋 Parameter error: ${error.message}`);
            
            // Try different parameter names
            const paramVariations = [
              { p_favorite_id: 'test-123' },
              { favoriteId: 'test-123' },
              { favoriteId: 'test-123', songId: 'test-song-123' },
              { p_favorite_id: 'test-123', p_song_id: 'test-song-123' }
            ];
            
            for (const params of paramVariations) {
              try {
                console.log(`   🔄 Trying parameters: ${JSON.stringify(params)}`);
                const { data: testData, error: testError } = await supabase.rpc(funcName, params);
                
                if (testError) {
                  console.log(`      ❌ Failed: ${testError.message}`);
                } else {
                  console.log(`      ✅ Success with parameters: ${JSON.stringify(params)}`);
                  console.log(`      📊 Returned: ${JSON.stringify(testData)}`);
                  break;
                }
              } catch (testErr) {
                console.log(`      ❌ Error: ${testErr.message}`);
              }
            }
          } else {
            console.log(`   ✅ Function called successfully with favorite_id`);
            console.log(`   📊 Returned: ${JSON.stringify(data)}`);
          }
        } catch (err) {
          console.log(`   ❌ Error testing favorite_id: ${err.message}`);
        }
      }
      
      // Test 3: With song_id parameter (for other functions)
      if (funcName === 'find_song_variations') {
        console.log(`   🧪 Testing with search_term parameter...`);
        
        try {
          const { data, error } = await supabase.rpc(funcName, {
            search_term: 'test'
          });
          
          if (error) {
            console.log(`   📋 Parameter error: ${error.message}`);
            
            // Try different parameter names
            const paramVariations = [
              { p_search_term: 'test' },
              { searchTerm: 'test' },
              { term: 'test' }
            ];
            
            for (const params of paramVariations) {
              try {
                console.log(`      🔄 Trying parameters: ${JSON.stringify(params)}`);
                const { data: testData, error: testError } = await supabase.rpc(funcName, params);
                
                if (testError) {
                  console.log(`         ❌ Failed: ${testError.message}`);
                } else {
                  console.log(`         ✅ Success with parameters: ${JSON.stringify(params)}`);
                  console.log(`         📊 Returned: ${JSON.stringify(testData)}`);
                  break;
                }
              } catch (testErr) {
                console.log(`         ❌ Error: ${testErr.message}`);
              }
            }
          } else {
            console.log(`   ✅ Function called successfully with search_term`);
            console.log(`   📊 Returned: ${JSON.stringify(data)}`);
          }
        } catch (err) {
          console.log(`   ❌ Error testing search_term: ${err.message}`);
        }
      }
      
      console.log(''); // Empty line for readability
    }
    
    // Test database schema information
    console.log('🗄️  Testing Database Schema Information...\n');
    
    try {
      // Check if we can query function information
      const { data: functionInfo, error: functionError } = await supabase
        .from('information_schema.routines')
        .select('routine_name, routine_definition')
        .eq('routine_name', 'create_chord_sync_group')
        .limit(1);
      
      if (functionError) {
        console.log('❌ Could not query function information:', functionError.message);
      } else if (functionInfo && functionInfo.length > 0) {
        console.log('✅ Function information found:');
        console.log(`   📝 Name: ${functionInfo[0].routine_name}`);
        console.log(`   📄 Definition: ${functionInfo[0].routine_definition?.substring(0, 200)}...`);
      } else {
        console.log('⚠️  No function information found in information_schema');
      }
    } catch (err) {
      console.log('❌ Error querying function information:', err.message);
    }
    
    console.log('\n🏁 Function signature investigation complete');
    console.log('💡 Use this information to fix the test calls in test_ug_integration.js');
    
    return true;
    
  } catch (error) {
    console.error('❌ Function signature investigation failed:', error.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  investigateFunctionSignatures().catch(console.error);
}

module.exports = { investigateFunctionSignatures };
