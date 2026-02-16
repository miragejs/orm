import { memo } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupsIcon from '@mui/icons-material/Groups';
import type { UserInfo } from '@shared/types';
import StatItem from './StatItem';

interface TeamStatsCardProps {
  members: UserInfo[];
  taskCount: number;
}

/**
 * TeamStatsCard - Displays team stats and members preview
 */
function TeamStatsCard({ members, taskCount }: TeamStatsCardProps) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="h3" gutterBottom>
          Team Overview
        </Typography>

        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', gap: 4 }}>
            <StatItem
              icon={<GroupsIcon color="action" />}
              count={members.length}
              label="Members"
            />
            <StatItem
              icon={<AssignmentIcon color="action" />}
              count={taskCount}
              label="Tasks"
            />
          </Box>

          <Box sx={{ flex: '1 1 300px' }}>
            <Typography
              component="h4"
              color="text.secondary"
              variant="overline"
              sx={{ display: 'block', mb: 1 }}
            >
              Team Members
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {members.slice(0, 8).map((member) => (
                <Chip
                  key={member.id}
                  avatar={
                    <Avatar src={member.avatar} alt={member.name}>
                      {member.name.charAt(0)}
                    </Avatar>
                  }
                  label={member.name}
                  size="small"
                  variant="outlined"
                />
              ))}
              {members.length > 8 && (
                <Chip
                  label={`+${members.length - 8} more`}
                  size="small"
                  color="default"
                />
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default memo(TeamStatsCard);
