import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  Box,
} from '@mui/material';
import { useNavigate } from 'react-router';
import { logout } from '@/features/auth/api';
import { Logo } from '@shared/components/ErrorBoundary';
import type { User } from '@shared/types';

interface HeaderProps {
  user: User;
}

/**
 * Header Component with user menu and logout
 */
export default function Header({ user }: HeaderProps) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
    handleMenuClose();
  };

  return (
    <AppBar
      position="static"
      color="default"
      elevation={1}
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Brand Logo */}
        <Logo size="small" />

        {/* User Avatar and Menu */}
        <IconButton onClick={handleMenuOpen} sx={{ ml: 2 }}>
          <Avatar src={user.avatar} alt={user.name}>
            {user.name.charAt(0)}
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              {user.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user.role}
            </Typography>
          </Box>
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
