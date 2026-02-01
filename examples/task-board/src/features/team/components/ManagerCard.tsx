import { memo } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import BadgeIcon from '@mui/icons-material/Badge';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import type { UserInfo } from '@shared/types';

interface ManagerCardProps {
  manager: UserInfo | null;
}

const SECTION_TITLE_ID = 'team-manager-title';

/**
 * Manager Card - Displays team manager information
 */
function ManagerCard({ manager }: ManagerCardProps) {
  if (!manager) {
    return (
      <Card
        component="section"
        aria-labelledby={SECTION_TITLE_ID}
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
          <Typography id={SECTION_TITLE_ID} variant="h6" component="h3" sx={{ mb: 1 }}>
            Team Manager
          </Typography>
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
      component="section"
      aria-labelledby={SECTION_TITLE_ID}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography
          id={SECTION_TITLE_ID}
          variant="h6"
          component="h3"
          sx={{ display: 'block', mb: 2 }}
        >
          Team Manager
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar src={manager.avatar} alt={manager.name} sx={{ width: 64, height: 64 }}>
            {manager.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" component="p" fontWeight={600}>
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
