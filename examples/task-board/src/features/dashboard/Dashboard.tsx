import { Suspense } from 'react';
import { useLoaderData, Await, Outlet } from 'react-router';
import { Box, Typography, Stack, Skeleton, Card, CardContent } from '@mui/material';
import { getTaskStatistics, getTeamTasks } from './api';
import { getTeam } from '@features/team/api';
import { TeamInfoCard, TeamInfoCardSkeleton } from '@features/team/components';
import { TaskStatisticsChart, TasksTable, TeamStatsCard } from './components';
import type { LoaderFunctionArgs } from 'react-router';

/**
 * Dashboard loader - fetches team info, statistics, and team tasks
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  return {
    statisticsPromise: getTaskStatistics(),
    tasksPromise: getTeamTasks(url.searchParams),
    teamPromise: getTeam(),
  };
}

/**
 * Chart Loading Skeleton
 */
function ChartSkeleton() {
  return (
    <Card>
      <CardContent>
        <Skeleton variant="text" width={120} height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={280} />
      </CardContent>
    </Card>
  );
}

/**
 * Team Stats Loading Skeleton
 */
function TeamStatsSkeleton() {
  return (
    <Card>
      <CardContent>
        <Skeleton variant="text" width={150} height={32} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width={80} height={40} />
            <Skeleton variant="text" width={80} height={40} />
          </Box>
          <Box sx={{ flex: 2 }}>
            <Skeleton variant="text" width={200} />
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rounded" width={80} height={24} />
              ))}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

/**
 * Table Loading Skeleton
 */
function TableSkeleton() {
  return (
    <Card>
      <CardContent>
        <Skeleton variant="text" width={180} height={32} sx={{ mb: 2 }} />
        <Stack spacing={1}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rectangular" height={52} />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

/**
 * Dashboard Component - Overview with team info, statistics, and tasks table
 */
export default function Dashboard() {
  const { teamPromise, statisticsPromise, tasksPromise } = useLoaderData<typeof loader>();

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
        Dashboard
      </Typography>

      <Stack spacing={3}>
        {/* Top row: Team Info and Team Stats cards */}
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

          {/* Team Stats Card with Members Preview */}
          <Box sx={{ flex: 1 }}>
            <Suspense fallback={<TeamStatsSkeleton />}>
              <Await resolve={teamPromise}>
                {(data) => (
                  <TeamStatsCard members={data.members} taskCount={data.taskIds.length} />
                )}
              </Await>
            </Suspense>
          </Box>
        </Box>

        {/* Statistics Chart */}
        <Suspense fallback={<ChartSkeleton />}>
          <Await resolve={statisticsPromise}>
            {(data) => <TaskStatisticsChart statistics={data.statistics} />}
          </Await>
        </Suspense>

        {/* Tasks Table */}
        <Suspense fallback={<TableSkeleton />}>
          <Await resolve={tasksPromise}>{(data) => <TasksTable data={data} />}</Await>
        </Suspense>
      </Stack>

      {/* Task Details Outlet */}
      <Outlet />
    </Box>
  );
}
