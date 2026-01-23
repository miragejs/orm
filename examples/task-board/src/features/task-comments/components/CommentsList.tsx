import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { CommentBubble } from './CommentBubble';
import type { Comment } from '@shared/types';

export interface CommentsListProps {
  comments: Comment[];
  currentUserId: string | undefined;
  titleId: string;
}

export function CommentsList({ comments, currentUserId, titleId }: CommentsListProps) {
  if (comments.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No comments yet
      </Typography>
    );
  }

  return (
    <Box
      component="ul"
      sx={{ listStyle: 'none', p: 0, m: 0, py: 1 }}
      aria-labelledby={titleId}
    >
      {comments.map((comment) => (
        <CommentBubble key={comment.id} comment={comment} currentUserId={currentUserId} />
      ))}
    </Box>
  );
}
