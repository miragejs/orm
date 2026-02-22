import { ReactNode } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { formatTaskTitle } from '@shared/utils';
import TaskStatusChips from './TaskStatusChips';
import TaskPeopleSection from './TaskPeopleSection';
import TaskTeamCard from './TaskTeamCard';
import TaskDatesInfo from './TaskDatesInfo';
import type { Task } from '@shared/types';

interface TaskDetailsDialogProps {
  task: Task;
  onClose: () => void;
  children?: ReactNode;
}

/**
 * TaskDetailsDialog - Presentational component for task details modal
 */
export default function TaskDetailsDialog({
  task,
  onClose,
  children,
}: TaskDetailsDialogProps) {
  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{formatTaskTitle(task)}</DialogTitle>

      <DialogContent>
        <TaskStatusChips status={task.status} priority={task.priority} />
        <Typography variant="body2">{task.description}</Typography>
        <Divider sx={{ my: 2 }} />
        <TaskPeopleSection assignee={task.assignee} creator={task.creator} />
        {task.team && <TaskTeamCard team={task.team} />}
        <TaskDatesInfo dueDate={task.dueDate} createdAt={task.createdAt} />
        <Divider sx={{ my: 2 }} />

        {/* Comments Section - Rendered via children */}
        {children}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
