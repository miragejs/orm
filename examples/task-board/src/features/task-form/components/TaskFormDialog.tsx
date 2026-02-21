import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import type { ReactNode } from 'react';

interface TaskFormDialogProps {
  children: ReactNode;
  isEdit: boolean;
  submitLabel: string;
  submitting: boolean;
  onClose: () => void;
}

/**
 * Presentational dialog shell for the task form.
 * Hides dialog layout and actions; form content is provided as children.
 */
export default function TaskFormDialog({
  children,
  isEdit,
  onClose,
  submitLabel,
  submitting,
}: TaskFormDialogProps) {
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center' }}>
        {isEdit ? 'Edit Task' : 'Create Task'}
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" form="task-form" variant="contained" loading={submitting}>
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
