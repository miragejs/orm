import { Box, Typography } from '@mui/material';
import { Dashboard as DashboardIcon } from '@mui/icons-material';

interface LogoProps {
  variant?: 'full' | 'icon';
  size?: 'small' | 'medium' | 'large';
}

/**
 * TaskBoard Brand Logo Component
 */
export default function Logo({ variant = 'full', size = 'medium' }: LogoProps) {
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
        <DashboardIcon
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
      <DashboardIcon
        sx={{
          fontSize: iconSize,
          color: 'secondary.main',
        }}
      />
      <Typography
        variant={textVariant}
        component="span"
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
