import { useState } from 'react';
import { useLoaderData } from 'react-router';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  RateReview as RateReviewIcon,
  Assignment as AssignmentIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { TaskStatus, TaskPriority, type Task } from '@shared/types';
import { getTasks } from './api';
/**
 * Dashboard loader - fetches user tasks
 */
export async function loader() {
  const data = await getTasks();
  return data;
}

// Status configuration with icons and labels
const statusConfig = {
  [TaskStatus.IN_PROGRESS]: {
    label: 'In Progress',
    icon: ScheduleIcon,
    color: 'info' as const,
  },
  [TaskStatus.REVIEW]: {
    label: 'In Review',
    icon: RateReviewIcon,
    color: 'warning' as const,
  },
  [TaskStatus.TODO]: {
    label: 'To Do',
    icon: AssignmentIcon,
    color: 'default' as const,
  },
  [TaskStatus.DONE]: {
    label: 'Completed',
    icon: CheckCircleIcon,
    color: 'success' as const,
  },
};

// Status order for display
const statusOrder = [
  TaskStatus.IN_PROGRESS,
  TaskStatus.TODO,
  TaskStatus.REVIEW,
  TaskStatus.DONE,
];

// Priority configuration with colors
const priorityConfig = {
  [TaskPriority.LOW]: {
    color: 'default' as const,
  },
  [TaskPriority.MEDIUM]: {
    color: 'info' as const,
  },
  [TaskPriority.HIGH]: {
    color: 'warning' as const,
  },
  [TaskPriority.URGENT]: {
    color: 'error' as const,
  },
};

/**
 * Dashboard Component - Overview of tasks grouped by status
 */
export default function Dashboard() {
  const { tasks } = useLoaderData<typeof loader>();
  const [expanded, setExpanded] = useState<string>(TaskStatus.IN_PROGRESS);

  // Group tasks by status
  const tasksByStatus = tasks.reduce(
    (acc, task) => {
      if (!acc[task.status]) {
        acc[task.status] = [];
      }
      acc[task.status].push(task);
      return acc;
    },
    {} as Record<TaskStatus, Task[]>,
  );

  const handleAccordionChange = (panel: string) => (_: unknown, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : '');
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
        My Tasks
      </Typography>

      <Stack spacing={2}>
        {statusOrder.map((status) => {
          const config = statusConfig[status];
          const statusTasks = tasksByStatus[status] || [];
          const Icon = config.icon;

          return (
            <Accordion
              key={status}
              expanded={expanded === status}
              onChange={handleAccordionChange(status)}
              sx={{
                '&:before': { display: 'none' },
                boxShadow: 1,
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  '& .MuiAccordionSummary-content': {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  },
                }}
              >
                <Icon sx={{ color: `${config.color}.main` }} />
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  {config.label}
                </Typography>
                <Chip
                  label={statusTasks.length}
                  color={config.color}
                  size="small"
                  sx={{ mr: 1 }}
                />
              </AccordionSummary>
              <AccordionDetails>
                {statusTasks.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No tasks in this status
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {statusTasks.map((task) => (
                      <Card
                        key={task.id}
                        variant="outlined"
                        sx={{
                          borderLeft: 4,
                          borderLeftColor: `${config.color}.main`,
                        }}
                      >
                        <CardContent>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              mb: 1,
                            }}
                          >
                            <Typography variant="h6" sx={{ flexGrow: 1 }}>
                              {task.title}
                            </Typography>
                            <Chip
                              label={config.label}
                              color={config.color}
                              size="small"
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {task.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            <Chip
                              label={task.priority}
                              color={priorityConfig[task.priority].color}
                              size="small"
                            />
                            <Chip
                              label={new Date(task.dueDate).toLocaleDateString()}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>
    </Box>
  );
}
