/**
 * 🪣 Create S3 Bucket for Chord Library
 * Creates the S3 bucket and configures it for public SVG access
 */

import pkg from '@aws-sdk/client-s3';
const { S3Client, CreateBucketCommand, PutBucketPublicAccessBlockCommand, PutBucketPolicyCommand } = pkg;
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '../.env.local' });

async function createChordLibraryBucket() {
  console.log('🪣 Creating S3 Bucket for Chord Library...\n');

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
    const region = 'us-west-2';

    console.log('📋 Bucket Details:');
    console.log(`   Name: ${bucketName}`);
    console.log(`   Region: ${region}`);
    console.log('');

    // Check if bucket already exists
    try {
      await s3Client.send(new CreateBucketCommand({
        Bucket: bucketName,
        CreateBucketConfiguration: {
          LocationConstraint: region === 'us-west-2' ? region : undefined
        }
      }));
      console.log('✅ Bucket created successfully!');
    } catch (error) {
      if (error.name === 'BucketAlreadyExists') {
        console.log('ℹ️ Bucket already exists, proceeding with configuration...');
      } else {
        throw error;
      }
    }

    // Configure public access (allow public read access for SVGs)
    console.log('\n🔓 Configuring public access...');
    await s3Client.send(new PutBucketPublicAccessBlockCommand({
      Bucket: bucketName,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        IgnorePublicAcls: false,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false
      }
    }));
    console.log('✅ Public access configured');

    // Set bucket policy for public read access
    console.log('\n📜 Setting bucket policy...');
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

    console.log('\n🎉 S3 Bucket setup complete!');
    console.log(`🌐 Bucket URL: https://${bucketName}.s3.${region}.amazonaws.com`);
    console.log('📁 Ready to store chord SVGs');

    return true;

  } catch (error) {
    console.error('❌ Failed to create S3 bucket:', error.message);
    
    if (error.name === 'AccessDenied') {
      console.log('\n💡 Possible issues:');
      console.log('   - Check IAM permissions for S3 bucket creation');
      console.log('   - Verify the user has S3FullAccess or similar policy');
    }
    
    return false;
  }
}

// Run the bucket creation
createChordLibraryBucket()
  .then(success => {
    if (success) {
      console.log('\n🚀 Ready to proceed with chord SVG generation and upload!');
    } else {
      console.log('\n💥 S3 bucket creation failed');
      console.log('🔧 Please check permissions and try again');
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
  });
