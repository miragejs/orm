/**
 * Login API
 */

import type { User } from '@shared/types';

export interface LoginResponse {
  user: User;
}

/**
 * Login user by email
 */
export async function login(email: string): Promise<LoginResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  return response.json();
}
