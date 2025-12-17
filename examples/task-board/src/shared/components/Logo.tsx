import { Box, Typography } from '@mui/material';
import { SpaceDashboard as SpaceDashboardIcon } from '@mui/icons-material';

interface LogoProps {
  variant?: 'full' | 'icon';
  size?: 'small' | 'medium' | 'large';
  textOnly?: boolean;
}

/**
 * TaskBoard Brand Logo Component
 */
export default function Logo({
  variant = 'full',
  size = 'medium',
  textOnly = false,
}: LogoProps) {
  const iconSizes = {
    small: 24,
    medium: 32,
    large: 48,
  };

  const textSizes = {
    small: 'h6',
    medium: 'h5',
    large: 'h4',
  } as const;

  const iconSize = iconSizes[size];
  const textVariant = textSizes[size];

  if (variant === 'icon') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <SpaceDashboardIcon
          sx={{
            fontSize: iconSize,
            color: 'secondary.main',
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        userSelect: 'none',
      }}
    >
      {!textOnly && (
        <SpaceDashboardIcon
          sx={{
            fontSize: iconSize,
            color: 'secondary.main',
          }}
        />
      )}
      <Typography
        component="h1"
        variant={textVariant}
        sx={{
          fontWeight: 700,
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.5px',
        }}
      >
        TaskBoard
      </Typography>
    </Box>
  );
}
