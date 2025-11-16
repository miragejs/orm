/**
 * Get User API
 */

import type { User } from '@shared/types';

export interface GetUserResponse {
  user: User;
}

/**
 * Get current authenticated user
 */
export async function getUser(): Promise<User> {
  const response = await fetch('/api/users/me', {
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Not authenticated');
    }
    throw new Error('Failed to fetch user');
  }

  const data: GetUserResponse = await response.json();
  return data.user;
}
