import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';

/**
 * Skeleton fallback for TeamInfoCard while loading
 */
export default function TeamInfoCardSkeleton() {
  return (
    <Card
      aria-label="Loading team info"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Header with icon and name */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton variant="text" width={120} height={32} />
        </Box>

        {/* Department chip */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton variant="rounded" width={100} height={24} />
        </Box>

        {/* Description */}
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="60%" />

        {/* Created date */}
        <Skeleton variant="text" width={140} sx={{ mt: 2 }} />
      </CardContent>
    </Card>
  );
}
