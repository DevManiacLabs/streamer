'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [name, setName] = useState(session?.user?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto bg-zinc-900 rounded-lg shadow p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-zinc-800 rounded w-1/4"></div>
            <div className="h-8 bg-zinc-800 rounded w-1/2"></div>
            <div className="h-4 bg-zinc-800 rounded"></div>
            <div className="h-4 bg-zinc-800 rounded"></div>
            <div className="h-12 bg-zinc-800 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // TODO: Implement profile update API
      // For now, just update the session
      await update({ name });
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto bg-zinc-900 rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold mb-8 text-white">Your Profile</h1>
        
        {message && (
          <div className={`mb-6 p-4 rounded ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
            {message.text}
          </div>
        )}
        
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white text-2xl font-medium">
              {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 className="text-xl font-medium">{session?.user?.name || 'User'}</h2>
              <p className="text-gray-400">{session?.user?.email}</p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-700 rounded-md bg-zinc-800 text-white placeholder-gray-500 focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              disabled
              value={session?.user?.email || ''}
              className="appearance-none block w-full px-3 py-2 border border-gray-700 rounded-md bg-zinc-800 text-gray-400 focus:outline-none cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full md:w-auto flex justify-center py-2 px-8 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
        
        <div className="mt-12 pt-8 border-t border-gray-800">
          <h3 className="text-xl font-bold mb-6">Your Activity</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/favorites"
              className="bg-zinc-800 hover:bg-zinc-700 transition-colors p-6 rounded-lg flex flex-col"
            >
              <div className="text-2xl mb-2">🎬</div>
              <h4 className="font-medium mb-1">My List</h4>
              <p className="text-sm text-gray-400">View your saved movies and TV shows</p>
            </Link>
            
            <Link
              href="/watch-history"
              className="bg-zinc-800 hover:bg-zinc-700 transition-colors p-6 rounded-lg flex flex-col"
            >
              <div className="text-2xl mb-2">⏱️</div>
              <h4 className="font-medium mb-1">Watch History</h4>
              <p className="text-sm text-gray-400">See what you've watched recently</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 