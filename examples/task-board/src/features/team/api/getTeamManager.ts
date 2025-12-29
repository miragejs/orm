import type { TeamMember } from '@shared/types';

export interface GetTeamManagerResponse {
  manager: TeamMember | null;
}

/**
 * Fetch current user's team manager
 */
export async function getTeamManager(): Promise<TeamMember | null> {
  const response = await fetch('/api/teams/me/manager', {
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Not authenticated');
    }
    throw new Error('Failed to fetch team manager');
  }

  const data: GetTeamManagerResponse = await response.json();
  return data.manager;
}
