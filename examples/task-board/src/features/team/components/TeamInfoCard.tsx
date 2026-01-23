import { memo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import BusinessIcon from '@mui/icons-material/Business';
import GroupsIcon from '@mui/icons-material/Groups';
import type { Team } from '@shared/types';

interface TeamInfoCardProps {
  team: Team;
}

/**
 * Team Info Card - Displays team name, department, and description
 */
function TeamInfoCard({ team }: TeamInfoCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <GroupsIcon color="primary" />
          <Typography variant="h6" component="h3">
            {team.name}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <BusinessIcon fontSize="small" color="action" sx={{ opacity: 0.7 }} />
          <Chip label={team.department} size="small" variant="outlined" color="primary" />
        </Box>

        <Typography variant="body2" color="text.secondary">
          {team.description}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 2 }}
        >
          Created: {new Date(team.createdAt).toLocaleDateString()}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default memo(TeamInfoCard);
