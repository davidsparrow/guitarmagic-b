// pages/api/test/check-schema.js
// Check what columns actually exist in the user_profiles table
import { adminSupabase } from '../../../lib/adminSupabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🔍 Checking user_profiles table schema...');

    // Get table info
    const { data: tableInfo, error: tableError } = await adminSupabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Error accessing table:', tableError);
      return res.status(500).json({ 
        message: 'Error accessing table',
        error: tableError.message 
      });
    }

    // Get column names from the first row
    const columns = tableInfo && tableInfo.length > 0 ? Object.keys(tableInfo[0]) : [];
    
    console.log('✅ Table accessible, columns found:', columns);

    // Check for specific resume columns
    const resumeColumns = [
      'last_video_id',
      'last_video_timestamp', 
      'last_video_title',
      'last_video_channel_id',
      'last_video_channel_name',
      'last_session_date',
      'resume_enabled'
    ];

    const missingColumns = resumeColumns.filter(col => !columns.includes(col));
    const existingColumns = resumeColumns.filter(col => columns.includes(col));

    return res.status(200).json({
      message: 'Schema check completed',
      totalColumns: columns.length,
      allColumns: columns,
      resumeColumns: {
        existing: existingColumns,
        missing: missingColumns,
        total: resumeColumns.length
      },
      sampleRow: tableInfo[0] || 'No data in table'
    });

  } catch (error) {
    console.error('❌ Schema check failed:', error);
    return res.status(500).json({ 
      message: 'Schema check failed',
      error: error.message 
    });
  }
}
