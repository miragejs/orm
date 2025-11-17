import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Groups as GroupsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router';
import { logout } from '@features/auth/api';
import { Logo } from '@shared/components';

const DRAWER_WIDTH = 220;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <DashboardIcon />,
  },
  {
    label: 'Team',
    path: '/team',
    icon: <GroupsIcon />,
  },
];

/**
 * Sidebar Navigation Component
 */
export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          backgroundColor: 'primary.dark',
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: 3,
        }}
      >
        <Logo size="medium" />
      </Box>

      {/* Navigation Menu - Centered */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <List sx={{ px: 2 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  selected={isActive}
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    color: isActive ? 'primary.main' : 'rgba(255, 255, 255, 0.9)',
                    backgroundColor: isActive
                      ? 'rgba(255, 255, 255, 0.95)'
                      : 'transparent',
                    '&:hover': {
                      backgroundColor: isActive
                        ? 'rgba(255, 255, 255, 1)'
                        : 'rgba(255, 255, 255, 0.1)',
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 1)',
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? 'primary.main' : 'rgba(255, 255, 255, 0.7)',
                      minWidth: 40,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Logout Button */}
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Logout
        </Button>
      </Box>
    </Drawer>
  );
}
