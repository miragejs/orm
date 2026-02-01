import { render, screen } from '@testing-library/react';
import { describe, test, expect } from '@test/context';
import { CommentBubble } from './CommentBubble';

describe('CommentBubble', () => {
  test('renders comment content and author name', ({ schema }) => {
    const comment = schema.comments.create().toJSON();

    render(<CommentBubble comment={comment} currentUserId="other-user" />);

    const listItem = screen.getByRole('listitem', {
      name: `Comment by ${comment.author.name}`,
    });
    expect(listItem).toBeInTheDocument();

    expect(screen.getByText(comment.author.name)).toBeInTheDocument();
    expect(screen.getByText(comment.content)).toBeInTheDocument();
  });

  test('displays formatted date', ({ schema }) => {
    const comment = schema.comments.create().toJSON();

    render(<CommentBubble comment={comment} currentUserId="other-user" />);

    const dateText = new Date(comment.createdAt).toLocaleString();
    expect(screen.getByText(dateText)).toBeInTheDocument();
  });

  test('renders avatar with author initial as fallback', ({ schema }) => {
    const author = schema.users.create({ avatar: '' });
    const comment = schema.comments.create({ author }).toJSON();

    render(<CommentBubble comment={comment} currentUserId="other-user" />);

    expect(screen.getByText(comment.author.name.charAt(0))).toBeInTheDocument();
  });

  test('renders avatar image when provided', ({ schema }) => {
    const comment = schema.comments.create().toJSON();

    render(<CommentBubble comment={comment} currentUserId="other-user" />);

    const avatar = screen.getByRole('img', { name: comment.author.name });
    expect(avatar).toHaveAttribute('src', comment.author.avatar);
  });

  test('applies current user styling when comment is from current user', ({ schema }) => {
    const comment = schema.comments.create().toJSON();

    render(<CommentBubble comment={comment} currentUserId={comment.author.id} />);

    const listItem = screen.getByRole('listitem');
    expect(listItem).toHaveStyle({ justifyContent: 'flex-start' });
  });

  test('applies other user styling when comment is from different user', ({ schema }) => {
    const comment = schema.comments.create().toJSON();

    render(<CommentBubble comment={comment} currentUserId="different-user" />);

    const listItem = screen.getByRole('listitem');
    expect(listItem).toHaveStyle({ justifyContent: 'flex-end' });
  });
});
