import { memo, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import {
  Avatar,
  Box,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Tooltip,
} from '@mui/material';
import { Clear as ClearIcon } from '@mui/icons-material';
import {
  TaskStatus,
  TaskPriority,
  type MemberOption,
  type TaskFilters,
} from '@shared/types';
import { statusOptions, priorityOptions } from './tasksTableConfig';
import type { SelectChangeEvent } from '@mui/material';

interface TasksTableFiltersProps {
  filters: TaskFilters;
  memberOptions: MemberOption[];
}

/**
 * TasksTableFilters - Filter controls for the tasks table
 */
function TasksTableFilters({ filters, memberOptions }: TasksTableFiltersProps) {
  const [, setSearchParams] = useSearchParams();

  const {
    status: statusFilter,
    priority: priorityFilter,
    assigneeId: assigneeFilter,
  } = filters;

  const handleStatusFilterChange = useCallback(
    (event: SelectChangeEvent<TaskStatus[]>) => {
      const value = event.target.value;
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.delete('status');

        const values = typeof value === 'string' ? value.split(',') : value;
        values.forEach((s) => {
          if (s) newParams.append('status', s);
        });

        newParams.set('page', '0');
        return newParams;
      });
    },
    [setSearchParams],
  );

  const handlePriorityFilterChange = useCallback(
    (event: SelectChangeEvent<TaskPriority[]>) => {
      const value = event.target.value;
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.delete('priority');

        const values = typeof value === 'string' ? value.split(',') : value;
        values.forEach((p) => {
          if (p) newParams.append('priority', p);
        });

        newParams.set('page', '0');
        return newParams;
      });
    },
    [setSearchParams],
  );

  const handleAssigneeFilterChange = useCallback(
    (event: SelectChangeEvent<string[]>) => {
      const value = event.target.value;
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.delete('assigneeId');

        const values = typeof value === 'string' ? value.split(',') : value;
        values.forEach((id) => {
          if (id) newParams.append('assigneeId', id);
        });

        newParams.set('page', '0');
        return newParams;
      });
    },
    [setSearchParams],
  );

  const handleClearAssigneeFilter = useCallback(() => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.delete('assigneeId');
      newParams.set('page', '0');
      return newParams;
    });
  }, [setSearchParams]);

  return (
    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Assignee</InputLabel>
        <Select
          multiple
          value={assigneeFilter}
          onChange={handleAssigneeFilterChange}
          input={<OutlinedInput label="Assignee" />}
          endAdornment={
            assigneeFilter.length > 0 && (
              <InputAdornment position="end" sx={{ mr: 2 }}>
                <Tooltip title="Clear filter">
                  <IconButton
                    size="small"
                    onClick={handleClearAssigneeFilter}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            )
          }
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((id) => {
                const member = memberOptions.find((m) => m.id === id);
                return <Chip key={id} label={member?.name || id} size="small" />;
              })}
            </Box>
          )}
        >
          {memberOptions.map((member) => (
            <MenuItem key={member.id} value={member.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar src={member.avatar} sx={{ width: 24, height: 24 }}>
                  {member.name.charAt(0)}
                </Avatar>
                {member.name}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Status</InputLabel>
        <Select
          multiple
          value={statusFilter}
          onChange={handleStatusFilterChange}
          input={<OutlinedInput label="Status" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => (
                <Chip key={value} label={value} size="small" />
              ))}
            </Box>
          )}
        >
          {statusOptions.map((status) => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Priority</InputLabel>
        <Select
          multiple
          value={priorityFilter}
          onChange={handlePriorityFilterChange}
          input={<OutlinedInput label="Priority" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => (
                <Chip key={value} label={value} size="small" />
              ))}
            </Box>
          )}
        >
          {priorityOptions.map((priority) => (
            <MenuItem key={priority} value={priority}>
              {priority}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
}

export default memo(TasksTableFilters);
