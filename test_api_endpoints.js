// 🧪 API Endpoint Testing Script
// Tests all new song linking API endpoints with real authentication

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration - using actual values from .env.local
const supabaseUrl = 'https://kxnnbusdokitbgurowkq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4bm5idXNkb2tpdGJndXJvd2txIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTUwNjIsImV4cCI6MjA2OTQzMTA2Mn0.capBgZ5MOSQM_7cuZXbUohZFhk2qAmCbDlDvynx0nKg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAPIEndpoints() {
  console.log('🧪 Starting API Endpoint Tests...\n');

  try {
    // Step 1: Authenticate with test user
    console.log('🔐 Step 1: Authenticating with test user...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'robshackell@gmail.com',
      password: 'Loca1234'
    });

    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      return;
    }

    console.log('✅ Authentication successful!');
    console.log(`   User ID: ${authData.user.id}`);
    console.log(`   Email: ${authData.user.email}\n`);

    // Step 2: Get user's favorites for testing
    console.log('📋 Step 2: Getting user favorites for testing...');
    const { data: favorites, error: favoritesError } = await supabase
      .from('favorites')
      .select('id, video_title, video_url')
      .limit(3);

    if (favoritesError) {
      console.error('❌ Failed to get favorites:', favoritesError.message);
      return;
    }

    if (!favorites || favorites.length === 0) {
      console.log('⚠️  No favorites found. Creating test data...');
      // We'll use placeholder UUIDs for testing
    } else {
      console.log(`✅ Found ${favorites.length} favorites`);
      favorites.forEach((fav, i) => {
        console.log(`   ${i + 1}. ${fav.video_title}`);
      });
    }

    // Step 3: Test song search endpoint
    console.log('\n🔍 Step 3: Testing song search endpoint...');
    const searchResponse = await fetch('http://localhost:3000/api/chord-captions/songs/search?q=test&limit=5', {
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status: ${searchResponse.status}`);
    const searchData = await searchResponse.json();
    console.log(`   Response:`, JSON.stringify(searchData, null, 2));

    // Step 4: Test sync group creation
    console.log('\n🎯 Step 4: Testing sync group creation...');
    const testFavoriteId = favorites?.[0]?.id || '00000000-0000-0000-0000-000000000000';
    
    const createGroupResponse = await fetch('http://localhost:3000/api/chord-captions/sync-groups/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        favoriteId: testFavoriteId,
        groupColor: '#3B82F6'
      })
    });

    console.log(`   Status: ${createGroupResponse.status}`);
    const createGroupData = await createGroupResponse.json();
    console.log(`   Response:`, JSON.stringify(createGroupData, null, 2));

    // Step 5: Test getting sync groups
    console.log('\n📊 Step 5: Testing sync groups retrieval...');
    const getGroupsResponse = await fetch(`http://localhost:3000/api/chord-captions/sync-groups/${testFavoriteId}`, {
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status: ${getGroupsResponse.status}`);
    const getGroupsData = await getGroupsResponse.json();
    console.log(`   Response:`, JSON.stringify(getGroupsData, null, 2));

    // Step 6: Test song linking
    console.log('\n🔗 Step 6: Testing song linking...');
    const linkResponse = await fetch('http://localhost:3000/api/chord-captions/songs/link-video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        favoriteId: testFavoriteId,
        songId: '00000000-0000-0000-0000-000000000000', // Placeholder
        expectedDurationSeconds: 300
      })
    });

    console.log(`   Status: ${linkResponse.status}`);
    const linkData = await linkResponse.json();
    console.log(`   Response:`, JSON.stringify(linkData, null, 2));

    console.log('\n🎉 API Endpoint Testing Complete!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the tests
testAPIEndpoints();
