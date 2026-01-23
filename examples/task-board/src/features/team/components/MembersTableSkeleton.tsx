import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';

/**
 * Skeleton fallback for MembersTable while loading
 */
export default function MembersTableSkeleton() {
  return (
    <Card>
      <CardContent>
        {/* Title with loading indicator space */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Skeleton variant="text" width={160} height={32} />
        </Box>

        {/* Table header with sortable columns */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            py: 1.5,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ width: 60 }} />
          <Skeleton variant="text" width={80} height={24} />
          <Skeleton variant="text" width={60} height={24} sx={{ ml: 'auto' }} />
          <Skeleton variant="text" width={60} height={24} />
        </Box>

        {/* Table rows */}
        {[1, 2, 3, 4, 5].map((row) => (
          <Box
            key={row}
            sx={{
              display: 'flex',
              gap: 2,
              py: 1.5,
              alignItems: 'center',
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Box sx={{ width: 60, display: 'flex', justifyContent: 'center' }}>
              <Skeleton variant="circular" width={32} height={32} />
            </Box>
            <Skeleton variant="text" width={120} height={20} />
            <Skeleton variant="text" width={100} height={20} sx={{ ml: 'auto' }} />
            <Skeleton variant="text" width={180} height={20} />
          </Box>
        ))}

        {/* Pagination */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 2,
            pt: 2,
          }}
        >
          <Skeleton variant="text" width={120} height={24} />
          <Skeleton variant="text" width={50} height={32} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton variant="rounded" width={32} height={32} />
            <Skeleton variant="rounded" width={32} height={32} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
