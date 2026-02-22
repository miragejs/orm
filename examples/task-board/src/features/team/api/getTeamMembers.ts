import type { TableParams } from '@shared/utils';
import type { MemberSortableColumn, UserInfo } from '@shared/types';

export interface GetTeamMembersResponse extends TableParams<MemberSortableColumn> {
  members: UserInfo[];
  total: number;
}

/**
 * Fetch current user's team members with pagination and sorting
 * @param searchParams - URL search params string or URLSearchParams object
 */
export async function getTeamMembers(
  searchParams?: string | URLSearchParams,
): Promise<GetTeamMembersResponse> {
  const query = searchParams?.toString() || '';
  const response = await fetch(`/api/teams/me/members?${query}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Not authenticated');
    }
    throw new Error('Failed to fetch team members');
  }

  const data: GetTeamMembersResponse = await response.json();
  return data;
}
