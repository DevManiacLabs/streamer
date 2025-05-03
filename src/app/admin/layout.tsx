'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { logout, getAuthUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Check if the current page is the login page
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    const user = getAuthUser();
    if (user) {
      setUserName(user.name);
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  // If it's the login page, just render the children without the sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  // For all other admin pages, render with the admin layout
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
      )}
      
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-md transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-center border-b dark:border-gray-700">
          <h1 className="text-lg font-semibold">FreeFlix Admin</h1>
        </div>
        
        <nav className="mt-6 px-4 space-y-1">
          <Link 
            href="/admin/dashboard" 
            className={`flex items-center px-4 py-2 text-sm rounded-md ${
              pathname === '/admin/dashboard' 
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="ml-3">Dashboard</span>
          </Link>
          
          <Link 
            href="/admin/movies" 
            className={`flex items-center px-4 py-2 text-sm rounded-md ${
              pathname === '/admin/movies' 
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="ml-3">Movies</span>
          </Link>
          
          <Link 
            href="/admin/tvshows" 
            className={`flex items-center px-4 py-2 text-sm rounded-md ${
              pathname === '/admin/tvshows' 
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="ml-3">TV Shows</span>
          </Link>
          
          <Link 
            href="/admin/settings" 
            className={`flex items-center px-4 py-2 text-sm rounded-md ${
              pathname === '/admin/settings' 
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="ml-3">Settings</span>
          </Link>
        </nav>
        
        <div className="absolute bottom-0 w-full border-t dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">{userName}</div>
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="h-16 px-4 flex items-center justify-between">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <span className="sr-only">Open sidebar</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            
            <div>
              <Link
                href="/"
                className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Website
              </Link>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
} 