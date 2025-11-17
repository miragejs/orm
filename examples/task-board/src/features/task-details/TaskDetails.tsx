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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Comment as CommentIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useLoaderData, useNavigate, useRouteLoaderData } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import {
  TaskStatus,
  TaskPriority,
  type TaskDetails as TaskDetailsType,
  type User,
} from '@shared/types';
import { getTaskDetails } from './api';

/**
 * Loader for task details page
 */
export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;

  if (!id) {
    throw new Response('Task ID is required', { status: 400 });
  }

  const task = await getTaskDetails(id);
  return { task };
}

interface LoaderData {
  task: TaskDetailsType;
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
 * Comment Bubble Component - Chat-like message display
 */
function CommentBubble({
  comment,
  isCurrentUser,
}: {
  comment: NonNullable<TaskDetailsType['comments']>[0];
  isCurrentUser: boolean;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isCurrentUser ? 'flex-start' : 'flex-end',
        mb: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isCurrentUser ? 'row' : 'row-reverse',
          alignItems: 'flex-start',
          maxWidth: '70%',
          gap: 1,
        }}
      >
        <Avatar
          src={comment.author?.avatar}
          alt={comment.author?.name}
          sx={{ width: 32, height: 32 }}
        >
          {comment.author?.name?.charAt(0)}
        </Avatar>

        <Box>
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderRadius: 2,
              backgroundColor: isCurrentUser
                ? 'secondary.light'
                : 'rgba(255, 255, 255, 0.05)',
              color: isCurrentUser ? 'secondary.contrastText' : 'text.primary',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                fontWeight: 600,
                mb: 0.5,
                opacity: 0.9,
              }}
            >
              {comment.author?.name}
            </Typography>
            <Typography variant="body2">{comment.content}</Typography>
          </Box>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 0.5,
              px: 1,
              color: 'text.secondary',
              textAlign: isCurrentUser ? 'left' : 'right',
            }}
          >
            {new Date(comment.createdAt).toLocaleString()}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Task Details Dialog Component
 */
export default function TaskDetails() {
  const { task } = useLoaderData<LoaderData>();
  const rootData = useRouteLoaderData('root') as { user: User } | undefined;
  const currentUser = rootData?.user;
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/dashboard');
  };

  return (
    <Dialog open={true} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{task.title}</DialogTitle>

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

        {/* Task Metadata */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              <strong>Assignee:</strong> {task.assignee?.name || 'Unassigned'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              <strong>Created by:</strong> {task.creator?.name || 'Unknown'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              <strong>Due Date:</strong> {new Date(task.dueDate).toLocaleDateString()}
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

        {/* Comments Section */}
        <Accordion
          defaultExpanded={!!task.comments?.length}
          sx={{
            '&:before': { display: 'none' },
            boxShadow: 'none',
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CommentIcon />
              <Typography variant="h6">
                Comments ({task.comments?.length || 0})
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {task.comments && task.comments.length > 0 ? (
              <Box sx={{ py: 1 }}>
                {task.comments.map((comment) => (
                  <CommentBubble
                    key={comment.id}
                    comment={comment}
                    isCurrentUser={comment.authorId === currentUser?.id}
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No comments yet
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
