import type { TaskStatistics } from '@shared/types';

export interface GetTaskStatisticsResponse {
  statistics: TaskStatistics;
}

/**
 * Fetch task statistics aggregated by date for the current user's team
 */
export async function getTaskStatistics(): Promise<GetTaskStatisticsResponse> {
  const response = await fetch('/api/teams/me/statistics');

  if (!response.ok) {
    throw new Error('Failed to fetch task statistics');
  }

  const data: GetTaskStatisticsResponse = await response.json();
  return data;
}
