/**
 * 🧪 Test AWS S3 Connection
 * Simple test to verify AWS SDK is working with your credentials
 */

import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '../.env.local' });

// Test AWS connection
async function testAWSConnection() {
  console.log('🧪 Testing AWS S3 Connection...\n');

  try {
    // Debug: Check what credentials are loaded
    console.log('🔍 Debug: Checking loaded credentials...');
    console.log('   AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '✅ Loaded' : '❌ Not loaded');
    console.log('   AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '✅ Loaded' : '❌ Not loaded');
    console.log('   Access Key length:', process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.length : 'N/A');
    console.log('   Secret Key length:', process.env.AWS_SECRET_ACCESS_KEY ? process.env.AWS_SECRET_ACCESS_KEY.length : 'N/A');
    console.log('');

    // Create S3 client with credentials from .env.local
    const s3Client = new S3Client({
      region: 'us-west-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    console.log('✅ S3 Client created successfully');
    console.log('📍 Region: us-west-2');
    console.log('🔑 Using credentials from .env.local\n');

    // Test connection by listing buckets
    console.log('📋 Testing connection by listing buckets...');
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);

    console.log('✅ AWS connection successful!');
    console.log(`📦 Found ${response.Buckets.length} buckets:`);
    
    response.Buckets.forEach(bucket => {
      console.log(`   - ${bucket.Name} (created: ${bucket.CreationDate})`);
    });

    // Check if our target bucket exists
    const targetBucket = 'guitarmagic-chord-library';
    const bucketExists = response.Buckets.some(bucket => bucket.Name === targetBucket);
    
    if (bucketExists) {
      console.log(`\n🎯 Target bucket '${targetBucket}' already exists!`);
    } else {
      console.log(`\n⚠️ Target bucket '${targetBucket}' does not exist yet`);
      console.log('   (We will create it in the next step)');
    }

    return true;

  } catch (error) {
    console.error('❌ AWS connection test failed:', error.message);
    
    if (error.name === 'InvalidAccessKeyId') {
      console.log('\n💡 Possible issues:');
      console.log('   - Check AWS_ACCESS_KEY_ID in .env.local');
      console.log('   - Verify the access key is correct');
    } else if (error.name === 'SignatureDoesNotMatch') {
      console.log('\n💡 Possible issues:');
      console.log('   - Check AWS_SECRET_ACCESS_KEY in .env.local');
      console.log('   - Verify the secret key is correct');
    } else if (error.name === 'UnauthorizedOperation') {
      console.log('\n💡 Possible issues:');
      console.log('   - Check IAM permissions for S3 access');
      console.log('   - Verify the user has S3 permissions');
    }
    
    return false;
  }
}

// Run the test
testAWSConnection()
  .then(success => {
    if (success) {
      console.log('\n🎉 AWS connection test completed successfully!');
      console.log('🚀 Ready to proceed with S3 bucket creation');
    } else {
      console.log('\n💥 AWS connection test failed');
      console.log('🔧 Please check your credentials and try again');
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
  });
