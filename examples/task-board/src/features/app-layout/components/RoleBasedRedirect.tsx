import { Navigate, useRouteLoaderData } from 'react-router';
import { isManager } from '@shared/utils';
import type { User } from '@shared/types';

/**
 * RoleBasedRedirect Component - Redirects users to appropriate route based on role
 * - Managers → /{teamName}/dashboard
 * - Users → /{teamName}/users/{userId}
 */
export default function RoleBasedRedirect() {
  const user = useRouteLoaderData<User>('root')!;
  const teamSlug = user.team.slug;

  if (isManager(user)) {
    return <Navigate to={`/${teamSlug}/dashboard`} replace />;
  }

  return <Navigate to={`/${teamSlug}/users/${user.id}`} replace />;
}
