import { useState } from 'react';
import { Form, useActionData, useSubmit } from 'react-router';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { TaskPriority, TaskStatus } from '@shared/enums';
import {
  getDefaultTaskFormValues,
  getTaskFormValues,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
} from '@shared/utils';
import type { Task, TaskFormValues, UserInfo } from '@shared/types';

interface TaskFormFieldsProps {
  defaultAssigneeId: string | undefined;
  members: UserInfo[];
  redirectTo: string;
  task: Task | null;
  taskId: string;
}

/**
 * Form with state management for create/edit task.
 * Owns form values state, Form wrapper, and submit via useSubmit (JSON).
 */
export default function TaskFormFields({
  defaultAssigneeId,
  members,
  redirectTo,
  task,
  taskId,
}: TaskFormFieldsProps) {
  const actionData = useActionData<{ error?: string }>();
  const submit = useSubmit();

  const [values, setValues] = useState<TaskFormValues>(() =>
    task ? getTaskFormValues(task) : getDefaultTaskFormValues(members, defaultAssigneeId),
  );

  const updateValues = (patch: Partial<TaskFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { assigneeId, description, dueDate, title } = values;
    const payload = {
      ...values,
      title: title?.trim() || '',
      description: description?.trim() || '',
      assigneeId: assigneeId ?? null,
      dueDate: dueDate ? new Date(dueDate).toISOString() : '',
      redirectTo,
      taskId,
    };

    submit(payload, {
      encType: 'application/json',
      method: 'post',
    });
  };

  return (
    <Form aria-label="Task form" id="task-form" onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        {actionData?.error && <Alert severity="error">{actionData.error}</Alert>}

        <TextField
          autoFocus
          fullWidth
          label="Title"
          name="title"
          onChange={(e) => updateValues({ title: e.target.value })}
          required
          value={values.title}
        />
        <TextField
          fullWidth
          label="Description"
          minRows={2}
          multiline
          name="description"
          onChange={(e) => updateValues({ description: e.target.value })}
          value={values.description}
        />
        <FormControl fullWidth>
          <InputLabel id="status-label" htmlFor="status">
            Status
          </InputLabel>
          <Select
            label="Status"
            labelId="status-label"
            name="status"
            onChange={(e) => updateValues({ status: e.target.value as TaskStatus })}
            value={values.status}
          >
            {STATUS_OPTIONS.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel id="priority-label" htmlFor="priority">
            Priority
          </InputLabel>
          <Select
            label="Priority"
            labelId="priority-label"
            name="priority"
            onChange={(e) => updateValues({ priority: e.target.value as TaskPriority })}
            value={values.priority}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          InputLabelProps={{ shrink: true }}
          fullWidth
          label="Due date"
          name="dueDate"
          onChange={(e) => updateValues({ dueDate: e.target.value })}
          required
          type="date"
          value={values.dueDate}
        />
        <FormControl fullWidth>
          <InputLabel id="assignee-label" htmlFor="assigneeId">
            Assignee
          </InputLabel>
          <Select
            label="Assignee"
            labelId="assignee-label"
            name="assigneeId"
            onChange={(e) => updateValues({ assigneeId: e.target.value })}
            value={values.assigneeId}
          >
            {members.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Form>
  );
}
