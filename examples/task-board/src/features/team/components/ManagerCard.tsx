import { memo } from 'react';
import { Card, CardContent, Typography, Box, Avatar } from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import type { TeamMember } from '@shared/types';

interface ManagerCardProps {
  manager: TeamMember | null;
}

/**
 * Manager Card - Displays team manager information
 */
function ManagerCard({ manager }: ManagerCardProps) {
  if (!manager) {
    return (
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <CardContent
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PersonIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No manager assigned
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ display: 'block', mb: 2 }}
        >
          Team Manager
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar src={manager.avatar} alt={manager.name} sx={{ width: 64, height: 64 }}>
            {manager.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h6" component="h3">
              {manager.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <BadgeIcon fontSize="small" color="action" sx={{ opacity: 0.7 }} />
              <Typography variant="body2" color="text.secondary">
                {manager.role}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon fontSize="small" color="action" sx={{ opacity: 0.7 }} />
          <Typography variant="body2" color="text.secondary">
            {manager.email}
          </Typography>
        </Box>

        {manager.bio && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 2, fontStyle: 'italic' }}
          >
            &ldquo;{manager.bio}&rdquo;
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default memo(ManagerCard);
