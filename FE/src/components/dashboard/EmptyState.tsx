import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  SxProps,
  Theme,
} from '@mui/material'
import {
  Inbox,
  CheckCircle,
  Assignment,
  LocalShipping,
  Science,
  Description,
  AssignmentReturn,
} from '@mui/icons-material'

export type EmptyStateType =
  | 'generic'
  | 'success'
  | 'orders'
  | 'lab-jobs'
  | 'shipping'
  | 'prescriptions'
  | 'returns'
  | 'products'

interface EmptyStateProps {
  type?: EmptyStateType
  title: string
  message: string
  actionLabel?: string
  actionHref?: string
  icon?: React.ReactNode
  secondaryActionLabel?: string
  secondaryActionHref?: string
  sx?: SxProps<Theme>
}

const iconMap: Record<EmptyStateType, React.ReactNode> = {
  generic: <Inbox sx={{ fontSize: 64, color: 'text.disabled' }} />,
  success: <CheckCircle sx={{ fontSize: 64, color: 'success.main' }} />,
  orders: <LocalShipping sx={{ fontSize: 64, color: 'text.disabled' }} />,
  'lab-jobs': <Science sx={{ fontSize: 64, color: 'text.disabled' }} />,
  shipping: <LocalShipping sx={{ fontSize: 64, color: 'text.disabled' }} />,
  prescriptions: <Description sx={{ fontSize: 64, color: 'text.disabled' }} />,
  returns: <AssignmentReturn sx={{ fontSize: 64, color: 'text.disabled' }} />,
  products: <Assignment sx={{ fontSize: 64, color: 'text.disabled' }} />,
}

export function EmptyState({
  type = 'generic',
  title,
  message,
  actionLabel,
  actionHref,
  icon,
  secondaryActionLabel,
  secondaryActionHref,
  sx,
}: EmptyStateProps) {
  const displayIcon = icon || iconMap[type]

  return (
    <Card sx={{ textAlign: 'center', py: 4, ...sx }}>
      <CardContent>
        {displayIcon && <Box sx={{ mb: 2 }}>{displayIcon}</Box>}
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
          {message}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          {actionLabel && actionHref && (
            <Button component="a" href={actionHref} variant="outlined">
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && secondaryActionHref && (
            <Button component="a" href={secondaryActionHref} variant="outlined" color="secondary">
              {secondaryActionLabel}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

/**
 * Compact empty state for inline use (e.g., in tables or lists)
 */
interface EmptyStateCompactProps {
  message: string
  size?: 'small' | 'medium'
}

export function EmptyStateCompact({ message, size = 'medium' }: EmptyStateCompactProps) {
  const iconSize = size === 'small' ? 32 : 48

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        px: 2,
      }}
    >
      <Inbox sx={{ fontSize: iconSize, color: 'text.disabled', mb: 1 }} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  )
}
