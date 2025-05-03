'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

// Loading fallback component
function LoginSkeleton() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-6 sm:px-6 lg:px-8 bg-black">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-3xl font-bold text-red-600 mb-6">
          FreeFlix
        </div>
        <div className="h-8 bg-zinc-800 rounded w-48 mx-auto mb-4 animate-pulse"></div>
        <div className="h-4 bg-zinc-800 rounded w-36 mx-auto animate-pulse"></div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 py-8 px-6 rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <div className="h-4 bg-zinc-800 rounded w-24 mb-2 animate-pulse"></div>
              <div className="h-10 bg-zinc-800 rounded w-full animate-pulse"></div>
            </div>

            <div>
              <div className="h-4 bg-zinc-800 rounded w-24 mb-2 animate-pulse"></div>
              <div className="h-10 bg-zinc-800 rounded w-full animate-pulse"></div>
            </div>

            <div className="h-10 bg-zinc-800 rounded w-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inner login component with params access
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const error = searchParams.get("error");
  const registered = searchParams.get("registered");
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle various URL parameters and session state
  useEffect(() => {
    if (error === 'CredentialsSignin') {
      setErrorMessage('Invalid email or password');
    } else if (error) {
      setErrorMessage(error);
    }

    if (registered === 'true') {
      setSuccessMessage('Registration successful! Please sign in.');
    }

    // If already authenticated, redirect to home
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [error, registered, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl: callbackUrl as string
      });

      if (result?.error) {
        setErrorMessage(result.error === 'CredentialsSignin' 
          ? 'Invalid email or password' 
          : result.error);
        setIsLoading(false);
      } else if (result?.url) {
        // Add a small delay to show loading state
        setTimeout(() => {
          if (result.url) {
            router.push(result.url);
            router.refresh();
          } else {
            router.push('/');
            router.refresh();
          }
        }, 500);
      } else {
        setErrorMessage('Login failed. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  // For development only - show the test login button
  const handleTestLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: 'test@example.com',
        password: 'password',
      });
      
      if (result?.url) {
        router.push(result.url);
        router.refresh();
      } else {
        setErrorMessage('Test login failed');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Test login error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-6 sm:px-6 lg:px-8 bg-black">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center text-3xl font-bold text-red-600 mb-6">
          FreeFlix
        </Link>
        <h2 className="text-center text-3xl font-extrabold text-white">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Or{' '}
          <Link href="/signup" className="font-medium text-red-600 hover:text-red-500">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 py-8 px-6 rounded-lg sm:px-10">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-500 text-sm">
              {errorMessage}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded text-green-500 text-sm">
              {successMessage}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-700 rounded-md bg-zinc-800 text-white placeholder-gray-500 focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-700 rounded-md bg-zinc-800 text-white placeholder-gray-500 focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-600 rounded bg-zinc-800"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-red-600 hover:text-red-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-xs text-gray-500 mb-2">Development Testing</p>
              <button
                onClick={handleTestLogin}
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-transparent hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Use Test Account
              </button>
              <p className="mt-2 text-xs text-gray-500">
                Email: test@example.com<br/>
                Password: password
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main export with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginContent />
    </Suspense>
  );
} 