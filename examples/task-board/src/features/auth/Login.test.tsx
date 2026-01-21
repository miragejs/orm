import { screen } from '@testing-library/react';
import { test, describe, expect } from '@test/context';
import { renderWithRouter } from '@test/utils';
import Login from './Login';

describe('Login', () => {
  test('renders login page with LoginForm', () => {
    renderWithRouter({ element: <Login /> });

    expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
  });
});
