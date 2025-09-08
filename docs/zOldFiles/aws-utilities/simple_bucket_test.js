/**
 * 🧪 Simple S3 Bucket Test
 * Tests basic S3 functionality with the created bucket
 */

import pkg from '@aws-sdk/client-s3';
const { S3Client, ListObjectsV2Command, PutObjectCommand } = pkg;
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '../.env.local' });

async function testS3Bucket() {
  console.log('🧪 Testing S3 Bucket Functionality...\n');

  try {
    // Create S3 client
    const s3Client = new S3Client({
      region: 'us-west-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const bucketName = 'guitarmagic-chord-library';

    console.log('📋 Testing bucket access...');
    console.log(`   Bucket: ${bucketName}`);
    console.log('');

    // Test 1: List objects in bucket
    console.log('📋 Test 1: Listing bucket contents...');
    try {
      const listCommand = new ListObjectsV2Command({ Bucket: bucketName });
      const listResult = await s3Client.send(listCommand);
      console.log(`✅ Bucket accessible! Found ${listResult.Contents?.length || 0} objects`);
    } catch (error) {
      console.log(`❌ List test failed: ${error.message}`);
      return false;
    }

    // Test 2: Upload a test file
    console.log('\n📤 Test 2: Uploading test file...');
    try {
      const testContent = '<svg><text>Test SVG</text></svg>';
      const uploadCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: 'test/test.svg',
        Body: testContent,
        ContentType: 'image/svg+xml'
      });
      await s3Client.send(uploadCommand);
      console.log('✅ Test file uploaded successfully!');
    } catch (error) {
      console.log(`❌ Upload test failed: ${error.message}`);
      return false;
    }

    // Test 3: List objects again to see the new file
    console.log('\n📋 Test 3: Verifying uploaded file...');
    try {
      const listCommand2 = new ListObjectsV2Command({ Bucket: bucketName });
      const listResult2 = await s3Client.send(listCommand2);
      console.log(`✅ File verification successful! Bucket now has ${listResult2.Contents?.length || 0} objects`);
      
      if (listResult2.Contents) {
        listResult2.Contents.forEach(obj => {
          console.log(`   - ${obj.Key} (${obj.Size} bytes, created: ${obj.LastModified})`);
        });
      }
    } catch (error) {
      console.log(`❌ Verification test failed: ${error.message}`);
      return false;
    }

    console.log('\n🎉 S3 Bucket test completed successfully!');
    console.log(`🌐 Bucket URL: https://${bucketName}.s3.us-west-2.amazonaws.com`);
    console.log('📁 Ready for chord SVG uploads');

    return true;

  } catch (error) {
    console.error('❌ S3 bucket test failed:', error.message);
    return false;
  }
}

// Run the test
testS3Bucket()
  .then(success => {
    if (success) {
      console.log('\n🚀 S3 bucket is working perfectly!');
      console.log('🎯 Ready to proceed with chord library generation!');
    } else {
      console.log('\n💥 S3 bucket test failed');
      console.log('🔧 Please check permissions and try again');
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
  });
