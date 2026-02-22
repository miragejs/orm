import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface MembersTableErrorProps {
  error: Error;
}

/**
 * Error fallback for MembersTable when loading fails
 */
export default function MembersTableError({ error }: MembersTableErrorProps) {
  return (
    <Card component="section" aria-labelledby="team-members-error-title">
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6,
          textAlign: 'center',
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
        <Typography
          id="team-members-error-title"
          variant="h6"
          component="h3"
          color="error"
          gutterBottom
        >
          Team Members Unavailable
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error.message}
        </Typography>
      </CardContent>
    </Card>
  );
}
