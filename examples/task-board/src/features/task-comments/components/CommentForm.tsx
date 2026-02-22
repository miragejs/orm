import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import SendIcon from '@mui/icons-material/Send';
import { Form, useActionData, useNavigation } from 'react-router';

export interface CommentFormProps {
  taskId: string;
}

/**
 * Form for adding new comments to a task
 */
export function CommentForm({ taskId }: CommentFormProps) {
  const [content, setContent] = useState('');
  const actionData = useActionData() as { error?: string } | undefined;
  const navigation = useNavigation();

  const value = content.trim();
  const isCurrentForm = navigation.formMethod === 'POST';
  const isSubmitting = isCurrentForm && navigation.state === 'submitting';
  const isSaved = isCurrentForm && navigation.state === 'loading';
  const isDisabled = isSubmitting || !value;

  const handleCancel = () => {
    setContent('');
  };

  // Clear form after successful submission
  const handleSubmit = () => {
    // Form will be cleared after successful action via revalidation
    setContent('');
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Form method="post" onSubmit={handleSubmit}>
        <input type="hidden" name="taskId" value={taskId} />
        <TextField
          disabled={isSubmitting}
          fullWidth
          label="Add a comment"
          maxRows={4}
          minRows={2}
          multiline
          name="content"
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your comment here..."
          value={content}
          sx={{ mb: 1 }}
        />

        {actionData?.error && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {actionData.error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            disabled={isDisabled}
            onClick={handleCancel}
            size="small"
            type="button"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            disabled={isDisabled}
            endIcon={<SendIcon />}
            loading={isSubmitting || isSaved}
            loadingPosition="end"
            size="small"
            type="submit"
            variant="contained"
          >
            Send
          </Button>
        </Box>
      </Form>
    </Box>
  );
}
