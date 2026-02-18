import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect } from '@test/context';
import { renderWithRouter } from '@test/utils';
import { CommentsAccordion } from './CommentsAccordion';

describe('CommentsAccordion', () => {
  test('renders accordion with comment count', ({ schema }) => {
    const comments = schema.comments.createMany(3).toJSON();

    renderWithRouter(
      <CommentsAccordion comments={comments} currentUserId="user-1" taskId="task-1" />,
    );

    expect(screen.getByText(`Comments (${comments.length})`)).toBeInTheDocument();
  });

  test('displays zero count when no comments', () => {
    renderWithRouter(
      <CommentsAccordion comments={[]} currentUserId="user-1" taskId="task-1" />,
    );

    expect(screen.getByText('Comments (0)')).toBeInTheDocument();
  });

  test('is expanded by default when there are comments', ({ schema }) => {
    const comments = schema.comments.createMany(1).toJSON();

    renderWithRouter(
      <CommentsAccordion comments={comments} currentUserId="user-1" taskId="task-1" />,
    );

    // When expanded, the button should have aria-expanded="true"
    const button = screen.getByRole('button', { name: 'Comments (1)' });
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  test('is collapsed by default when there are no comments', () => {
    renderWithRouter(
      <CommentsAccordion comments={[]} currentUserId="user-1" taskId="task-1" />,
    );

    // When collapsed, the button should have aria-expanded="false"
    const button = screen.getByRole('button', { name: 'Comments (0)' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  test('can toggle accordion open and closed', async ({ schema }) => {
    const ui = userEvent.setup();
    const comments = schema.comments.createMany(1).toJSON();

    renderWithRouter(
      <CommentsAccordion comments={comments} currentUserId="user-1" taskId="task-1" />,
    );
    const button = screen.getByRole('button', { name: `Comments (${comments.length})` });

    // Initially expanded
    expect(button).toHaveAttribute('aria-expanded', 'true');

    // Click to collapse
    await ui.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');

    // Click to expand again
    await ui.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  test('shows empty state message when no comments and expanded', async () => {
    const ui = userEvent.setup();

    renderWithRouter(
      <CommentsAccordion comments={[]} currentUserId="user-1" taskId="task-1" />,
    );

    // Expand the accordion first (collapsed by default when empty)
    const button = screen.getByRole('button', { name: 'Comments (0)' });
    await ui.click(button);

    expect(screen.getByText('No comments yet')).toBeInTheDocument();
  });

  test('renders all comments in the list', ({ schema }) => {
    const comments = schema.comments.createMany(3).toJSON();

    renderWithRouter(
      <CommentsAccordion comments={comments} currentUserId="user-1" taskId="task-1" />,
    );

    for (const comment of comments) {
      expect(screen.getByText(comment.content)).toBeInTheDocument();
    }
  });

  test('passes currentUserId to comments', ({ schema }) => {
    const author = schema.users.create();
    const comments = schema.comments.createMany(1, { author }).toJSON();

    renderWithRouter(
      <CommentsAccordion comments={comments} currentUserId={author.id} taskId="task-1" />,
    );

    // Current user's comment should have flex-start styling
    const listItem = screen.getByRole('listitem');
    expect(listItem).toHaveStyle({ justifyContent: 'flex-start' });
  });

  test('has accessible structure with aria controls', ({ schema }) => {
    const comments = schema.comments.createMany(1).toJSON();

    renderWithRouter(
      <CommentsAccordion comments={comments} currentUserId="user-1" taskId="task-1" />,
    );

    const button = screen.getByRole('button', { name: 'Comments (1)' });

    // Button should have aria-controls attribute
    expect(button).toHaveAttribute('aria-controls');
    const controlsId = button.getAttribute('aria-controls');

    // The controlled region should exist with matching id
    expect(document.getElementById(controlsId!)).toBeInTheDocument();
  });

  test('renders comment icon', () => {
    renderWithRouter(
      <CommentsAccordion comments={[]} currentUserId="user-1" taskId="task-1" />,
    );

    expect(screen.getByTestId('CommentIcon')).toBeInTheDocument();
  });
});
