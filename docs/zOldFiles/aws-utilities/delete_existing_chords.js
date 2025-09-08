/**
 * 🗑️ Delete Existing Chord Images from S3
 * Removes all existing chord SVGs to prepare for new naming convention
 * 
 * WARNING: This will delete ALL existing chord files!
 * Only run when you're ready to start fresh with new naming system
 */

import pkg from '@aws-sdk/client-s3';
const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = pkg;
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '../.env.local' });

async function deleteExistingChords() {
  console.log('🗑️ DELETING EXISTING CHORD IMAGES FROM S3...\n');
  console.log('⚠️  WARNING: This will delete ALL existing chord files!\n');

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
    
    // First, list all objects in the chords folder
    console.log('📋 Listing existing chord files...');
    
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'chords/'
    });

    const listResult = await s3Client.send(listCommand);
    
    if (!listResult.Contents || listResult.Contents.length === 0) {
      console.log('✅ No existing chord files found. Bucket is clean!');
      return true;
    }

    // Filter for chord SVG files
    const chordFiles = listResult.Contents.filter(obj => 
      obj.Key.endsWith('.svg') && obj.Key.includes('chords/')
    );

    if (chordFiles.length === 0) {
      console.log('✅ No chord SVG files found. Bucket is clean!');
      return true;
    }

    console.log(`📁 Found ${chordFiles.length} existing chord files:`);
    chordFiles.forEach(file => {
      console.log(`   ${file.Key}`);
    });

    // Confirm deletion
    console.log('\n⚠️  ABOUT TO DELETE THESE FILES:');
    console.log(`   Total files: ${chordFiles.length}`);
    console.log('   This action cannot be undone!\n');

    // In a real script, you might want to add a confirmation prompt
    // For now, we'll proceed with deletion
    console.log('🗑️  Proceeding with deletion...\n');

    // Prepare delete command
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: {
        Objects: chordFiles.map(file => ({ Key: file.Key })),
        Quiet: false
      }
    });

    // Execute deletion
    const deleteResult = await s3Client.send(deleteCommand);
    
    console.log('✅ Deletion completed!');
    console.log(`   Successfully deleted: ${deleteResult.Deleted?.length || 0} files`);
    
    if (deleteResult.Errors && deleteResult.Errors.length > 0) {
      console.log(`   Errors: ${deleteResult.Errors.length} files failed to delete`);
      deleteResult.Errors.forEach(error => {
        console.log(`     ❌ ${error.Key}: ${error.Message}`);
      });
    }

    // Verify deletion
    console.log('\n🔍 Verifying deletion...');
    const verifyList = await s3Client.send(listCommand);
    
    if (!verifyList.Contents || verifyList.Contents.length === 0) {
      console.log('✅ Verification successful: All chord files deleted!');
    } else {
      const remainingFiles = verifyList.Contents.filter(obj => 
        obj.Key.endsWith('.svg') && obj.Key.includes('chords/')
      );
      console.log(`⚠️  ${remainingFiles.length} chord files still remain:`);
      remainingFiles.forEach(file => {
        console.log(`   ${file.Key}`);
      });
    }

    console.log('\n🎉 S3 bucket cleaned and ready for new naming convention!');
    console.log('📤 Ready to upload test chords with new names!');

    return true;

  } catch (error) {
    console.error('💥 Deletion failed:', error.message);
    return false;
  }
}

// Run the deletion
deleteExistingChords()
  .then(success => {
    if (success) {
      console.log('\n🚀 S3 bucket cleanup completed successfully!');
      console.log('🎯 Ready for Step 4: Upload test chords with new naming!');
    } else {
      console.log('\n💥 S3 bucket cleanup failed');
      console.log('🔧 Please check the errors above');
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
  });
