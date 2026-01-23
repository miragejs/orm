import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';

/**
 * Skeleton fallback for ManagerCard while loading
 */
export default function ManagerCardSkeleton() {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Team Manager label */}
        <Skeleton variant="text" width={100} height={16} sx={{ mb: 2 }} />

        {/* Avatar and name section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Skeleton variant="circular" width={64} height={64} />
          <Box>
            <Skeleton variant="text" width={140} height={32} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Skeleton variant="circular" width={20} height={20} />
              <Skeleton variant="text" width={80} />
            </Box>
          </Box>
        </Box>

        {/* Email */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton variant="text" width={180} />
        </Box>

        {/* Bio */}
        <Skeleton variant="text" width="100%" sx={{ mt: 2 }} />
        <Skeleton variant="text" width="80%" />
      </CardContent>
    </Card>
  );
}
