/**
 * Logout API
 */

export interface LogoutResponse {
  success: boolean;
}

/**
 * Logout current user
 */
export async function logout(): Promise<LogoutResponse> {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Logout failed');
  }

  return response.json();
}
