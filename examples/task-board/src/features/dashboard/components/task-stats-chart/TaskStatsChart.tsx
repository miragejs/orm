import { memo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { LineChart } from '@mui/x-charts/LineChart';
import type { TaskStatistics } from '@shared/types';

interface TaskStatsChartProps {
  statistics: TaskStatistics;
}

/**
 * TaskStatsChart Component - Line chart showing task trends over time
 */
function TaskStatsChart({ statistics }: TaskStatsChartProps) {
  const { dates, created, completed, inProgress } = statistics;

  // Format dates for display
  const formattedDates = dates.map((date) =>
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="h3" gutterBottom>
          Task Trends
        </Typography>

        {dates.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No task data available</Typography>
          </Box>
        ) : (
          <Box sx={{ width: '100%', height: 300 }}>
            <LineChart
              xAxis={[
                {
                  data: formattedDates,
                  scaleType: 'point',
                  label: 'Date',
                },
              ]}
              series={[
                {
                  data: created,
                  label: 'Created',
                  color: '#90caf9',
                  curve: 'linear',
                },
                {
                  data: completed,
                  label: 'Completed',
                  color: '#66bb6a',
                  curve: 'linear',
                },
                {
                  data: inProgress,
                  label: 'In Progress',
                  color: '#ffb74d',
                  curve: 'linear',
                },
              ]}
              height={280}
              margin={{ left: 50, right: 20, top: 20, bottom: 50 }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default memo(TaskStatsChart);
