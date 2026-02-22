import { render, screen, within } from '@testing-library/react';
import { describe, expect, test } from '@test/context';
import { userInfoSerializer } from '@test/schema/collections/users';
import { renderWithRouter } from '@test/utils';
import MembersTable from './MembersTable';
import MembersTableSkeleton from './MembersTableSkeleton';
import MembersTableError from './MembersTableError';
import type { GetTeamMembersResponse } from '../api';
import type { UserInfo } from '@shared/types';
import type { TestSchema } from '@test/schema';

describe('MembersTable', () => {
  function createMembers(schema: TestSchema) {
    return schema.users.createMany(3).serialize(userInfoSerializer);
  }

  function createResponse(
    members: UserInfo[],
    overrides?: Partial<Omit<GetTeamMembersResponse, 'members'>>,
  ): GetTeamMembersResponse {
    return {
      members,
      total: overrides?.total ?? members.length,
      page: overrides?.page ?? 0,
      pageSize: overrides?.pageSize ?? 5,
      sortBy: overrides?.sortBy ?? 'name',
      sortOrder: overrides?.sortOrder ?? 'asc',
    };
  }

  test('renders as a section with accessible name and title', ({ schema }) => {
    const members = createMembers(schema);
    const data = createResponse(members);

    renderWithRouter(<MembersTable data={data} />);

    const section = screen.getByRole('region', {
      name: `Team Members (${members.length})`,
    });
    expect(section).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: `Team Members (${members.length})`, level: 3 }),
    ).toBeInTheDocument();
  });

  test('renders table column headers', ({ schema }) => {
    const members = createMembers(schema);
    const data = createResponse(members);

    renderWithRouter(<MembersTable data={data} />);

    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Role' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument();
  });

  test('renders member data in table rows', ({ schema }) => {
    const members = createMembers(schema);
    const data = createResponse(members);

    renderWithRouter(<MembersTable data={data} />);

    for (const member of members) {
      expect(screen.getByText(member.name)).toBeInTheDocument();
      expect(screen.getByText(member.email)).toBeInTheDocument();
    }
  });

  test('renders member avatar', ({ schema }) => {
    const members = createMembers(schema);
    const data = createResponse(members);

    renderWithRouter(<MembersTable data={data} />);

    for (const member of members) {
      const avatar = screen.getByRole('img', { name: member.name });
      expect(avatar).toHaveAttribute('src', member.avatar);
    }
  });

  test('renders pagination controls', ({ schema }) => {
    const members = createMembers(schema);
    const data = createResponse(members, { total: 15 });

    renderWithRouter(<MembersTable data={data} />);

    expect(screen.getByText('1–5 of 15')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Go to previous page' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Rows per page:' })).toBeInTheDocument();
  });

  test('shows sort indicator on sorted column', ({ schema }) => {
    const members = createMembers(schema);
    const ascData = createResponse(members, { sortBy: 'name', sortOrder: 'asc' });

    renderWithRouter(<MembersTable data={ascData} />);

    const nameColumnHeader = screen.getByRole('columnheader', { name: 'Name' });
    expect(nameColumnHeader).toHaveAttribute('aria-sort', 'ascending');
  });

  test('disables pagination buttons appropriately', ({ schema }) => {
    const members = createMembers(schema);

    // First page - previous disabled
    const firstPageData = createResponse(members, { page: 0, total: 15 });
    const { unmount } = renderWithRouter(<MembersTable data={firstPageData} />);
    expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeDisabled();
    unmount();

    // Last page - next disabled
    const lastPageData = createResponse(members, { page: 2, pageSize: 5, total: 15 });
    renderWithRouter(<MembersTable data={lastPageData} />);
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeDisabled();
  });

  test('renders all elements within section', ({ schema }) => {
    const members = createMembers(schema);
    const data = createResponse(members);

    renderWithRouter(<MembersTable data={data} />);

    const section = screen.getByRole('region', {
      name: `Team Members (${members.length})`,
    });
    expect(within(section).getByRole('table')).toBeInTheDocument();
    expect(
      within(section).getByRole('combobox', { name: 'Rows per page:' }),
    ).toBeInTheDocument();
  });
});

describe('MembersTableSkeleton', () => {
  test('renders with loading aria-label', () => {
    render(<MembersTableSkeleton />);

    expect(screen.getByLabelText('Loading team members')).toBeInTheDocument();
  });
});

describe('MembersTableError', () => {
  test('renders as a section with accessible name', () => {
    const error = new Error('Failed to load members');

    render(<MembersTableError error={error} />);

    const section = screen.getByRole('region', { name: 'Team Members Unavailable' });
    expect(section).toBeInTheDocument();
  });

  test('renders error title as heading', () => {
    const error = new Error('Failed to load members');

    render(<MembersTableError error={error} />);

    expect(
      screen.getByRole('heading', { name: 'Team Members Unavailable', level: 3 }),
    ).toBeInTheDocument();
  });

  test('renders error message', () => {
    const error = new Error('Server timeout');

    render(<MembersTableError error={error} />);

    expect(screen.getByText('Server timeout')).toBeInTheDocument();
  });

  test('renders error icon', () => {
    const error = new Error('Failed to load members');

    render(<MembersTableError error={error} />);

    expect(screen.getByTestId('ErrorOutlineIcon')).toBeInTheDocument();
  });
});
