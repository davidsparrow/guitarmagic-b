/**
 * 🔓 Fix S3 Bucket Public Access
 * Configures the bucket to allow public read access for chord SVGs
 */

import pkg from '@aws-sdk/client-s3';
const { S3Client, PutBucketPublicAccessBlockCommand, PutBucketPolicyCommand } = pkg;
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '../.env.local' });

async function fixBucketPermissions() {
  console.log('🔓 Fixing S3 Bucket Public Access...\n');

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

    console.log('📋 Bucket Details:');
    console.log(`   Name: ${bucketName}`);
    console.log(`   Region: us-west-2`);
    console.log('');

    // Step 1: Configure public access block
    console.log('🔓 Step 1: Configuring public access block...');
    try {
      await s3Client.send(new PutBucketPublicAccessBlockCommand({
        Bucket: bucketName,
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: false,
          IgnorePublicAcls: false,
          BlockPublicPolicy: false,
          RestrictPublicBuckets: false
        }
      }));
      console.log('✅ Public access block configured');
    } catch (error) {
      console.log(`❌ Public access block failed: ${error.message}`);
      return false;
    }

    // Step 2: Set bucket policy for public read access
    console.log('\n📜 Step 2: Setting bucket policy...');
    try {
      const bucketPolicy = {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'PublicReadGetObject',
            Effect: 'Allow',
            Principal: '*',
            Action: 's3:GetObject',
            Resource: `arn:aws:s3:::${bucketName}/*`
          }
        ]
      };

      await s3Client.send(new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: JSON.stringify(bucketPolicy)
      }));
      console.log('✅ Bucket policy set for public read access');
    } catch (error) {
      console.log(`❌ Bucket policy failed: ${error.message}`);
      return false;
    }

    console.log('\n🎉 Bucket permissions fixed successfully!');
    console.log(`🌐 Bucket URL: https://${bucketName}.s3.us-west-2.amazonaws.com`);
    console.log('📁 Chord SVGs should now be publicly accessible');

    return true;

  } catch (error) {
    console.error('❌ Failed to fix bucket permissions:', error.message);
    return false;
  }
}

// Run the fix
fixBucketPermissions()
  .then(success => {
    if (success) {
      console.log('\n🚀 Bucket permissions fixed!');
      console.log('🎯 Try accessing the chord URLs again in your browser');
    } else {
      console.log('\n💥 Failed to fix bucket permissions');
      console.log('🔧 Please check the errors above');
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
  });
