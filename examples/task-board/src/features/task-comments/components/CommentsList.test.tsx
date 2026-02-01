import { render, screen } from '@testing-library/react';
import { describe, test, expect } from '@test/context';
import { CommentsList } from './CommentsList';

describe('CommentsList', () => {
  test('renders empty state when no comments', () => {
    render(
      <CommentsList comments={[]} currentUserId="user-1" titleId="comments-title" />,
    );

    expect(screen.getByText('No comments yet')).toBeInTheDocument();
  });

  test('renders list of comments', ({ schema }) => {
    const comments = schema.comments.createMany(3).toJSON();

    render(
      <CommentsList
        comments={comments}
        currentUserId="user-1"
        titleId="comments-title"
      />,
    );

    for (const comment of comments) {
      expect(screen.getByText(comment.content)).toBeInTheDocument();
    }
  });

  test('renders comments as list items', ({ schema }) => {
    const comments = schema.comments.createMany(2).toJSON();

    render(
      <CommentsList
        comments={comments}
        currentUserId="user-1"
        titleId="comments-title"
      />,
    );

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(2);
  });

  test('renders list with aria-labelledby for accessibility', ({ schema }) => {
    const comments = schema.comments.createMany(1).toJSON();

    render(
      <CommentsList
        comments={comments}
        currentUserId="user-1"
        titleId="my-comments-title"
      />,
    );

    const list = screen.getByRole('list');
    expect(list).toHaveAttribute('aria-labelledby', 'my-comments-title');
  });

  test('passes currentUserId to each CommentBubble', ({ schema }) => {
    const author = schema.users.create();
    const comments = schema.comments.createMany(1, { author }).toJSON();

    render(
      <CommentsList comments={comments} currentUserId={author.id} titleId="title" />,
    );

    // Current user's comment should be styled with flex-start
    const listItem = screen.getByRole('listitem');
    expect(listItem).toHaveStyle({ justifyContent: 'flex-start' });
  });

  test('renders comments with different authors', ({ schema }) => {
    const [user1, user2] = schema.users.createMany(2).toJSON();
    schema.comments.create({ authorId: user1.id });
    schema.comments.create({ authorId: user2.id });

    const comments = schema.comments.all().toJSON();

    render(<CommentsList comments={comments} currentUserId={user1.id} titleId="title" />);

    expect(screen.getByText(user1.name)).toBeInTheDocument();
    expect(screen.getByText(user2.name)).toBeInTheDocument();
  });
});
