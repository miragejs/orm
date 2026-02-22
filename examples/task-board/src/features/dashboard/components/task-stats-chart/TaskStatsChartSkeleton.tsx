import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';

/**
 * Skeleton fallback for TaskStatsChart while loading
 */
export default function TaskStatsChartSkeleton() {
  return (
    <Card aria-label="Loading task stats chart">
      <CardContent>
        <Skeleton variant="text" width={120} height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={280} />
      </CardContent>
    </Card>
  );
}
