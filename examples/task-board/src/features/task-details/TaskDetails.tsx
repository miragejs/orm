import { useLoaderData, useNavigate, Outlet } from 'react-router';
import {
  CalendarToday as CalendarIcon,
  Groups as GroupsIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  Avatar,
} from '@mui/material';
import { getTaskDetails } from './api';
import { getTaskComments } from '@features/task-comments/api';
import { formatTaskTitle } from '@shared/utils';
import { TaskStatus, TaskPriority } from '@shared/types';
import type { DetailedTask, Comment } from '@shared/types';
import type { LoaderFunctionArgs } from 'react-router';

/**
 * Loader for task details page
 * Task is loaded synchronously (blocking), comments are deferred (streaming)
 */
export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;

  if (!id) {
    throw new Response('Task ID is required', { status: 400 });
  }

  const task = await getTaskDetails(id);
  const commentsPromise = getTaskComments(id);

  return { task, commentsPromise };
}

export interface TaskDetailsLoaderData {
  task: DetailedTask;
  commentsPromise: Promise<Comment[]>;
}

// Priority configuration
const priorityConfig = {
  [TaskPriority.LOW]: { color: 'default' as const },
  [TaskPriority.MEDIUM]: { color: 'info' as const },
  [TaskPriority.HIGH]: { color: 'warning' as const },
  [TaskPriority.URGENT]: { color: 'error' as const },
};

// Status configuration
const statusConfig = {
  [TaskStatus.TODO]: { label: 'To Do', color: 'default' as const },
  [TaskStatus.IN_PROGRESS]: { label: 'In Progress', color: 'info' as const },
  [TaskStatus.REVIEW]: { label: 'In Review', color: 'warning' as const },
  [TaskStatus.DONE]: { label: 'Completed', color: 'success' as const },
};

/**
 * Task Details Dialog Component
 * Acts as a layout route - renders task info and Outlet for child routes (comments)
 */
export default function TaskDetails() {
  const { task } = useLoaderData<TaskDetailsLoaderData>();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/dashboard');
  };

  return (
    <Dialog open={true} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{formatTaskTitle(task)}</DialogTitle>

      <DialogContent>
        {/* Task Status and Priority */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <Chip
            label={statusConfig[task.status].label}
            color={statusConfig[task.status].color}
            size="small"
          />
          <Chip
            label={task.priority}
            color={priorityConfig[task.priority].color}
            size="small"
          />
        </Box>

        {/* Task Description */}
        <Typography variant="body1" paragraph>
          {task.description}
        </Typography>

        <Divider sx={{ my: 2 }} />

        {/* People Section */}
        <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
          {/* Assignee */}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ mb: 1, display: 'block' }}
            >
              Assignee
            </Typography>
            {task.assignee ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  src={task.assignee.avatar}
                  alt={task.assignee.name}
                  sx={{ width: 40, height: 40 }}
                >
                  {task.assignee.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {task.assignee.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {task.assignee.role}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Unassigned
              </Typography>
            )}
          </Box>

          {/* Creator */}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ mb: 1, display: 'block' }}
            >
              Created by
            </Typography>
            {task.creator ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  src={task.creator.avatar}
                  alt={task.creator.name}
                  sx={{ width: 40, height: 40 }}
                >
                  {task.creator.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {task.creator.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {task.creator.role}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Unknown
              </Typography>
            )}
          </Box>
        </Box>

        {/* Team Section */}
        {task.team && (
          <Box
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <GroupsIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight={600}>
                {task.team.name}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <BusinessIcon fontSize="small" color="action" sx={{ opacity: 0.7 }} />
              <Typography variant="body2" color="text.secondary">
                {task.team.department}
              </Typography>
            </Box>
            {task.team.description && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 1 }}
              >
                {task.team.description}
              </Typography>
            )}
          </Box>
        )}

        {/* Dates */}
        <Box sx={{ display: 'flex', gap: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              <strong>Due:</strong> {new Date(task.dueDate).toLocaleDateString()}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              <strong>Created:</strong> {new Date(task.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Comments Section - Rendered via child route */}
        <Outlet />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
