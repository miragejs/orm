import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CalendarIcon from '@mui/icons-material/CalendarToday';

interface TaskDatesInfoProps {
  dueDate: string;
  createdAt: string;
}

export default function TaskDatesInfo({ dueDate, createdAt }: TaskDatesInfoProps) {
  return (
    <Box sx={{ display: 'flex', gap: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CalendarIcon fontSize="small" color="action" />
        <Typography variant="body2" color="text.secondary">
          <strong>Due:</strong> {new Date(dueDate).toLocaleDateString()}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CalendarIcon fontSize="small" color="action" />
        <Typography variant="body2" color="text.secondary">
          <strong>Created:</strong> {new Date(createdAt).toLocaleDateString()}
        </Typography>
      </Box>
    </Box>
  );
}
