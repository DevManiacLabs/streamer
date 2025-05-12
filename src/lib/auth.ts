// Simple auth mechanism for demo purposes
// In a production app, use a proper authentication solution like NextAuth.js

interface User {
  id: string;
  username: string;
  name: string;
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