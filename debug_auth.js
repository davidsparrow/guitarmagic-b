// 🔍 Debug Authentication Script
// Investigates why the provided credentials aren't working

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://kxnnbusdokitbgurowkq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4bm5idXNkb2tpdGJndXJvd2txIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTUwNjIsImV4cCI6MjA2OTQzMTA2Mn0.capBgZ5MOSQM_7cuZXbUohZFhk2qAmCbDlDvynx0nKg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugAuth() {
  console.log('🔍 Debugging Authentication Issues...\n');

  try {
    // Test 1: Check if we can connect to Supabase
    console.log('🔌 Test 1: Testing Supabase connection...');
    const { data: healthData, error: healthError } = await supabase.from('favorites').select('count').limit(1);
    
    if (healthError) {
      console.error('❌ Supabase connection failed:', healthError.message);
      return;
    }
    console.log('✅ Supabase connection successful\n');

    // Test 2: Try different password variations
    console.log('🔐 Test 2: Trying different password variations...');
    
    const passwords = [
      'Loca1234',
      'loca1234',
      'LOCA1234',
      'Loca 1234',
      'Loca1234 ',
      ' Loca1234'
    ];

    for (const password of passwords) {
      console.log(`   Trying: "${password}"`);
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'robshackell@gmail.com',
        password: password
      });

      if (authError) {
        console.log(`     ❌ Failed: ${authError.message}`);
      } else {
        console.log(`     ✅ SUCCESS! User ID: ${authData.user.id}`);
        console.log(`     Email: ${authData.user.email}`);
        console.log(`     Access Token: ${authData.session.access_token.substring(0, 20)}...`);
        return; // Exit on success
      }
    }

    // Test 3: Check if user exists
    console.log('\n👤 Test 3: Checking if user exists...');
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.log('   ⚠️  Cannot check users (admin access required)');
    } else {
      const user = userData.users.find(u => u.email === 'robshackell@gmail.com');
      if (user) {
        console.log(`   ✅ User found: ${user.email}`);
        console.log(`   Status: ${user.user_metadata?.status || 'unknown'}`);
        console.log(`   Last Sign In: ${user.last_sign_in_at || 'never'}`);
      } else {
        console.log('   ❌ User not found in this Supabase instance');
      }
    }

    console.log('\n❌ All authentication attempts failed');
    console.log('Possible issues:');
    console.log('   - Password is different than provided');
    console.log('   - User account is disabled');
    console.log('   - Different Supabase project');
    console.log('   - Email verification required');

  } catch (error) {
    console.error('❌ Debug failed with error:', error.message);
  }
}

// Run the debug
debugAuth();
