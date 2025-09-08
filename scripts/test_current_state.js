#!/usr/bin/env node

/**
 * Test Current State - GuitarMagic Platform
 * 
 * This script tests the current working state of:
 * 1. Database connection
 * 2. API endpoints
 * 3. Key components
 * 
 * Run with: node scripts/test_current_state.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Test configuration
const TESTS = {
  database: false,
  apiEndpoints: false,
  components: false
};

console.log('🎸 GuitarMagic Platform - Current State Test');
console.log('============================================\n');

// Test 1: Database Connection
async function testDatabaseConnection() {
  console.log('1️⃣ Testing Database Connection...');
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Missing Supabase environment variables');
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connection
    const { data, error } = await supabase
      .from('favorites')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
    
  } catch (error) {
    console.log('❌ Database test error:', error.message);
    return false;
  }
}

// Test 2: API Endpoints
async function testAPIEndpoints() {
  console.log('\n2️⃣ Testing API Endpoints...');
  
  try {
    // Test song search endpoint
    const response = await fetch('http://localhost:3000/api/chord-captions/songs/search?q=test');
    
    if (response.ok) {
      console.log('✅ Song search API responding');
      return true;
    } else {
      console.log('❌ Song search API failed:', response.status);
      return false;
    }
    
  } catch (error) {
    console.log('❌ API test error:', error.message);
    return false;
  }
}

// Test 3: Component Files
function testComponentFiles() {
  console.log('\n3️⃣ Testing Component Files...');
  
  const fs = require('fs');
  const path = require('path');
  
  const requiredComponents = [
    'components/SongSearchDropdown.js',
    'components/ChordCaptionModal.js',
    'components/VideoPlayer.js'
  ];
  
  let allExist = true;
  
  requiredComponents.forEach(component => {
    const fullPath = path.join(process.cwd(), component);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${component} exists`);
    } else {
      console.log(`❌ ${component} missing`);
      allExist = false;
    }
  });
  
  return allExist;
}

// Main test runner
async function runTests() {
  console.log('Starting tests...\n');
  
  // Run tests
  TESTS.database = await testDatabaseConnection();
  TESTS.apiEndpoints = await testAPIEndpoints();
  TESTS.components = testComponentFiles();
  
  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  console.log(`Database: ${TESTS.database ? '✅' : '❌'}`);
  console.log(`API Endpoints: ${TESTS.apiEndpoints ? '✅' : '❌'}`);
  console.log(`Components: ${TESTS.components ? '✅' : '❌'}`);
  
  const allPassed = Object.values(TESTS).every(test => test === true);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Platform is ready.');
  } else {
    console.log('\n⚠️  Some tests failed. Review above for details.');
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, TESTS };
