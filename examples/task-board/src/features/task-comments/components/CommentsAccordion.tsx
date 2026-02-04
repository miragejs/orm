import { useId } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CommentIcon from '@mui/icons-material/Comment';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CommentForm } from './CommentForm';
import { CommentsList } from './CommentsList';
import type { Comment } from '@shared/types';

export interface CommentsAccordionProps {
  comments: Comment[];
  currentUserId: string | undefined;
  taskId: string;
}

export function CommentsAccordion({
  comments,
  currentUserId,
  taskId,
}: CommentsAccordionProps) {
  const titleId = useId();
  const contentId = useId();

  return (
    <Accordion
      defaultExpanded={comments.length > 0}
      sx={{
        '&:before': { display: 'none' },
        boxShadow: 'none',
      }}
    >
      <AccordionSummary
        id={titleId}
        aria-controls={contentId}
        expandIcon={<ExpandMoreIcon />}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CommentIcon aria-hidden />
          <Typography variant="h6">Comments ({comments.length})</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails id={contentId} role="region" aria-labelledby={titleId}>
        <CommentsList
          comments={comments}
          currentUserId={currentUserId}
          titleId={titleId}
        />
        <CommentForm taskId={taskId} />
      </AccordionDetails>
    </Accordion>
  );
}
