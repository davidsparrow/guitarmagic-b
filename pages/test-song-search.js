// 🧪 Test Page for SongSearchDropdown Component
// Tests the component without touching existing UI pages

import React, { useState } from 'react';
import SongSearchDropdown from '../components/SongSearchDropdown';

const TestSongSearch = () => {
  const [selectedSong, setSelectedSong] = useState(null);

  const handleSongSelect = (song) => {
    setSelectedSong(song);
    console.log('Selected song:', song);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 SongSearchDropdown Test Page
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test the Component</h2>
          <SongSearchDropdown 
            onSongSelect={handleSongSelect}
            placeholder="Search for songs like 'Wonderwall' or 'Hotel California'..."
          />
        </div>

        {selectedSong && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              ✅ Song Selected!
            </h3>
            <div className="text-green-700">
              <p><strong>Title:</strong> {selectedSong.song_title}</p>
              <p><strong>Artist:</strong> {selectedSong.artist_name}</p>
              <p><strong>Genre:</strong> {selectedSong.genre || 'N/A'}</p>
              <p><strong>Difficulty:</strong> {selectedSong.difficulty || 'N/A'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestSongSearch;
