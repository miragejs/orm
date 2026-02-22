import { memo, useCallback } from 'react';
import { useSearchParams, useParams, Link } from 'react-router';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { formatTaskTitle } from '@shared/utils';
import type { TaskSortableColumn } from '@shared/types';
import type { GetTeamTasksResponse } from '@features/dashboard/api';
import {
  columns,
  statusColors,
  priorityColors,
  rowsPerPageOptions,
} from './tasksTableConfig';
import TasksTableFilters from './TasksTableFilters';

interface TasksTableProps {
  data: GetTeamTasksResponse;
  onEditClick: (taskId: string) => void;
  onDeleteClick?: (taskId: string) => void;
}

/**
 * TasksTable - Team tasks table with filters, sorting, and pagination
 */
function TasksTable({ data, onEditClick, onDeleteClick }: TasksTableProps) {
  const {
    filters,
    memberOptions,
    page = 0,
    pageSize = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    tasks,
    total,
  } = data;
  const { teamName } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const updateParams = useCallback(
    (updates: Record<string, string | number | undefined>) => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, value]) => {
          if (value !== undefined) {
            newParams.set(key, String(value));
          }
        });
        return newParams;
      });
    },
    [setSearchParams],
  );

  const handlePageChange = (_event: unknown, newPage: number) => {
    updateParams({ page: newPage });
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateParams({ pageSize: parseInt(event.target.value, 10), page: 0 });
  };

  const handleSort = (column: TaskSortableColumn) => {
    const isAsc = sortBy === column && sortOrder === 'asc';
    updateParams({ sortBy: column, sortOrder: isAsc ? 'desc' : 'asc', page: 0 });
  };

  return (
    <Card>
      <CardContent>
        {/* Toolbar */}
        <Box
          component="form"
          sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}
          onSubmit={(e) => e.preventDefault()}
        >
          {/* Title */}
          <Typography
            id="team-tasks-title"
            variant="h6"
            component="h3"
            sx={{ flexGrow: 1 }}
          >
            Team Tasks ({total})
          </Typography>

          {/* Filters */}
          <TasksTableFilters filters={filters} memberOptions={memberOptions} />
        </Box>

        {/* Table */}
        <TableContainer>
          <Table aria-labelledby="team-tasks-title">
            <TableHead>
              <TableRow>
                <TableCell width={60}>Assignee</TableCell>
                {columns.map((column) => {
                  const isSorted = sortBy === column.id;
                  const direction = isSorted ? sortOrder : 'asc';
                  const ariaSort = isSorted
                    ? direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined;

                  return (
                    <TableCell key={column.id} aria-sort={ariaSort}>
                      <TableSortLabel
                        active={isSorted}
                        direction={direction}
                        onClick={() => handleSort(column.id)}
                      >
                        {column.label}
                      </TableSortLabel>
                    </TableCell>
                  );
                })}
                <TableCell width={onDeleteClick ? 96 : 56} />
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task) => (
                <TableRow
                  key={task.id}
                  hover
                  sx={{
                    '& .edit-action-cell button': { opacity: 0 },
                    '&:hover .edit-action-cell button': { opacity: 1 },
                  }}
                >
                  <TableCell>
                    {task.assignee ? (
                      <Tooltip title={task.assignee.name}>
                        <Avatar
                          component={Link}
                          to={`/${teamName}/users/${task.assignee.id}`}
                          src={task.assignee.avatar}
                          alt={task.assignee.name}
                          sx={{
                            width: 32,
                            height: 32,
                            cursor: 'pointer',
                            '&:hover': { opacity: 0.8 },
                          }}
                        >
                          {task.assignee.name.charAt(0)}
                        </Avatar>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Unassigned">
                        <Avatar sx={{ width: 32, height: 32 }}>?</Avatar>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography
                      component={Link}
                      to={`/${teamName}/dashboard/${task.id}?${searchParams.toString()}`}
                      variant="body2"
                      fontWeight={500}
                      sx={{
                        color: 'inherit',
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline', color: 'primary.main' },
                      }}
                    >
                      {formatTaskTitle(task)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.status}
                      color={statusColors[task.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.priority}
                      color={priorityColors[task.priority]}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell
                    className="edit-action-cell"
                    width={onDeleteClick ? 96 : 56}
                    padding="checkbox"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Tooltip title="Edit task">
                        <IconButton
                          size="small"
                          aria-label="Edit task"
                          onClick={() => onEditClick(task.id)}
                          sx={{ transition: 'opacity 0.2s ease-in-out' }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {onDeleteClick && (
                        <Tooltip title="Delete task">
                          <IconButton
                            size="small"
                            aria-label="Delete task"
                            color="error"
                            onClick={() => onDeleteClick(task.id)}
                            sx={{ transition: 'opacity 0.2s ease-in-out' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={pageSize}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={rowsPerPageOptions}
        />
      </CardContent>
    </Card>
  );
}

export default memo(TasksTable);
