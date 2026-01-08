import kebabCase from 'lodash.kebabcase';
import { Navigate, useRouteLoaderData } from 'react-router';
import { UserRole } from '@shared/types';
import type { AppLoaderData } from '../AppLayout';

/**
 * RoleBasedRedirect Component - Redirects users to appropriate route based on role
 * - Managers → /{teamName}/dashboard
 * - Users → /{teamName}/users/{userId}
 */
export default function RoleBasedRedirect() {
  const { user } = useRouteLoaderData('root') as AppLoaderData;
  const teamSlug = kebabCase(user.team.name);

  if (user.role === UserRole.MANAGER) {
    return <Navigate to={`/${teamSlug}/dashboard`} replace />;
  }

  return <Navigate to={`/${teamSlug}/users/${user.id}`} replace />;
}
