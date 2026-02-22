import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Comment } from '@shared/types';

export interface CommentBubbleProps {
  comment: Comment;
  currentUserId: string | undefined;
}

export function CommentBubble({ comment, currentUserId }: CommentBubbleProps) {
  const { author, content, createdAt } = comment;
  const isCurrentUser = author.id === currentUserId;

  return (
    <Box
      component="li"
      aria-label={`Comment by ${author.name}`}
      sx={{
        display: 'flex',
        justifyContent: isCurrentUser ? 'flex-start' : 'flex-end',
        mb: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isCurrentUser ? 'row' : 'row-reverse',
          alignItems: 'flex-start',
          maxWidth: '70%',
          gap: 1,
        }}
      >
        <Avatar src={author.avatar} alt={author.name} sx={{ width: 32, height: 32 }}>
          {author.name.charAt(0)}
        </Avatar>

        <Box>
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderRadius: 2,
              backgroundColor: isCurrentUser
                ? 'secondary.light'
                : 'rgba(255, 255, 255, 0.05)',
              color: isCurrentUser ? 'secondary.contrastText' : 'text.primary',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                fontWeight: 600,
                mb: 0.5,
                opacity: 0.9,
              }}
            >
              {author.name}
            </Typography>
            <Typography variant="body2">{content}</Typography>
          </Box>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 0.5,
              px: 1,
              color: 'text.secondary',
              textAlign: isCurrentUser ? 'left' : 'right',
            }}
          >
            {new Date(createdAt).toLocaleString()}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
