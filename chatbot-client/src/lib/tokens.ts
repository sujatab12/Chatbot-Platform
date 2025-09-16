// Token management utility that works with both localStorage and cookies
// This bridges the gap between the new UI (localStorage) and existing server (cookies)

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Try localStorage first (new UI approach)
  const localToken = localStorage.getItem('auth_token');
  if (localToken) return localToken;
  
  // Fallback to cookie (existing approach)
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken='));
  if (tokenCookie) {
    return tokenCookie.split('=')[1];
  }
  
  return null;
}

export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  
  // Store in localStorage (new UI approach)
  localStorage.setItem('auth_token', token);
  
  // Also set cookie for server compatibility
  document.cookie = `accessToken=${token}; path=/; max-age=900; secure; samesite=lax`;
}

export function removeAccessToken(): void {
  if (typeof window === 'undefined') return;
  
  // Remove from localStorage
  localStorage.removeItem('auth_token');
  
  // Remove cookie
  document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}
