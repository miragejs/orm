import { useMemo } from 'react';
import { useNavigate, useLocation, useRouteLoaderData } from 'react-router';
import {
  Assignment as AssignmentIcon,
  Groups as GroupsIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  IconButton,
  Tooltip,
} from '@mui/material';
import kebabCase from 'lodash.kebabcase';
import { logout } from '@features/auth/api';
import { Logo } from '@shared/components';
import { UserRole } from '@shared/types';
import type { AppLoaderData } from '../AppLayout';

const DRAWER_WIDTH = 72;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

/**
 * Sidebar Navigation Component - Shows role-based navigation items
 */
export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useRouteLoaderData('root') as AppLoaderData;

  const teamSlug = useMemo(() => kebabCase(user.team.name), [user.team.name]);

  const navItems = useMemo((): NavItem[] => {
    if (user.role === UserRole.MANAGER) {
      return [
        {
          label: 'Dashboard',
          path: `/${teamSlug}/dashboard`,
          icon: <DashboardIcon />,
        },
      ];
    }

    return [
      {
        icon: <AssignmentIcon />,
        label: 'My Tasks',
        path: `/${teamSlug}/users/${user.id}`,
      },
      {
        label: 'Team',
        path: `/${teamSlug}/users/${user.id}/team`,
        icon: <GroupsIcon />,
      },
    ];
  }, [user.role, user.id, teamSlug]);

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

  const isActivePath = (itemPath: string) => {
    return location.pathname.endsWith(itemPath);
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
      {/* Logo Icon */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: 2,
        }}
      >
        <Logo variant="icon" size="medium" />
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
        <List sx={{ px: 1.5 }}>
          {navItems.map((item) => {
            const isActive = isActivePath(item.path);

            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
                <Tooltip title={item.label} placement="right" arrow>
                  <ListItemButton
                    selected={isActive}
                    onClick={() => handleNavigate(item.path)}
                    sx={{
                      borderRadius: 2,
                      minHeight: 48,
                      justifyContent: 'center',
                      px: 0,
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
                        minWidth: 'auto',
                        justifyContent: 'center',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Logout Button */}
      <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'center' }}>
        <Tooltip title="Logout" placement="right" arrow>
          <IconButton
            onClick={handleLogout}
            sx={{
              color: 'error.main',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                backgroundColor: 'error.main',
                color: 'white',
              },
            }}
          >
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Drawer>
  );
}
