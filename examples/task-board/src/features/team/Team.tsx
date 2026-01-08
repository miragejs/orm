import { Suspense } from 'react';
import { useLoaderData, Await } from 'react-router';
import { Box, Typography, Stack } from '@mui/material';
import { getTeam, getTeamMembers } from './api';
import {
  TeamInfoCard,
  TeamInfoCardSkeleton,
  ManagerCard,
  ManagerCardSkeleton,
  MembersTable,
  MembersTableSkeleton,
} from './components';
import type { LoaderFunctionArgs } from 'react-router';

/**
 * Team page loader - returns deferred promises for parallel loading
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  return {
    membersPromise: getTeamMembers(url.searchParams),
    teamPromise: getTeam(),
  };
}

/**
 * Team Page Component - Overview of current user's team
 * Uses deferred data loading with Suspense for optimal UX
 */
export default function Team() {
  const { teamPromise, membersPromise } = useLoaderData<typeof loader>();

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
        Team Details
      </Typography>

      <Stack spacing={3}>
        {/* Top row: Team Info and Manager cards */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3,
          }}
        >
          {/* Team Info Card */}
          <Box sx={{ flex: 1 }}>
            <Suspense fallback={<TeamInfoCardSkeleton />}>
              <Await resolve={teamPromise}>
                {(team) => <TeamInfoCard team={team} />}
              </Await>
            </Suspense>
          </Box>

          {/* Manager Card */}
          <Box sx={{ flex: 1 }}>
            <Suspense fallback={<ManagerCardSkeleton />}>
              <Await resolve={teamPromise}>
                {(team) => <ManagerCard manager={team.manager} />}
              </Await>
            </Suspense>
          </Box>
        </Box>

        {/* Members Table */}
        <Box>
          <Suspense fallback={<MembersTableSkeleton />}>
            <Await resolve={membersPromise}>
              {(data) => <MembersTable data={data} />}
            </Await>
          </Suspense>
        </Box>
      </Stack>
    </Box>
  );
}
