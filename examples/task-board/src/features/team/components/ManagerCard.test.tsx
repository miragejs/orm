import { render, screen } from '@testing-library/react';
import { describe, expect, test } from '@test/context';
import { userInfoSerializer } from '@test/schema/collections/users';
import ManagerCard from './ManagerCard';
import ManagerCardSkeleton from './ManagerCardSkeleton';
import ManagerCardError from './ManagerCardError';

describe('ManagerCard', () => {
  test('renders as a section with accessible name and title', ({ schema }) => {
    const manager = schema.users.create().serialize(userInfoSerializer);

    render(<ManagerCard manager={manager} />);

    const section = screen.getByRole('region', { name: 'Team Manager' });
    expect(section).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Team Manager', level: 3 }),
    ).toBeInTheDocument();
  });

  test('renders manager information', ({ schema }) => {
    const manager = schema.users.create('manager').serialize(userInfoSerializer);

    render(<ManagerCard manager={manager} />);

    expect(screen.getByText(manager.name)).toBeInTheDocument();
    expect(screen.getByText(manager.role)).toBeInTheDocument();
    expect(screen.getByText(manager.email)).toBeInTheDocument();
  });

  test('renders manager avatar image', ({ schema }) => {
    const manager = schema.users.create().serialize(userInfoSerializer);

    render(<ManagerCard manager={manager} />);

    const avatar = screen.getByRole('img', { name: manager.name });
    expect(avatar).toHaveAttribute('src', manager.avatar);
  });

  test('renders manager bio when available', ({ schema }) => {
    const manager = schema.users
      .create({ bio: 'Test bio' })
      .serialize(userInfoSerializer);

    render(<ManagerCard manager={manager} />);

    // Bio is rendered with curly quotes as separate text nodes, match the p element
    expect(screen.getByText(/Test bio/)).toBeInTheDocument();
  });
});

describe('ManagerCardSkeleton', () => {
  test('renders with loading aria-label', () => {
    render(<ManagerCardSkeleton />);

    expect(screen.getByLabelText('Loading manager info')).toBeInTheDocument();
  });
});

describe('ManagerCardError', () => {
  test('renders as a section with accessible name', () => {
    const error = new Error('Failed to load manager');

    render(<ManagerCardError error={error} />);

    const section = screen.getByRole('region', { name: 'Manager Info Unavailable' });
    expect(section).toBeInTheDocument();
  });

  test('renders error title as heading', () => {
    const error = new Error('Failed to load manager');

    render(<ManagerCardError error={error} />);

    expect(
      screen.getByRole('heading', { name: 'Manager Info Unavailable', level: 3 }),
    ).toBeInTheDocument();
  });

  test('renders error message', () => {
    const error = new Error('Manager not found');

    render(<ManagerCardError error={error} />);

    expect(screen.getByText('Manager not found')).toBeInTheDocument();
  });

  test('renders error icon', () => {
    const error = new Error('Failed to load manager');

    render(<ManagerCardError error={error} />);

    expect(screen.getByTestId('ErrorOutlineIcon')).toBeInTheDocument();
  });
});
