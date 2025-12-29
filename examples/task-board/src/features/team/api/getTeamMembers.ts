import { buildTableQuery } from '@shared/utils';
import type { TableParams } from '@shared/utils';
import type { TeamMember } from '@shared/types';

export type SortableColumn = 'name' | 'role' | 'email';

export type GetTeamMembersParams = TableParams<SortableColumn>;

export interface GetTeamMembersResponse extends GetTeamMembersParams {
  members: TeamMember[];
  total: number;
}

/** Default pagination/sorting params */
export const defaultMembersParams: GetTeamMembersParams = {
  page: 0,
  pageSize: 5,
  sortBy: 'name',
  sortOrder: 'asc',
};

/**
 * Fetch current user's team members with pagination and sorting
 */
export async function getTeamMembers(
  params: GetTeamMembersParams = defaultMembersParams,
): Promise<GetTeamMembersResponse> {
  const searchParams = buildTableQuery(params);

  const response = await fetch(`/api/teams/me/members?${searchParams}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Not authenticated');
    }
    throw new Error('Failed to fetch team members');
  }

  return response.json();
}
