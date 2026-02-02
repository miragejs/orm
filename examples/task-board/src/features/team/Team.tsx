import { Suspense } from 'react';
import { useLoaderData, Await, useAsyncError } from 'react-router';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getTeam, getTeamMembers } from './api';
import {
  TeamInfoCard,
  TeamInfoCardSkeleton,
  TeamInfoCardError,
  ManagerCard,
  ManagerCardSkeleton,
  ManagerCardError,
  MembersTable,
  MembersTableSkeleton,
  MembersTableError,
} from './components';
import type { LoaderFunctionArgs } from 'react-router';

function TeamInfoErrorBoundary() {
  const error = useAsyncError() as Error;
  return <TeamInfoCardError error={error} />;
}

function ManagerErrorBoundary() {
  const error = useAsyncError() as Error;
  return <ManagerCardError error={error} />;
}

function MembersErrorBoundary() {
  const error = useAsyncError() as Error;
  return <MembersTableError error={error} />;
}

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
              <Await resolve={teamPromise} errorElement={<TeamInfoErrorBoundary />}>
                {(team) => <TeamInfoCard team={team} />}
              </Await>
            </Suspense>
          </Box>

          {/* Manager Card */}
          <Box sx={{ flex: 1 }}>
            <Suspense fallback={<ManagerCardSkeleton />}>
              <Await resolve={teamPromise} errorElement={<ManagerErrorBoundary />}>
                {(team) => <ManagerCard manager={team.manager} />}
              </Await>
            </Suspense>
          </Box>
        </Box>

        {/* Members Table */}
        <Box>
          <Suspense fallback={<MembersTableSkeleton />}>
            <Await resolve={membersPromise} errorElement={<MembersErrorBoundary />}>
              {(data) => <MembersTable data={data} />}
            </Await>
          </Suspense>
        </Box>
      </Stack>
    </Box>
  );
}
