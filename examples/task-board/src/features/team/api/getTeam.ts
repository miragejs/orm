import type { Team } from '@shared/types';

export interface GetTeamResponse {
  team: Team;
}

/**
 * Fetch current user's team information
 */
export async function getTeam(): Promise<Team> {
  const response = await fetch('/api/teams/me', {
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Not authenticated');
    }
    throw new Error('Failed to fetch team');
  }

  const data: GetTeamResponse = await response.json();
  return data.team;
}
