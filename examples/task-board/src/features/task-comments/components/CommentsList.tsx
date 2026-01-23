import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { CommentBubble } from './CommentBubble';
import type { Comment } from '@shared/types';

export interface CommentsListProps {
  comments: Comment[];
  currentUserId: string | undefined;
}

/**
 * Comments List Component - Renders the list of comments
 */
export function CommentsList({ comments, currentUserId }: CommentsListProps) {
  if (comments.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No comments yet
      </Typography>
    );
  }

  return (
    <Box sx={{ py: 1 }}>
      {comments.map((comment) => (
        <CommentBubble key={comment.id} comment={comment} currentUserId={currentUserId} />
      ))}
    </Box>
  );
}
