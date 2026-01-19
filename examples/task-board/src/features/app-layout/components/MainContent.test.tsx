import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { test, describe, expect } from '@test/context';
import MainContent from './MainContent';

describe('MainContent', () => {
  test('renders welcome message with user first name', ({ schema }) => {
    const user = schema.users.create({ name: 'John Doe' }).toJSON();

    render(
      <MemoryRouter>
        <MainContent user={user} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Hello, John!')).toBeInTheDocument();
  });

  test('handles single-word names', ({ schema }) => {
    const user = schema.users.create({ name: 'Alice' });
    const json = user.toJSON();

    render(
      <MemoryRouter>
        <MainContent user={json} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Hello, Alice!')).toBeInTheDocument();
  });
});
