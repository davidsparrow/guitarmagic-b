// 🎸 SongSearchDropdown Component
// Allows users to search and select songs from the UG database

import React, { useState, useCallback, useRef } from 'react';
import { Search, Music, User, Calendar, Guitar } from 'lucide-react';

// Component structure
const SongSearchDropdown = ({ onSongSelect, placeholder = "Search for a song..." }) => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Search function implementation
  const handleSearch = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setIsOpen(false);
      setHasSearched(false); // Reset search status
      setError(null);
      return;
    }

    setIsSearching(true);
    setHasSearched(false); // Reset search status
    setError(null);
    try {
      const response = await fetch(`/api/chord-captions/songs/search?q=${encodeURIComponent(query)}&limit=10`);
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        setIsOpen(true);
        setHasSearched(true);
      } else {
        console.error('Search failed:', response.status);
        setSearchResults([]);
        setError('Failed to fetch search results.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setError('An error occurred during search.');
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Song selection handler
  const handleSongSelect = useCallback((song) => {
    setSelectedSong(song);
    setIsOpen(false);
    setSearchTerm(`${song.song_title} - ${song.artist_name}`);
    onSongSelect?.(song);
  }, [onSongSelect]);

  // Search on input change with debounce
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Simple debounce - search after 300ms of no typing
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  }, [handleSearch]);

  // Add searchTimeout ref
  const searchTimeout = useRef(null);

  // Add inputRef
  const inputRef = useRef(null);

  // Handle key down for accessibility
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      e.preventDefault();
      handleSongSelect(searchResults[0]);
    }
  }, [searchResults, handleSongSelect]);

  return (
    <div className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => searchResults.length > 0 && setIsOpen(true)}
          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
          aria-label="Search for songs"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
          {error}
        </div>
      )}
      
      {/* Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((song) => (
              <div
                key={song.song_id}
                className="p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                onClick={() => handleSongSelect(song)}
              >
                <div className="font-semibold text-gray-900">{song.song_title}</div>
                <div className="text-sm text-gray-600">{song.artist_name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {song.genre && `${song.genre} • `}
                  {song.difficulty && `${song.difficulty} • `}
                  {song.year && song.year}
                </div>
              </div>
            ))
          ) : hasSearched ? (
            <div className="p-4 text-center text-gray-500">
              No songs found. Try a different search term.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SongSearchDropdown;
