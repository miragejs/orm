import { screen } from '@testing-library/react';
import { test, describe, expect } from '@test/context';
import MainContent from './MainContent';
import { renderWithRouter } from '@test/utils';

describe('MainContent', () => {
  test('renders welcome message with user first name', ({ schema }) => {
    const user = schema.users.create({ name: 'John Doe' }).toJSON();

    renderWithRouter(<MainContent user={user} />);

    expect(screen.getByText('Hello, John!')).toBeInTheDocument();
  });

  test('handles single-word names', ({ schema }) => {
    const user = schema.users.create({ name: 'Alice' }).toJSON();

    renderWithRouter(<MainContent user={user} />);

    expect(screen.getByText('Hello, Alice!')).toBeInTheDocument();
  });
});
