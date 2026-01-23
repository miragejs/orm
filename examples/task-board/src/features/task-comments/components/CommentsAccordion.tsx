import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CommentIcon from '@mui/icons-material/Comment';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CommentsList } from './CommentsList';
import type { Comment } from '@shared/types';

export interface CommentsAccordionProps {
  comments: Comment[];
  currentUserId: string | undefined;
}

/**
 * Comments Accordion Content - Renders once comments are resolved
 */
export function CommentsAccordion({ comments, currentUserId }: CommentsAccordionProps) {
  return (
    <Accordion
      defaultExpanded={comments.length > 0}
      sx={{
        '&:before': { display: 'none' },
        boxShadow: 'none',
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CommentIcon />
          <Typography variant="h6">Comments ({comments.length})</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <CommentsList comments={comments} currentUserId={currentUserId} />
      </AccordionDetails>
    </Accordion>
  );
}
