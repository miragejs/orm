import { Suspense } from 'react';
import {
  useLoaderData,
  Await,
  useNavigate,
  useParams,
  Outlet,
  useRouteLoaderData,
} from 'react-router';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import { getTeam } from '@features/team/api';
import { TeamInfoCard, TeamInfoCardSkeleton } from '@features/team/components';
import { isManager } from '@shared/utils';
import { getTaskStatistics, getTeamTasks } from './api';
import {
  TaskStatsChart,
  TaskStatsChartSkeleton,
  TasksTable,
  TasksTableSkeleton,
  TeamStatsCard,
  TeamStatsCardSkeleton,
} from './components';
import type { LoaderFunctionArgs } from 'react-router';
import type { User } from '@shared/types';

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
  const navigate = useNavigate();
  const { teamName } = useParams();
  const currentUser = useRouteLoaderData<User>('root')!;
  const { teamPromise, statisticsPromise, tasksPromise } = useLoaderData<typeof loader>();

  const canDelete = isManager(currentUser);

  const handleOpenCreate = () => {
    navigate(`/${teamName}/dashboard/tasks/new`);
  };

  const handleEditClick = (taskId: string) => {
    navigate(`/${teamName}/dashboard/tasks/${taskId}`);
  };

  const handleDeleteClick = (taskId: string) => {
    navigate(`/${teamName}/dashboard/tasks/${taskId}/delete`);
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
          mb: 3,
        }}
      >
        <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 0 }}>
          Dashboard
        </Typography>
        <Button
          aria-label="Create task"
          onClick={handleOpenCreate}
          startIcon={<AddIcon />}
          variant="contained"
          sx={{ borderRadius: 9999 }}
        >
          Create
        </Button>
      </Box>

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
          <Await resolve={tasksPromise}>
            {(data) => (
              <TasksTable
                data={data}
                onEditClick={handleEditClick}
                onDeleteClick={canDelete ? handleDeleteClick : undefined}
              />
            )}
          </Await>
        </Suspense>
      </Stack>

      {/* Task Form, Delete confirmation, and Task Details Outlet */}
      <Outlet />
    </Box>
  );
}
