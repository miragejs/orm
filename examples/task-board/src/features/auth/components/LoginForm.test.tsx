import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, describe, expect } from '@test/context';
import { renderWithRouter } from '@test/utils';
import LoginForm from './LoginForm';

describe('LoginForm', () => {
  const ui = userEvent.setup();

  test('renders login form with email input and submit button', () => {
    renderWithRouter(<LoginForm />);

    expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  test('submit button is disabled when email is empty', () => {
    renderWithRouter(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    expect(submitButton).toBeDisabled();
  });

  test('submit button is enabled when email is entered', async () => {
    renderWithRouter(<LoginForm />);

    const emailInput = screen.getByLabelText('Email Address');
    await ui.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    expect(submitButton).toBeEnabled();
  });

  test('copies demo email to input when copy button is clicked', async () => {
    renderWithRouter(<LoginForm />);

    const emailInput = screen.getByLabelText('Email Address');
    const copyButtons = screen.getAllByRole('button', { name: 'Copy email' });

    // Click first copy button (john.doe@example.com)
    await ui.click(copyButtons[0]);
    expect(emailInput).toHaveValue('john.doe@example.com');

    // Click second copy button (jane.smith@example.com)
    await ui.click(copyButtons[1]);
    expect(emailInput).toHaveValue('jane.smith@example.com');
  });
});
