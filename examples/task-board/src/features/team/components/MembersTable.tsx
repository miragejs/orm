import { memo, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Box,
} from '@mui/material';
import { updateSearchParams } from '@shared/utils';
import { defaultMembersParams } from '../api';
import type {
  GetTeamMembersResponse,
  GetTeamMembersParams,
  SortableColumn,
} from '../api';

interface MembersTableProps {
  data: GetTeamMembersResponse;
}

interface ColumnConfig {
  id: SortableColumn;
  label: string;
}

const columns: ColumnConfig[] = [
  { id: 'name', label: 'Name' },
  { id: 'role', label: 'Role' },
  { id: 'email', label: 'Email' },
];

/**
 * Members Table - Displays team members with server-side pagination and sorting
 * State is managed via URL search params, triggering loader on change
 */
function MembersTable({ data }: MembersTableProps) {
  const { members, total, page, pageSize, sortBy, sortOrder } = data;
  const [, setSearchParams] = useSearchParams();

  const updateParams = useCallback(
    (updates: Partial<GetTeamMembersParams>) => {
      setSearchParams((prev) => updateSearchParams(prev, updates, defaultMembersParams));
    },
    [setSearchParams],
  );

  const handlePageChange = (_event: unknown, newPage: number) => {
    updateParams({ page: newPage });
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateParams({ pageSize: parseInt(event.target.value, 10), page: 0 });
  };

  const handleSort = (column: SortableColumn) => {
    const isAsc = sortBy === column && sortOrder === 'asc';
    updateParams({ sortBy: column, sortOrder: isAsc ? 'desc' : 'asc', page: 0 });
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h6" component="h3">
            Team Members ({total})
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={60}></TableCell>
                {columns.map((column) => (
                  <TableCell key={column.id}>
                    <TableSortLabel
                      active={sortBy === column.id}
                      direction={sortBy === column.id ? sortOrder : 'asc'}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id} hover>
                  <TableCell>
                    <Avatar
                      src={member.avatar}
                      alt={member.name}
                      sx={{ width: 32, height: 32 }}
                    >
                      {member.name.charAt(0)}
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {member.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {member.role}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {member.email}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={pageSize}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </CardContent>
    </Card>
  );
}

export default memo(MembersTable);
