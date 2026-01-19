import { Box, Typography } from '@mui/material';
import { Groups as GroupsIcon, Business as BusinessIcon } from '@mui/icons-material';
import type { TeamInfo } from '@shared/types';

interface TaskTeamCardProps {
  team: TeamInfo;
}

export default function TaskTeamCard({ team }: TaskTeamCardProps) {
  return (
    <Box
      sx={{
        p: 2,
        mb: 3,
        borderRadius: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <GroupsIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2" fontWeight={600}>
          {team.name}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <BusinessIcon fontSize="small" color="action" sx={{ opacity: 0.7 }} />
        <Typography variant="body2" color="text.secondary">
          {team.department}
        </Typography>
      </Box>
      {team.description && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 1 }}
        >
          {team.description}
        </Typography>
      )}
    </Box>
  );
}
