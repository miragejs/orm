import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RateReviewIcon from '@mui/icons-material/RateReview';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { TaskStatus } from '@shared/enums';

export interface StatusConfig {
  label: string;
  icon: React.ComponentType<{ sx?: object }>;
  color: 'default' | 'info' | 'warning' | 'success' | 'error';
}

/**
 * Status configuration with icons and labels
 */
export const statusConfig: Record<TaskStatus, StatusConfig> = {
  [TaskStatus.IN_PROGRESS]: {
    label: 'In Progress',
    icon: ScheduleIcon,
    color: 'info',
  },
  [TaskStatus.REVIEW]: {
    label: 'In Review',
    icon: RateReviewIcon,
    color: 'warning',
  },
  [TaskStatus.TODO]: {
    label: 'To Do',
    icon: AssignmentIcon,
    color: 'default',
  },
  [TaskStatus.DONE]: {
    label: 'Completed',
    icon: CheckCircleIcon,
    color: 'success',
  },
};

/**
 * Status order for display
 */
export const statusOrder = [
  TaskStatus.IN_PROGRESS,
  TaskStatus.TODO,
  TaskStatus.REVIEW,
  TaskStatus.DONE,
];
