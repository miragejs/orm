import { memo } from 'react';
import { Box, Card, CardContent, Chip, Typography } from '@mui/material';
import { TaskPriority } from '@shared/enums';
import type { SimpleTask } from '@shared/types';

interface TaskCardProps {
  task: SimpleTask;
  statusColor: 'default' | 'info' | 'warning' | 'success' | 'error';
  onTaskClick: (taskId: string) => void;
}

const priorityConfig = {
  [TaskPriority.LOW]: { color: 'default' },
  [TaskPriority.MEDIUM]: { color: 'info' },
  [TaskPriority.HIGH]: { color: 'warning' },
  [TaskPriority.URGENT]: { color: 'error' },
} as const;

/**
 * TaskCard Component - Displays a single task card
 */
function TaskCard({ task, statusColor, onTaskClick }: TaskCardProps) {
  return (
    <Card
      variant="outlined"
      onClick={() => onTaskClick(task.id)}
      sx={{
        borderLeft: 4,
        borderLeftColor: `${statusColor}.main`,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: 'primary.dark',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
          transform: 'translateY(-4px)',
        },
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
          <Chip label={task.status} color={statusColor} size="small" />
        </Box>
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
  );
}

export default memo(TaskCard);
