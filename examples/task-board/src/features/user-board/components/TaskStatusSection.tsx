import { memo } from 'react';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import TaskCard from './TaskCard';
import type { SimpleTask } from '@shared/types';

interface TaskStatusSectionProps {
  statusLabel: string;
  statusIcon: React.ComponentType<{ sx?: object }>;
  statusColor: 'default' | 'info' | 'warning' | 'success' | 'error';
  tasks: SimpleTask[];
  expanded: boolean;
  onExpandChange: (isExpanded: boolean) => void;
  onTaskClick: (taskId: string) => void;
}

/**
 * TaskStatusSection Component - Displays an accordion section for a task status
 */
function TaskStatusSection({
  statusLabel,
  statusIcon: Icon,
  statusColor,
  tasks,
  expanded,
  onExpandChange,
  onTaskClick,
}: TaskStatusSectionProps) {
  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => onExpandChange(isExpanded)}
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
        <Icon sx={{ color: `${statusColor}.main` }} />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {statusLabel}
        </Typography>
        <Chip label={tasks.length} color={statusColor} size="small" sx={{ mr: 1 }} />
      </AccordionSummary>
      <AccordionDetails>
        {tasks.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No tasks in this status
          </Typography>
        ) : (
          <Stack spacing={2}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                statusColor={statusColor}
                onTaskClick={onTaskClick}
              />
            ))}
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

export default memo(TaskStatusSection);
