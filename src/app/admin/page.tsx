'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export default function AdminPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/refresh');
      if (!response.ok) {
        throw new Error('Failed to refresh content');
      }
      
      // Invalidate all queries to force a refetch
      await queryClient.invalidateQueries();
      
      alert('Content refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing content:', error);
      alert('Failed to refresh content');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="bg-gray-900 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Content Management</h2>
        
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRefreshing ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Refreshing...
            </>
          ) : (
            'Refresh Content'
          )}
        </button>
        
        <p className="mt-2 text-sm text-gray-400">
          This will refresh the content cache and remove unavailable items.
        </p>
      </div>
    </div>
  );
} 