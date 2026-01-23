import { memo } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TaskCard from './TaskCard';
import type { TaskListItem } from '@shared/types';
import { TaskStatus } from '@/shared/enums';

interface TaskStatusSectionProps {
  expanded: boolean;
  status: TaskStatus;
  statusColor: 'default' | 'info' | 'warning' | 'success' | 'error';
  statusIcon: React.ComponentType<{ sx?: object }>;
  statusLabel: string;
  tasks: TaskListItem[];
  onExpandChange: (isExpanded: boolean) => void;
  onTaskClick: (taskId: string) => void;
}

/**
 * TaskStatusSection Component - Displays an accordion section for a task status
 */
function TaskStatusSection({
  expanded,
  status,
  statusColor,
  statusIcon: Icon,
  statusLabel,
  tasks,
  onExpandChange,
  onTaskClick,
}: TaskStatusSectionProps) {
  const titleId = `status-${status}`;

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
        <Typography id={titleId} variant="h6" sx={{ flexGrow: 1 }}>
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
          <Box
            component="ul"
            aria-labelledby={titleId}
            sx={{
              listStyle: 'none',
              p: 0,
              m: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                statusColor={statusColor}
                onTaskClick={onTaskClick}
              />
            ))}
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

export default memo(TaskStatusSection);
