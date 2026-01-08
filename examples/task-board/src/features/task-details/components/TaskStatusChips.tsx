import { Box, Chip } from '@mui/material';
import { TaskStatus, TaskPriority } from '@shared/types';

interface TaskStatusChipsProps {
  status: TaskStatus;
  priority: TaskPriority;
}

const priorityConfig = {
  [TaskPriority.LOW]: { color: 'default' },
  [TaskPriority.MEDIUM]: { color: 'info' },
  [TaskPriority.HIGH]: { color: 'warning' },
  [TaskPriority.URGENT]: { color: 'error' },
} as const;

const statusConfig = {
  [TaskStatus.TODO]: { label: 'To Do', color: 'default' },
  [TaskStatus.IN_PROGRESS]: { label: 'In Progress', color: 'info' },
  [TaskStatus.REVIEW]: { label: 'In Review', color: 'warning' },
  [TaskStatus.DONE]: { label: 'Completed', color: 'success' },
} as const;

export default function TaskStatusChips({ status, priority }: TaskStatusChipsProps) {
  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
      <Chip
        label={statusConfig[status].label}
        color={statusConfig[status].color}
        size="small"
      />
      <Chip label={priority} color={priorityConfig[priority].color} size="small" />
    </Box>
  );
}
