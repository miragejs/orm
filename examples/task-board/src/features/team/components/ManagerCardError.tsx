import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface ManagerCardErrorProps {
  error: Error;
}

/**
 * Error fallback for ManagerCard when loading fails
 */
export default function ManagerCardError({ error }: ManagerCardErrorProps) {
  return (
    <Card
      component="section"
      aria-labelledby="team-manager-error-title"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
        <Typography
          id="team-manager-error-title"
          variant="h6"
          component="h3"
          color="error"
          gutterBottom
        >
          Manager Info Unavailable
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error.message}
        </Typography>
      </CardContent>
    </Card>
  );
}
