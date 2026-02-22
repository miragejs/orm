import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface TeamInfoCardErrorProps {
  error: Error;
}

/**
 * Error fallback for TeamInfoCard when loading fails
 */
export default function TeamInfoCardError({ error }: TeamInfoCardErrorProps) {
  return (
    <Card
      component="section"
      aria-labelledby="team-info-error-title"
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
          id="team-info-error-title"
          variant="h6"
          component="h3"
          color="error"
          gutterBottom
        >
          Team Info Unavailable
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error.message}
        </Typography>
      </CardContent>
    </Card>
  );
}
