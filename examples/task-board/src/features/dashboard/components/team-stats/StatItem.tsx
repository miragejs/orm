import { memo, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface StatItemProps {
  icon: ReactNode;
  count: number;
  label: string;
}

function StatItem({ icon, count, label }: StatItemProps) {
  const ariaLabel = `${count} ${label}`;
  return (
    <Box aria-label={ariaLabel} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {icon}
      <Box>
        <Typography variant="h5" component="span">
          {count}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
}

export default memo(StatItem);
