import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, describe, expect } from '@test/context';
import { UserRole } from '@shared/enums';
import Header from './Header';

describe('Header', () => {
  test('renders user avatar', ({ schema }) => {
    const user = schema.users.create();
    const json = user.toJSON();

    render(<Header user={json.user} />);

    const avatar = screen.getByRole('img', { name: user.name });
    expect(avatar).toBeInTheDocument();
  });

  test('opens menu when avatar is clicked', async ({ schema }) => {
    const user = schema.users.create('manager');
    const json = user.toJSON();

    render(<Header user={json.user} />);

    const avatarButton = screen.getByRole('button');
    await userEvent.click(avatarButton);

    expect(screen.getByText(user.name)).toBeInTheDocument();
    expect(screen.getByText(UserRole.MANAGER)).toBeInTheDocument();
  });

  test('closes menu when pressing Escape', async ({ schema }) => {
    const user = schema.users.create();
    const json = user.toJSON();

    render(<Header user={json.user} />);

    const avatarButton = screen.getByRole('button');
    await userEvent.click(avatarButton);

    // Menu should be open
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // Press Escape to close menu
    await userEvent.keyboard('{Escape}');

    // Menu should be closed
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
