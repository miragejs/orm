import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { describe, expect, test, beforeAll, afterAll, afterEach } from '@test/context';
import { handlers } from '@test/server/handlers';
import { renderApp } from '@test/utils';

const server = setupServer(...handlers);

describe('Team', () => {
  const ui = userEvent.setup();

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  afterEach(() => {
    server.resetHandlers();
    document.cookie = 'userId=""; Max-Age=-1';
  });

  afterAll(() => server.close());

  test('displays team info section with team name and department', async ({ schema }) => {
    const user = schema.users.create();
    const { team } = user;
    document.cookie = `userId=${user.id}`;
    const formattedDate = new Date(team.createdAt).toLocaleDateString();

    renderApp(`/${team.slug}/users/${user.id}/team`);

    await screen.findByLabelText('Loading team info');

    // Wait for the team info section to load
    const teamInfoSection = within(
      await screen.findByRole('region', { name: team.name }),
    );
    expect(teamInfoSection.getByText(team.department)).toBeInTheDocument();
    expect(teamInfoSection.getByText(team.description)).toBeInTheDocument();
    expect(teamInfoSection.getByText(`Created: ${formattedDate}`)).toBeInTheDocument();
  });

  test('displays manager section with manager information', async ({ schema }) => {
    const manager = schema.users.create('manager');
    const { team } = manager;
    // Link manager to team
    team.update({ managerId: manager.id });
    document.cookie = `userId=${manager.id}`;

    renderApp(`/${team.slug}/users/${manager.id}/team`);

    await screen.findByLabelText('Loading team info');

    // Wait for the manager section to load
    const managerSection = within(
      await screen.findByRole('region', { name: 'Team Manager' }),
    );
    expect(managerSection.getByText(manager.name)).toBeInTheDocument();
    expect(managerSection.getByText(manager.role)).toBeInTheDocument();
    expect(managerSection.getByText(manager.email)).toBeInTheDocument();
  });

  test('displays empty manager state when no manager assigned', async ({ schema }) => {
    const user = schema.users.create();
    const { team } = user;
    // Team has no manager by default (managerId is empty string)
    document.cookie = `userId=${user.id}`;

    renderApp(`/${team.slug}/users/${user.id}/team`);

    await screen.findByLabelText('Loading team info');

    // Wait for the manager section to load
    const managerSection = within(
      await screen.findByRole('region', { name: 'Team Manager' }),
    );
    expect(managerSection.getByText('No manager assigned')).toBeInTheDocument();
  });

  test('displays team members table with headers and pagination', async ({ schema }) => {
    const team = schema.teams.create('withMembers');
    const user = schema.users.create({ team });
    document.cookie = `userId=${user.id}`;

    renderApp(`/${team.slug}/users/${user.id}/team`);

    await screen.findByLabelText('Loading team members');

    // Wait for the members section to load
    const membersSection = within(
      await screen.findByRole('region', { name: 'Team Members (11)' }),
    );
    const membersTable = within(membersSection.getByRole('table'));

    // Check table headers
    expect(membersTable.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(membersTable.getByRole('columnheader', { name: 'Role' })).toBeInTheDocument();
    expect(membersTable.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument();

    // Check table rows (excluding header row)
    expect(membersTable.getAllByRole('row').slice(1)).toHaveLength(5);

    // Check pagination shows total count
    expect(membersSection.getByText('1–5 of 11')).toBeInTheDocument();
  });

  test('supports pagination in members table', async ({ schema }) => {
    const team = schema.teams.create('withMembers');
    const user = schema.users.create({ team });
    document.cookie = `userId=${user.id}`;

    renderApp(`/${team.slug}/users/${user.id}/team`);

    await screen.findByLabelText('Loading team members');

    // Wait for members table to load
    const membersSection = within(
      await screen.findByRole('region', { name: 'Team Members (11)' }),
    );

    // Navigate to next page
    const nextPageButton = membersSection.getByRole('button', {
      name: 'Go to next page',
    });
    await ui.click(nextPageButton);

    // Should show remaining members
    await waitFor(() => {
      expect(membersSection.getByText('6–10 of 11')).toBeInTheDocument();
    });
  });

  test('supports sorting in members table', async ({ schema }) => {
    const user = schema.users.create({ name: 'John' });
    const { team } = user;
    document.cookie = `userId=${user.id}`;

    schema.users.create({ name: 'Alice', team });
    schema.users.create({ name: 'Bob', team });

    renderApp(`/${team.slug}/users/${user.id}/team`);

    // Wait for members table to load
    const membersSection = within(
      await screen.findByRole('region', { name: 'Team Members (3)' }),
    );

    // Get the columnheader for name (aria-sort is on the columnheader, not the button)
    const nameColumnHeader = membersSection.getByRole('columnheader', {
      name: 'Name',
    });
    expect(nameColumnHeader).toHaveAttribute('aria-sort', 'ascending');

    await waitFor(() => {
      const rows = membersSection.getAllByRole('row').slice(1);
      expect(rows[0]).toHaveTextContent('Alice');
      expect(rows[1]).toHaveTextContent('Bob');
      expect(rows[2]).toHaveTextContent('John');
    });

    // Click on name column to toggle sort order
    const nameSortButton = within(nameColumnHeader).getByRole('button');
    await ui.click(nameSortButton);

    // Verify sort indicator changes (descending after click on ascending)
    await waitFor(() => {
      const rows = membersSection.getAllByRole('row').slice(1);
      expect(rows[0]).toHaveTextContent('John');
      expect(rows[1]).toHaveTextContent('Bob');
      expect(rows[2]).toHaveTextContent('Alice');
    });

    expect(nameColumnHeader).toHaveAttribute('aria-sort', 'descending');
  });

  test('displays manager avatar and bio when available', async ({ schema }) => {
    const manager = schema.users.create('manager', {
      bio: 'Test bio',
    });
    const { team } = manager;
    // Link manager to team
    team.update({ managerId: manager.id });
    document.cookie = `userId=${manager.id}`;

    renderApp(`/${team.slug}/users/${manager.id}/team`);

    await screen.findByLabelText('Loading team info');

    // Wait for manager section to load
    const managerSection = within(
      await screen.findByRole('region', { name: 'Team Manager' }),
    );

    // Verify name
    expect(managerSection.getByText(manager.name)).toBeInTheDocument();

    // Verify avatar
    const avatar = managerSection.getByRole('img', { name: manager.name });
    expect(avatar).toHaveAttribute('src', manager.avatar);

    // Verify bio (quotes are rendered as separate entities)
    expect(managerSection.getByText(/Test bio/)).toBeInTheDocument();
  });
});
