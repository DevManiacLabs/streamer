'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthUser, isAdmin } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  adminOnly = false
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const user = getAuthUser();
    
    if (!user) {
      router.push('/admin/login');
      return;
    }
    
    // If admin only, check if user is admin
    if (adminOnly && !isAdmin()) {
      router.push('/admin/login?unauthorized=true');
      return;
    }
    
    setIsAuthorized(true);
    setIsLoading(false);
  }, [router, adminOnly]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
          <p>Checking authorization...</p>
        </div>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
} 