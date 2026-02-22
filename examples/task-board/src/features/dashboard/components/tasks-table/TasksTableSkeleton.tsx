import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

/**
 * Skeleton fallback for TasksTable while loading
 */
export default function TasksTableSkeleton() {
  return (
    <Card aria-label="Loading tasks table">
      <CardContent>
        <Skeleton variant="text" width={180} height={32} sx={{ mb: 2 }} />
        <Stack spacing={1}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rectangular" height={52} />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
