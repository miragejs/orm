import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';

/**
 * Skeleton fallback for TeamStatsCard while loading
 */
export default function TeamStatsCardSkeleton() {
  return (
    <Card aria-label="Loading team stats">
      <CardContent>
        <Skeleton variant="text" width={150} height={32} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width={80} height={40} />
            <Skeleton variant="text" width={80} height={40} />
          </Box>
          <Box sx={{ flex: 2 }}>
            <Skeleton variant="text" width={200} />
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rounded" width={80} height={24} />
              ))}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
