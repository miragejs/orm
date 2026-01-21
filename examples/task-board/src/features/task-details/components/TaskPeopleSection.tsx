import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { UserInfo } from '@shared/types';

interface PersonInfoProps {
  label: string;
  person: UserInfo | null;
  fallbackText: string;
}

function PersonInfo({ label, person, fallbackText }: PersonInfoProps) {
  return (
    <Box sx={{ flex: 1 }}>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ mb: 1, display: 'block' }}
      >
        {label}
      </Typography>
      {person ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar src={person.avatar} alt={person.name} sx={{ width: 40, height: 40 }}>
            {person.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {person.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {person.role}
            </Typography>
          </Box>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {fallbackText}
        </Typography>
      )}
    </Box>
  );
}

interface TaskPeopleSectionProps {
  assignee: UserInfo | null;
  creator: UserInfo | null;
}

export default function TaskPeopleSection({ assignee, creator }: TaskPeopleSectionProps) {
  return (
    <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
      <PersonInfo label="Assignee" person={assignee} fallbackText="Unassigned" />
      <PersonInfo label="Created by" person={creator} fallbackText="Unknown" />
    </Box>
  );
}
