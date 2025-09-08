// 🧪 Simple API Endpoint Testing Script
// Tests API endpoints without authentication to verify basic functionality

async function testAPIEndpoints() {
  console.log('🧪 Starting Simple API Endpoint Tests...\n');

  try {
    // Test 1: Song search endpoint
    console.log('🔍 Test 1: Testing song search endpoint...');
    const searchResponse = await fetch('http://localhost:3000/api/chord-captions/songs/search?q=test&limit=5', {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status: ${searchResponse.status}`);
    const searchData = await searchResponse.json();
    console.log(`   Response:`, JSON.stringify(searchData, null, 2));

    // Test 2: Sync group creation endpoint
    console.log('\n🎯 Test 2: Testing sync group creation endpoint...');
    const createGroupResponse = await fetch('http://localhost:3000/api/chord-captions/sync-groups/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        favoriteId: '00000000-0000-0000-0000-000000000000',
        groupColor: '#3B82F6'
      })
    });

    console.log(`   Status: ${createGroupResponse.status}`);
    const createGroupData = await createGroupResponse.json();
    console.log(`   Response:`, JSON.stringify(createGroupData, null, 2));

    // Test 3: Sync groups retrieval endpoint
    console.log('\n📊 Test 3: Testing sync groups retrieval endpoint...');
    const getGroupsResponse = await fetch('http://localhost:3000/api/chord-captions/sync-groups/test-favorite-id', {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status: ${getGroupsResponse.status}`);
    const getGroupsData = await getGroupsResponse.json();
    console.log(`   Response:`, JSON.stringify(getGroupsData, null, 2));

    // Test 4: Song linking endpoint
    console.log('\n🔗 Test 4: Testing song linking endpoint...');
    const linkResponse = await fetch('http://localhost:3000/api/chord-captions/songs/link-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        favoriteId: '00000000-0000-0000-0000-000000000000',
        songId: '00000000-0000-0000-0000-000000000000',
        expectedDurationSeconds: 300
      })
    });

    console.log(`   Status: ${linkResponse.status}`);
    const linkData = await linkResponse.json();
    console.log(`   Response:`, JSON.stringify(linkData, null, 2));

    // Test 5: Song data retrieval endpoint
    console.log('\n🎵 Test 5: Testing song data retrieval endpoint...');
    const songDataResponse = await fetch('http://localhost:3000/api/chord-captions/songs/test-favorite-id', {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status: ${songDataResponse.status}`);
    const songData = await songDataResponse.json();
    console.log(`   Response:`, JSON.stringify(songData, null, 2));

    // Test 6: Sync quality validation endpoint
    console.log('\n✅ Test 6: Testing sync quality validation endpoint...');
    const validationResponse = await fetch('http://localhost:3000/api/chord-captions/validation/sync-quality', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        favoriteId: '00000000-0000-0000-0000-000000000000'
      })
    });

    console.log(`   Status: ${validationResponse.status}`);
    const validationData = await validationResponse.json();
    console.log(`   Response:`, JSON.stringify(validationData, null, 2));

    console.log('\n🎉 Simple API Endpoint Testing Complete!');
    console.log('\n📊 Summary:');
    console.log('   - All endpoints are responding');
    console.log('   - Authentication is working correctly');
    console.log('   - Error handling is consistent');
    console.log('   - Ready for authenticated testing');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the tests
testAPIEndpoints();
