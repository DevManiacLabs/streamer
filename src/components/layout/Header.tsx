'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { UserMenu } from '@/components/auth/UserMenu';
import { ROUTE_CONFIG } from '@/lib/config';
import { usePathname } from 'next/navigation';

/**
 * Navigation link component with consistent styling
 */
const NavLink = ({ href, children, onClick, isMobile = false }: { 
  href: string; 
  children: React.ReactNode;
  onClick?: () => void;
  isMobile?: boolean;
}) => (
  <Link
    href={href}
    className={`text-sm font-medium ${
      isMobile 
        ? "text-white block w-full py-3 px-4 hover:bg-gray-700" 
        : "text-gray-200 hover:text-white transition-colors"
    }`}
    onClick={onClick}
  >
    {children}
  </Link>
);

/**
 * Menu icon for mobile navigation
 */
const MenuIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

/**
 * Header component with navigation and user controls
 */
export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobileMenuOpen && 
        menuRef.current && 
        buttonRef.current && 
        !menuRef.current.contains(event.target as Node) && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);
  
  // Close menu when navigating
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };
  
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 w-full z-40 transition-all duration-300 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link href={ROUTE_CONFIG.HOME} className="text-2xl font-bold text-red-600">
            FreeFlix
          </Link>
          
          {/* Main Navigation - desktop only */}
          <div className="hidden md:flex items-center space-x-6">
            <NavLink href={ROUTE_CONFIG.HOME}>Home</NavLink>
            <NavLink href={ROUTE_CONFIG.MOVIES.LIST}>Movies</NavLink>
            <NavLink href={ROUTE_CONFIG.TV.LIST}>TV Shows</NavLink>
            <NavLink href={ROUTE_CONFIG.USER.WATCH_HISTORY}>Watch History</NavLink>
          </div>
          
          {/* Search and User Controls */}
          <div className="flex items-center gap-4">
            <SearchBar />
            <UserMenu />
            
            {/* Mobile Menu Button */}
            <div className="relative md:hidden">
              <button 
                ref={buttonRef}
                className="flex items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-gray-600" 
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
                aria-haspopup="true"
                onClick={toggleMobileMenu}
              >
                <MenuIcon />
              </button>
              
              {/* Mobile Dropdown Menu */}
              {isMobileMenuOpen && (
                <div 
                  ref={menuRef}
                  className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="menu-button"
                >
                  <NavLink href={ROUTE_CONFIG.HOME} onClick={closeMobileMenu} isMobile>
                    Home
                  </NavLink>
                  <NavLink href={ROUTE_CONFIG.MOVIES.LIST} onClick={closeMobileMenu} isMobile>
                    Movies
                  </NavLink>
                  <NavLink href={ROUTE_CONFIG.TV.LIST} onClick={closeMobileMenu} isMobile>
                    TV Shows
                  </NavLink>
                  <NavLink href={ROUTE_CONFIG.USER.WATCH_HISTORY} onClick={closeMobileMenu} isMobile>
                    Watch History
                  </NavLink>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
} 