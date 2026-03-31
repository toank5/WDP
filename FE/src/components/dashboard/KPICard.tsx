import { Card, CardContent, Box, Typography, Chip, SxProps, Theme } from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material'

export type KPITrend = 'up' | 'down' | 'neutral' | 'none'

export interface KPICardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number // Percentage value (e.g., 12.5 for +12.5%)
    label?: string // Optional label like "vs last month"
  }
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default'
  variant?: 'filled' | 'outlined' | 'elevated'
  size?: 'small' | 'medium' | 'large'
  subtitle?: string
  action?: React.ReactNode
  sx?: SxProps<Theme>
  loading?: boolean
}

const colorMap = {
  primary: {
    bg: 'primary.light',
    bgOpacity: 'primary.main',
    text: 'primary.dark',
    chipBg: 'primary.main',
    chipText: 'white',
  },
  secondary: {
    bg: 'secondary.light',
    bgOpacity: 'secondary.main',
    text: 'secondary.dark',
    chipBg: 'secondary.main',
    chipText: 'white',
  },
  success: {
    bg: 'success.light',
    bgOpacity: 'success.main',
    text: 'success.dark',
    chipBg: 'success.main',
    chipText: 'white',
  },
  warning: {
    bg: 'warning.light',
    bgOpacity: 'warning.main',
    text: 'warning.dark',
    chipBg: 'warning.main',
    chipText: 'white',
  },
  error: {
    bg: 'error.light',
    bgOpacity: 'error.main',
    text: 'error.dark',
    chipBg: 'error.main',
    chipText: 'white',
  },
  info: {
    bg: 'info.light',
    bgOpacity: 'info.main',
    text: 'info.dark',
    chipBg: 'info.main',
    chipText: 'white',
  },
  default: {
    bg: 'grey.100',
    bgOpacity: 'grey.300',
    text: 'text.primary',
    chipBg: 'grey.300',
    chipText: 'text.primary',
  },
}

const sizeMap = {
  small: {
    padding: 1.5,
    iconSize: 28,
    valueSize: 'h5',
    titleSize: 'caption',
  },
  medium: {
    padding: 2,
    iconSize: 32,
    valueSize: 'h4',
    titleSize: 'body2',
  },
  large: {
    padding: 2.5,
    iconSize: 40,
    valueSize: 'h3',
    titleSize: 'body1',
  },
}

export function KPICard({
  title,
  value,
  icon,
  trend,
  color = 'default',
  variant = 'elevated',
  size = 'medium',
  subtitle,
  action,
  sx,
  loading = false,
}: KPICardProps) {
  const colors = colorMap[color]
  const sizes = sizeMap[size]

  const getTrendDirection = (): KPITrend => {
    if (!trend) return 'none'
    if (trend.value > 0) return 'up'
    if (trend.value < 0) return 'down'
    return 'neutral'
  }

  const getTrendColor = () => {
    const direction = getTrendDirection()
    // For some metrics like "returns" or "delayed orders", up is bad
    // The parent component should control this by passing appropriate color prop
    return direction === 'up' ? 'success' : direction === 'down' ? 'error' : 'default'
  }

  const getTrendIcon = () => {
    const direction = getTrendDirection()
    switch (direction) {
      case 'up':
        return <TrendingUp fontSize="small" />
      case 'down':
        return <TrendingDown fontSize="small" />
      case 'neutral':
        return <TrendingFlat fontSize="small" />
      default:
        return null
    }
  }

  const cardStyles: SxProps<Theme> = {
    height: '100%',
    ...(variant === 'elevated' && {
      boxShadow: 2,
      '&:hover': { boxShadow: 4 },
    }),
    ...(variant === 'filled' && {
      bgcolor: colors.bg,
    }),
    ...(variant === 'outlined' && {
      bgcolor: 'transparent',
      borderWidth: 2,
      borderColor: colors.bgOpacity,
    }),
    transition: 'all 0.2s ease-in-out',
    ...sx,
  }

  const contentStyles = {
    p: sizes.padding,
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
  }

  if (loading) {
    return (
      <Card sx={cardStyles}>
        <CardContent sx={contentStyles}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1,
            }}
          >
            <Box
              sx={{
                width: 100,
                height: 16,
                bgcolor: 'grey.200',
                borderRadius: 1,
                animation: 'pulse 1.5s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                },
              }}
            />
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                bgcolor: 'grey.200',
              }}
            />
          </Box>
          <Box
            sx={{
              width: '60%',
              height: 32,
              bgcolor: 'grey.200',
              borderRadius: 1,
              mt: 1,
            }}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card sx={cardStyles}>
      <CardContent sx={contentStyles}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            mb: 1,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant={sizes.titleSize as any}
              sx={{
                fontWeight: 600,
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                mb: 0.5,
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                bgcolor: colors.bg,
                color: colors.text,
                borderRadius: 2,
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: sizes.iconSize + 16,
                height: sizes.iconSize + 16,
              }}
            >
              {icon}
            </Box>
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 1,
            mt: 'auto',
            flexWrap: 'wrap',
          }}
        >
          <Typography
            variant={sizes.valueSize as any}
            sx={{
              fontWeight: 700,
              color: 'text.primary',
            }}
          >
            {value}
          </Typography>

          {trend && (
            <Chip
              icon={getTrendIcon()}
              label={`${Math.abs(trend.value)}%`}
              size="small"
              sx={{
                bgcolor: getTrendDirection() === 'up' ? 'success.light' : 'error.light',
                color: getTrendDirection() === 'up' ? 'success.dark' : 'error.dark',
                fontWeight: 600,
                height: 24,
                '& .MuiChip-icon': {
                  fontSize: 16,
                },
              }}
            />
          )}

          {trend?.label && (
            <Typography variant="caption" color="text.secondary">
              {trend.label}
            </Typography>
          )}
        </Box>

        {action && (
          <Box sx={{ mt: 1 }}>
            {action}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
