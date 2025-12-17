import { Typography, Box, Avatar } from '@mui/material';
import type { Comment } from '@shared/types';

export interface CommentBubbleProps {
  comment: Comment;
  currentUserId: string | undefined;
}

/**
 * Comment Bubble Component - Chat-like message display
 */
export function CommentBubble({ comment, currentUserId }: CommentBubbleProps) {
  const isCurrentUser = comment.author.id === currentUserId;
  return (
    <Box
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
        <Avatar
          src={comment.author.avatar}
          alt={comment.author.name}
          sx={{ width: 32, height: 32 }}
        >
          {comment.author.name.charAt(0)}
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
              {comment.author.name}
            </Typography>
            <Typography variant="body2">{comment.content}</Typography>
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
            {new Date(comment.createdAt).toLocaleString()}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
