import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

/**
 * Help button and dialog for the login page. Manages its own open/close state.
 */
export default function LoginHelp() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title="How to use this demo">
        <IconButton
          size="large"
          onClick={() => setOpen(true)}
          sx={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            '.MuiSvgIcon-root': {
              fontSize: '3rem',
            },
          }}
          color="secondary"
          aria-label="Open help"
        >
          <HelpOutlineIcon fontSize="large" />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>How to use this demo</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sign in with one of the demo accounts below. After login, you will be
            redirected based on your role. Each role has its own routes and views.
          </Typography>

          <Typography variant="subtitle2" color="secondary" sx={{ mt: 2, mb: 1 }}>
            Regular user (john.doe@example.com)
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div">
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>
                <strong>My Tasks</strong> — Your personal task board with tasks grouped by
                status (To Do, In Progress, Review, Done). Open a task to view details,
                add comments, or create and edit tasks (no delete).
              </li>
              <li>
                <strong>Task details</strong> — View description, assignee, due date, and
                comments. You can add comments and create or edit your tasks (no delete).
              </li>
              <li>
                <strong>Team</strong> — View your team info, manager, and members.
              </li>
            </ul>
          </Typography>

          <Typography variant="subtitle2" color="secondary" sx={{ mt: 2, mb: 1 }}>
            Manager (jane.smith@example.com)
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div">
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>
                <strong>Dashboard</strong> — Team-wide task list with filters (status,
                priority, assignee), sorting, and statistics (task counts and charts).
                Create new tasks or open any task to add, edit, delete, or manage
                comments.
              </li>
              <li>
                <strong>Task details & form</strong> — Full CRUD: create, edit, and delete
                tasks (only managers can delete); assign to team members; view and add
                comments.
              </li>
            </ul>
          </Typography>
        </DialogContent>
      </Dialog>
    </>
  );
}
