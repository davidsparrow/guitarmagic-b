// components/Header.js - Reusable Header Component with Conditional Icons
import { useRouter } from 'next/router'
import { IoMdPower } from "react-icons/io"
import { RiLogoutCircleRLine } from "react-icons/ri"
import { PiHamburger } from "react-icons/pi"
import { LuBrain } from "react-icons/lu"
import { FaSearch, FaTimes } from "react-icons/fa"
import { TbGuitarPick, TbGuitarPickFilled } from "react-icons/tb"
import { VscDebugRestart } from "react-icons/vsc"

export default function Header({ 
  showBrainIcon = false,
  showSearchIcon = false,
  logoImage = "/images/gt_logo_wide_on_black_450x90.png",
  // Search-specific props
  showSearchBar = false,
  showFavoritesToggle = false,
  showResumeButton = false,
  showSortDropdown = false,
  searchQuery = '',
  onSearchChange = () => {},
  onSearchSubmit = () => {},
  onFavoritesToggle = () => {},
  onResumeClick = () => {},
  onSortChange = () => {},
  sortOrder = 'relevance',
  showFavoritesOnly = false,
  savedSession = null,
  // Standard props
  onAuthClick,
  onMenuClick,
  isAuthenticated = false
}) {
  const router = useRouter()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-3 md:py-4 bg-black/80 md:bg-transparent">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
        {/* Row 1: Logo + Favorites (Left) + Auth Buttons (Right) - Mobile Only */}
        {showSearchBar && (
          <div className="flex md:hidden justify-between items-center w-full">
            {/* Left side: Logo + Favorites */}
            <div className="flex items-center space-x-2">
              <a 
                href="/?home=true" 
                className="hover:opacity-80 transition-opacity"
              >
                <img 
                  src={logoImage} 
                  alt="GuitarTube Logo" 
                  className="h-8 w-auto"
                />
              </a>
              
              {/* Favorites Icon */}
              {showFavoritesToggle && (
                <button
                  onClick={onFavoritesToggle}
                  className="p-2 rounded-lg transition-colors duration-300 mr-1"
                  title={showFavoritesOnly ? "Show All Videos" : "Show Favorites Only"}
                >
                  {showFavoritesOnly ? (
                    <TbGuitarPickFilled className="w-6 h-6 text-[#8dc641]" />
                  ) : (
                    <TbGuitarPick className="w-6 h-6 text-[#8dc641]" />
                  )}
                </button>
              )}
            </div>

            {/* Right side buttons - Mobile */}
            <div className="flex items-center space-x-1">
              {/* Brain Icon Button - Conditional */}
              {showBrainIcon && (
                <button
                  onClick={() => router.push('/features')}
                  className="p-2 rounded-lg transition-colors duration-300 relative group text-white hover:bg-white/10"
                  title="GuitarTube Features"
                >
                  <LuBrain className="w-5 h-5 group-hover:text-yellow-400 transition-colors" />
                </button>
              )}
              
              {/* Search Icon Button - Conditional */}
              {showSearchIcon && (
                <button
                  onClick={() => router.push('/search')}
                  className="p-2 rounded-lg transition-colors duration-300 relative group text-white hover:bg-white/10"
                  title="Search Videos"
                >
                  <svg className="w-5 h-5 group-hover:text-yellow-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              )}
              
              {/* Resume Video Button - Conditional based on savedSession */}
              {showResumeButton && savedSession && savedSession.last_video_id && (
                <button
                  onClick={onResumeClick}
                  className="p-2 rounded-lg transition-colors duration-300 relative group text-white hover:bg-white/10"
                  title="Resume Last Video"
                >
                  <VscDebugRestart className="w-6 h-6 group-hover:text-yellow-400 transition-colors" />
                </button>
              )}
              
              {/* Login/Logout Icon */}
              <button 
                onClick={onAuthClick}
                className="p-[7px] rounded-lg transition-colors duration-300 relative group text-white hover:bg-white/10"
                title={isAuthenticated ? "End of the Party" : "Start Me Up"}
              >
                {isAuthenticated ? (
                  <RiLogoutCircleRLine className="w-[21.5px] h-[21.5px] group-hover:text-yellow-400 transition-colors" />
                ) : (
                  <IoMdPower className="w-[21.5px] h-[21.5px] group-hover:text-yellow-400 transition-colors" />
                )}
              </button>
              
              {/* Menu Icon */}
              <button 
                onClick={onMenuClick}
                className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors group relative"
                title="Yummy!"
              >
                <PiHamburger className="w-5 h-5 group-hover:text-yellow-400 transition-colors" />
              </button>
            </div>
          </div>
        )}

        {/* Row 2: Search Bar - Mobile Only */}
        {showSearchBar && (
          <div className="flex md:hidden w-full">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && onSearchSubmit()}
                placeholder="how to play guitar"
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 border border-white/20 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all text-sm pr-20"
                style={{ borderRadius: '77px' }}
              />
              
              {/* Clear button - positioned to the left of search icon */}
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-11 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white hover:scale-110 transition-all duration-200 p-1 rounded-full hover:bg-white/10"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              )}
              
              {/* Search button - positioned on the right */}
              <button
                onClick={onSearchSubmit}
                disabled={!searchQuery.trim()}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white hover:scale-110 transition-all duration-200 p-1.5 rounded-lg hover:bg-white/10"
              >
                <FaSearch className="w-4 h-4" />
              </button>
              
            </div>
          </div>
        )}

        {/* Row 3: Sort Dropdown - Mobile Only */}
        {showSearchBar && showSortDropdown && (
          <div className="flex md:hidden w-full">
            <div className="relative group w-full">
              <select
                value={sortOrder}
                onChange={(e) => onSortChange(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm text-white border border-white/20 px-4 py-2 appearance-none cursor-pointer hover:border-yellow-400 hover:bg-white/15 transition-all duration-200 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-sm"
                title="Sort affects new searches only"
                style={{ borderRadius: '77px' }}
              >
                <option value="relevance" className="bg-black text-white">Relevance</option>
                <option value="date" className="bg-black text-white">Date</option>
                <option value="rating" className="bg-black text-white">Rating</option>
                <option value="title" className="bg-black text-white">Title</option>
                <option value="viewCount" className="bg-black text-white">Views</option>
              </select>
              
              {/* Custom dropdown arrow */}
              <div className="absolute right-3 top-1/2 transform -translate-x-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Layout - Hidden on Mobile */}
        {showSearchBar && (
          <div className="hidden md:flex items-center space-x-4">
            {/* Logo and Favorites Icon */}
            <div className="flex items-center space-x-2">
              <a 
                href="/?home=true" 
                className="hover:opacity-80 transition-opacity"
              >
                <img 
                  src={logoImage} 
                  alt="GuitarTube Logo" 
                  className="h-10 w-auto"
                />
              </a>
              
              {/* Favorites Icon */}
              {showFavoritesToggle && (
                <button
                  onClick={onFavoritesToggle}
                  className="p-2 rounded-lg transition-colors duration-300"
                  title={showFavoritesOnly ? "Show All Videos" : "Show Favorites Only"}
                >
                  {showFavoritesOnly ? (
                    <TbGuitarPickFilled className="w-8 h-8 text-[#8dc641]" />
                  ) : (
                    <TbGuitarPick className="w-8 h-8 text-[#8dc641]" />
                  )}
                </button>
              )}

              {/* Search Bar - Positioned BETWEEN logo/favorites and sort dropdown */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && onSearchSubmit()}
                  placeholder="how to play guitar"
                  className="w-96 px-4 py-2 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 border border-white/20 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all text-sm pr-20"
                  style={{ borderRadius: '77px' }}
                />
                
                {/* Clear button - positioned to the left of search icon */}
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-11 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white hover:scale-110 transition-all duration-200 p-1 rounded-full hover:bg-white/10"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                )}
                
                {/* Search button - positioned on the right */}
                <button
                  onClick={onSearchSubmit}
                  disabled={!searchQuery.trim()}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white hover:scale-110 transition-all duration-200 p-1.5 rounded-lg hover:bg-white/10"
                >
                  <FaSearch className="w-4 h-4" />
                  </button>
                
              </div>

              {/* Sort Dropdown */}
              {showSortDropdown && (
                <div className="relative group">
                  <select
                    value={sortOrder}
                    onChange={(e) => onSortChange(e.target.value)}
                    className="bg-white/10 backdrop-blur-sm text-white border border-white/20 px-4 py-2 appearance-none cursor-pointer hover:border-yellow-400 hover:bg-white/15 transition-all duration-200 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-sm"
                    title="Sort affects new searches only"
                    style={{ borderRadius: '77px' }}
                  >
                    <option value="relevance" className="bg-black text-white">Relevance</option>
                    <option value="date" className="bg-black text-white">Date</option>
                    <option value="rating" className="bg-black text-white">Rating</option>
                    <option value="title" className="bg-black text-white">Title</option>
                    <option value="viewCount" className="bg-black text-white">Views</option>
                  </select>
                  
                  {/* Custom dropdown arrow */}
                  <div className="absolute right-3 top-1/2 transform -translate-x-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20 shadow-lg">
                    Sort affects new searches only
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Standard Header Layout (when not showing search features) */}
        {!showSearchBar && (
          <div className="flex justify-between items-center w-full">
            {/* Logo - Upper Left - Customizable */}
            <a 
              href="/?home=true" 
              className="hover:opacity-80 transition-opacity"
            >
              <img 
                src={logoImage} 
                alt="GuitarTube Logo" 
                className="h-8 md:h-10 w-auto" // Mobile: h-8, Desktop: h-10
              />
            </a>
            
            {/* Right side buttons */}
            <div className="flex items-center space-x-1 md:space-x-2"> {/* Mobile: space-x-1, Desktop: space-x-2 */}
              {/* Brain Icon Button - Conditional */}
              {showBrainIcon && (
                <button
                  onClick={() => router.push('/features')}
                  className="p-2 rounded-lg transition-colors duration-300 relative group text-white hover:bg-white/10"
                  title="GuitarTube Features"
                >
                  <LuBrain className="w-5 h-5 group-hover:text-yellow-400 transition-colors" />
                </button>
              )}
              
              {/* Search Icon Button - Conditional */}
              {showSearchIcon && (
                <button
                  onClick={() => router.push('/search')}
                  className="p-2 rounded-lg transition-colors duration-300 relative group text-white hover:bg-white/10"
                  title="Search Videos"
                >
                  <svg className="w-5 h-5 group-hover:text-yellow-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              )}
              
              {/* Resume Video Button - Conditional based on savedSession */}
              {showResumeButton && savedSession && savedSession.last_video_id && (
                <button
                  onClick={onResumeClick}
                  className="p-2 rounded-lg transition-colors duration-300 relative group text-white hover:bg-white/10"
                  title="Resume Last Video"
                >
                  <VscDebugRestart className="w-6 h-6 group-hover:text-yellow-400 transition-colors" />
                </button>
              )}
              
              {/* Login/Logout Icon */}
              <button 
                onClick={onAuthClick}
                className="p-[7px] rounded-lg transition-colors duration-300 relative group text-white hover:bg-white/10"
                title={isAuthenticated ? "End of the Party" : "Start Me Up"}
              >
                {isAuthenticated ? (
                  <RiLogoutCircleRLine className="w-[21.5px] h-[21.5px] group-hover:text-yellow-400 transition-colors" />
                ) : (
                  <IoMdPower className="w-[21.5px] h-[21.5px] group-hover:text-yellow-400 transition-colors" />
                )}
              </button>
              
              {/* Menu Icon */}
              <button 
                onClick={onMenuClick}
                className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors group relative"
                title="Yummy!"
              >
                <PiHamburger className="w-5 h-5 group-hover:text-yellow-400 transition-colors" />
              </button>
            </div>
          </div>
        )}

        {/* Right side buttons - ALWAYS show when in search mode */}
        {showSearchBar && (
          <div className="hidden md:flex items-center space-x-2">
            {/* Brain Icon Button - Conditional */}
            {showBrainIcon && (
              <button
                onClick={() => router.push('/features')}
                className="p-2 rounded-lg transition-colors duration-300 relative group text-white hover:bg-white/10"
                title="GuitarTube Features"
              >
                <LuBrain className="w-5 h-5 group-hover:text-yellow-400 transition-colors" />
              </button>
            )}
            
            {/* Search Icon Button - Conditional */}
            {showSearchIcon && (
              <button
                onClick={() => router.push('/search')}
                className="p-2 rounded-lg transition-colors duration-300 relative group text-white hover:bg-white/10"
                title="Search Videos"
              >
                <svg className="w-5 h-5 group-hover:text-yellow-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )}
            
            {/* Resume Video Button - Conditional based on savedSession */}
            {showResumeButton && savedSession && savedSession.last_video_id && (
              <button
                onClick={onResumeClick}
                className="p-2 rounded-lg transition-colors duration-300 relative group text-white hover:bg-white/10"
                title="Resume Last Video"
              >
                <VscDebugRestart className="w-6 h-6 group-hover:text-yellow-400 transition-colors" />
              </button>
            )}
            
            {/* Login/Logout Icon */}
            <button 
              onClick={onAuthClick}
              className="p-[7px] rounded-lg transition-colors duration-300 relative group text-white hover:bg-white/10"
              title={isAuthenticated ? "End of the Party" : "Start Me Up"}
            >
              {isAuthenticated ? (
                <RiLogoutCircleRLine className="w-[21.5px] h-[21.5px] group-hover:text-yellow-400 transition-colors" />
              ) : (
                <IoMdPower className="w-[21.5px] h-[21.5px] group-hover:text-yellow-400 transition-colors" />
              )}
            </button>
            
            {/* Menu Icon */}
            <button 
              onClick={onMenuClick}
              className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors group relative"
              title="Yummy!"
            >
              <PiHamburger className="w-5 h-5 group-hover:text-yellow-400 transition-colors" />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
