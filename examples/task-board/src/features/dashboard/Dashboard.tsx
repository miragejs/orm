import { Suspense } from 'react';
import { useLoaderData, Await, Outlet } from 'react-router';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getTaskStatistics, getTeamTasks } from './api';
import { getTeam } from '@features/team/api';
import { TeamInfoCard, TeamInfoCardSkeleton } from '@features/team/components';
import {
  TaskStatsChart,
  TaskStatsChartSkeleton,
  TasksTable,
  TasksTableSkeleton,
  TeamStatsCard,
  TeamStatsCardSkeleton,
} from './components';
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
            <Suspense fallback={<TeamStatsCardSkeleton />}>
              <Await resolve={teamPromise}>
                {(data) => (
                  <TeamStatsCard members={data.members} taskCount={data.taskIds.length} />
                )}
              </Await>
            </Suspense>
          </Box>
        </Box>

        {/* Statistics Chart */}
        <Suspense fallback={<TaskStatsChartSkeleton />}>
          <Await resolve={statisticsPromise}>
            {(data) => <TaskStatsChart statistics={data.statistics} />}
          </Await>
        </Suspense>

        {/* Tasks Table */}
        <Suspense fallback={<TasksTableSkeleton />}>
          <Await resolve={tasksPromise}>{(data) => <TasksTable data={data} />}</Await>
        </Suspense>
      </Stack>

      {/* Task Details Outlet */}
      <Outlet />
    </Box>
  );
}
