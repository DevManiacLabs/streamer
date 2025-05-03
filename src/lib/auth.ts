// Simple auth mechanism for demo purposes
// In a production app, use a proper authentication solution like NextAuth.js

interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'user';
}

// Mock admin user
const ADMIN_USER: User = {
  id: '1',
  username: 'admin',
  name: 'Admin User',
  role: 'admin',
};

// Simple hard-coded credentials for demo
// In a real app, use a database and proper password hashing
const ADMIN_PASSWORD = 'admin123';

export function authenticateUser(username: string, password: string): User | null {
  // Only allow the admin user in this demo
  if (username === ADMIN_USER.username && password === ADMIN_PASSWORD) {
    return ADMIN_USER;
  }
  return null;
}

// Store user in localStorage with expiry
export function setAuthUser(user: User): void {
  if (typeof window === 'undefined') return;
  
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 2); // 2 hour expiry
  
  localStorage.setItem('auth_user', JSON.stringify({
    user,
    expiresAt: expiresAt.toISOString(),
  }));
}

// Get the current authenticated user (if any)
export function getAuthUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  const authData = localStorage.getItem('auth_user');
  
  if (!authData) return null;
  
  try {
    const { user, expiresAt } = JSON.parse(authData);
    
    // Check if session has expired
    if (new Date(expiresAt) < new Date()) {
      localStorage.removeItem('auth_user');
      return null;
    }
    
    return user as User;
  } catch (e) {
    return null;
  }
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_user');
}

export function isAdmin(): boolean {
  const user = getAuthUser();
  return user?.role === 'admin';
} 