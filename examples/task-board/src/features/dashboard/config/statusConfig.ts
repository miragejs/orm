import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  RateReview as RateReviewIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { TaskStatus } from '@shared/types';

export interface StatusConfig {
  label: string;
  icon: React.ComponentType<any>;
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
