/**
 * 📤 Upload Test Chords to S3
 * Uploads the test chord SVGs to S3 using the NEW naming convention with theme folders and suffixes
 * 
 * NEW FORMAT: chords/{theme}/{chordName}_{fretStartNumber}_{theme}.svg
 * Examples: chords/lt/C_0_lt.svg, chords/dk/Am_0_dk.svg, chords/lt/F_1_lt.svg
 * 
 * Theme folders: chords/lt/ (light), chords/dk/ (dark)
 * Theme suffixes: _lt.svg (light), _dk.svg (dark)
 */

import pkg from '@aws-sdk/client-s3';
const { S3Client, PutObjectCommand } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: '../.env.local' });

// Test chord data with NEW naming convention and theme folders
const testChords = [
  {
    name: 'Am',
    fretStartNumber: 0,
    lightFile: 'Am_new_light.svg',
    darkFile: 'Am_new_dark.svg'
  },
  {
    name: 'C',
    fretStartNumber: 0,
    lightFile: 'C_new_light.svg',
    darkFile: 'C_new_dark.svg'
  },
  {
    name: 'F',
    fretStartNumber: 1,
    lightFile: 'UG_F_light.svg',
    darkFile: 'UG_F_dark.svg'
  },
  {
    name: 'B6add9',
    fretStartNumber: 1,
    lightFile: 'UG_B6add9_light.svg',
    darkFile: 'UG_B6add9_dark.svg'
  }
];

async function uploadTestChords() {
  console.log('📤 Uploading Test Chords to S3 with NEW naming convention, theme folders, and suffixes...\n');

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
    const uploadResults = [];

    // Upload each chord variation
    for (const chord of testChords) {
      console.log(`🎵 Processing ${chord.name} at fret ${chord.fretStartNumber}...`);

      // Upload light theme with _lt suffix to lt folder
      try {
        const lightContent = fs.readFileSync(chord.lightFile, 'utf8');
        const lightKey = `chords/lt/${chord.name}_${chord.fretStartNumber}_lt.svg`;
        
        await s3Client.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: lightKey,
          Body: lightContent,
          ContentType: 'image/svg+xml',
          CacheControl: 'public, max-age=31536000' // Cache for 1 year
        }));

        const lightUrl = `https://${bucketName}.s3.us-west-2.amazonaws.com/${lightKey}`;
        uploadResults.push({
          chord: chord.name,
          theme: 'light (_lt)',
          fretStart: chord.fretStartNumber,
          url: lightUrl,
          status: '✅ Success'
        });

        console.log(`   ✅ Light theme uploaded: ${lightUrl}`);
      } catch (error) {
        console.log(`   ❌ Light theme failed: ${error.message}`);
        uploadResults.push({
          chord: chord.name,
          theme: 'light (_lt)',
          fretStart: chord.fretStartNumber,
          status: `❌ Failed: ${error.message}`
        });
      }

      // Upload dark theme with _dk suffix to dk folder
      try {
        const darkContent = fs.readFileSync(chord.darkFile, 'utf8');
        const darkKey = `chords/dk/${chord.name}_${chord.fretStartNumber}_dk.svg`;
        
        await s3Client.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: darkKey,
          Body: darkContent,
          ContentType: 'image/svg+xml',
          CacheControl: 'public, max-age=31536000' // Cache for 1 year
        }));

        const darkUrl = `https://${bucketName}.s3.us-west-2.amazonaws.com/${darkKey}`;
        uploadResults.push({
          chord: chord.name,
          theme: 'dark (_dk)',
          fretStart: chord.fretStartNumber,
          url: darkUrl,
          status: '✅ Success'
        });

        console.log(`   ✅ Dark theme uploaded: ${darkUrl}`);
      } catch (error) {
        console.log(`   ❌ Dark theme failed: ${error.message}`);
        uploadResults.push({
          chord: chord.name,
          theme: 'dark (_dk)',
          fretStart: chord.fretStartNumber,
          status: `❌ Failed: ${error.message}`
        });
      }

      console.log('');
    }

    // Summary
    console.log('📊 Upload Summary:');
    console.log('='.repeat(60));
    
    const successful = uploadResults.filter(r => r.status === '✅ Success');
    const failed = uploadResults.filter(r => r.status !== '✅ Success');
    
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log('');

    successful.forEach(result => {
      console.log(`✅ ${result.chord} ${result.theme} at fret ${result.fretStart}:`);
      console.log(`   ${result.url}`);
    });

    if (failed.length > 0) {
      console.log('\n❌ Failed Uploads:');
      failed.forEach(result => {
        console.log(`❌ ${result.chord} ${result.theme} at fret ${result.fretStart}: ${result.status}`);
      });
    }

    console.log('\n🎉 Test chord upload completed with NEW naming convention, theme folders, and suffixes!');
    console.log(`🌐 Bucket: https://${bucketName}.s3.us-west-2.amazonaws.com/`);
    console.log('📁 Ready for testing in the browser!');
    console.log('\n📋 NEW NAMING EXAMPLES WITH THEME FOLDERS AND SUFFIXES:');
    console.log('   chords/lt/C_0_lt.svg → C major at NUT position (light theme)');
    console.log('   chords/dk/F_1_dk.svg → F major at 1st fret (dark theme)');
    console.log('   chords/lt/B6add9_1_lt.svg → B6add9 at 1st fret (light theme)');
    console.log('\n📁 Theme folder structure: chords/lt/ and chords/dk/');

    return successful.length > 0;

  } catch (error) {
    console.error('💥 Upload failed:', error.message);
    return false;
  }
}

// Run the upload
uploadTestChords()
  .then(success => {
    if (success) {
      console.log('\n🚀 Test chords uploaded successfully with NEW naming, theme folders, and suffixes!');
      console.log('🎯 Ready to test the updated chord library system!');
    } else {
      console.log('\n💥 Test chord upload failed');
      console.log('🔧 Please check the errors above');
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
  });
