import { createTheme, ThemeOptions } from '@mui/material/styles'

// Base theme configuration for customer-facing application
const themeOptions: ThemeOptions = {
  palette: {
    primary: {
      main: '#2563eb',
      dark: '#1d4ed8',
      light: '#3b82f6',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#8b5cf6',
      dark: '#7c3aed',
      light: '#a78bfa',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ef4444',
      dark: '#dc2626',
      light: '#f87171',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981',
      dark: '#059669',
      light: '#34d399',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b',
      dark: '#d97706',
      light: '#fbbf24',
      contrastText: '#ffffff',
    },
    info: {
      main: '#0ea5e9',
      dark: '#0284c7',
      light: '#38bdf8',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    grey: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    divider: '#e2e8f0',
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
      disabled: '#94a3b8',
    },
  },
  typography: {
    fontFamily:
      'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 700,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.75rem',
      fontWeight: 600,
      lineHeight: 1.5,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      color: '#64748b',
    },
    overline: {
      fontSize: '0.625rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 35px 60px -15px rgb(0 0 0 / 0.3)',
    '0 40px 77px -20px rgb(0 0 0 / 0.35)',
    '0 50px 100px -25px rgb(0 0 0 / 0.4)',
    '0 60px 120px -30px rgb(0 0 0 / 0.45)',
    '0 70px 140px -35px rgb(0 0 0 / 0.5)',
    '0 80px 160px -40px rgb(0 0 0 / 0.55)',
    '0 90px 180px -45px rgb(0 0 0 / 0.6)',
    '0 100px 200px -50px rgb(0 0 0 / 0.65)',
    '0 110px 220px -55px rgb(0 0 0 / 0.7)',
    '0 120px 240px -60px rgb(0 0 0 / 0.75)',
    '0 130px 260px -65px rgb(0 0 0 / 0.8)',
    '0 140px 280px -70px rgb(0 0 0 / 0.85)',
    '0 150px 300px -75px rgb(0 0 0 / 0.9)',
    '0 160px 320px -80px rgb(0 0 0 / 0.95)',
    '0 170px 340px -85px rgb(0 0 0 / 1)',
    '0 180px 360px -90px rgb(0 0 0 / 1)',
    '0 190px 380px -95px rgb(0 0 0 / 1)',
    '0 200px 400px -100px rgb(0 0 0 / 1)',
  ],
  components: {
    // Button component overrides
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
          '&:active': {
            boxShadow: 'none',
          },
          borderRadius: 8,
          padding: '8px 16px',
          minWidth: 'auto',
        },
        sizeSmall: {
          padding: '6px 12px',
          fontSize: '0.75rem',
          borderRadius: 6,
        },
        sizeLarge: {
          padding: '10px 24px',
          fontSize: '1rem',
          borderRadius: 10,
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#1d4ed8',
          },
        },
        containedSecondary: {
          '&:hover': {
            backgroundColor: '#7c3aed',
          },
        },
        outlined: {
          borderWidth: 1,
          '&:hover': {
            borderWidth: 1,
          },
        },
        text: {
          '&:hover': {
            backgroundColor: 'rgba(37, 99, 235, 0.04)',
          },
        },
      },
      variants: [
        {
          props: { variant: 'destructive' },
          style: {
            backgroundColor: '#ef4444',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#dc2626',
            },
          },
        },
        {
          props: { variant: 'ghost' },
          style: {
            backgroundColor: 'transparent',
            color: '#0f172a',
            '&:hover': {
              backgroundColor: '#f1f5f9',
            },
          },
        },
        {
          props: { variant: 'link' },
          style: {
            backgroundColor: 'transparent',
            color: '#2563eb',
            padding: 0,
            textDecoration: 'underline',
            textDecorationOffset: 4,
            '&:hover': {
              textDecoration: 'underline',
              backgroundColor: 'transparent',
            },
          },
        },
      ],
    },
    // TextField component overrides
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#cbd5e1',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
          },
        },
        notchedOutline: {
          borderColor: '#e2e8f0',
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:before': {
            borderBottomColor: '#e2e8f0',
          },
          '&:hover:not(.Mui-disabled):before': {
            borderBottomColor: '#cbd5e1',
          },
        },
      },
    },
    // Chip component overrides
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.75rem',
        },
        sizeSmall: {
          fontSize: '0.625rem',
          height: 20,
        },
        outlined: {
          borderWidth: 1,
        },
      },
    },
    // Card component overrides
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24,
          '&:last-child': {
            paddingBottom: 24,
          },
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '20px 24px',
          '& .MuiCardHeader-title': {
            fontSize: '1.125rem',
            fontWeight: 600,
          },
          '& .MuiCardHeader-subheader': {
            fontSize: '0.875rem',
            color: '#64748b',
          },
        },
      },
    },
    // Paper component overrides
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        outlined: {
          borderColor: '#e2e8f0',
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
    // Table component overrides
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            backgroundColor: '#f8fafc',
            color: '#64748b',
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: '1px solid #e2e8f0',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
          borderBottom: '1px solid #e2e8f0',
          fontSize: '0.875rem',
        },
        head: {
          fontWeight: 600,
        },
        body: {
          color: '#0f172a',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#f8fafc',
          },
          '&.Mui-selected': {
            backgroundColor: '#f1f5f9',
          },
        },
      },
    },
    // Divider component overrides
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#e2e8f0',
          margin: '8px 0',
        },
        vertical: {
          margin: '0 8px',
        },
      },
    },
    // Dialog component overrides
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        },
        paperWidthSm: {
          maxWidth: 480,
        },
        paperWidthMd: {
          maxWidth: 640,
        },
        paperWidthLg: {
          maxWidth: 960,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem',
          fontWeight: 700,
          padding: '20px 24px 16px',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '0 24px 24px',
          fontSize: '0.875rem',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
          gap: 8,
        },
      },
    },
    // Drawer component overrides
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          borderRight: '1px solid #e2e8f0',
        },
        paperAnchorLeft: {
          borderRight: '1px solid #e2e8f0',
        },
        paperAnchorRight: {
          borderLeft: '1px solid #e2e8f0',
        },
      },
    },
    // Tooltip component overrides
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1e293b',
          fontSize: '0.75rem',
          padding: '6px 12px',
          borderRadius: 6,
        },
        arrow: {
          color: '#1e293b',
        },
      },
    },
    // Alert component overrides
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        standardSuccess: {
          backgroundColor: '#f0fdf4',
          color: '#166534',
          '& .MuiAlert-icon': {
            color: '#16a34a',
          },
        },
        standardError: {
          backgroundColor: '#fef2f2',
          color: '#991b1b',
          '& .MuiAlert-icon': {
            color: '#dc2626',
          },
        },
        standardWarning: {
          backgroundColor: '#fffbeb',
          color: '#92400e',
          '& .MuiAlert-icon': {
            color: '#f59e0b',
          },
        },
        standardInfo: {
          backgroundColor: '#f0f9ff',
          color: '#075985',
          '& .MuiAlert-icon': {
            color: '#0284c7',
          },
        },
      },
    },
    // AppBar component overrides
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          backgroundImage: 'none',
        },
        colorPrimary: {
          backgroundColor: '#ffffff',
          color: '#0f172a',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: 64,
          paddingLeft: 16,
          paddingRight: 16,
        },
        regular: {
          minHeight: 64,
        },
        dense: {
          minHeight: 48,
        },
      },
    },
    // Tabs component overrides
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 48,
        },
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          minHeight: 48,
          padding: '12px 16px',
          '&.Mui-selected': {
            fontWeight: 700,
          },
        },
      },
    },
    // Skeleton component overrides
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: '#e2e8f0',
          borderRadius: 8,
        },
      },
    },
    // Select component overrides
    MuiSelect: {
      styleOverrides: {
        root: {
          '& .MuiSelect-icon': {
            color: '#64748b',
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          minHeight: 40,
          padding: '8px 16px',
          '&.Mui-selected': {
            backgroundColor: '#f1f5f9',
          },
          '&.Mui-selected:hover': {
            backgroundColor: '#e2e8f0',
          },
        },
      },
    },
    // FormControlLabel overrides
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          marginLeft: 0,
          marginRight: 0,
        },
        label: {
          fontSize: '0.875rem',
        },
      },
    },
    // Checkbox overrides
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: '#cbd5e1',
          '&.Mui-checked': {
            color: '#2563eb',
          },
        },
      },
    },
    // Switch overrides
    MuiSwitch: {
      styleOverrides: {
        root: {
          padding: 8,
        },
        switchBase: {
          '&.Mui-checked': {
            '& + .MuiSwitch-track': {
              opacity: 1,
            },
          },
        },
        track: {
          opacity: 1,
          backgroundColor: '#cbd5e1',
        },
        thumb: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        },
      },
    },
    // Snackbar overrides
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        },
      },
    },
    // Badge overrides
    MuiBadge: {
      styleOverrides: {
        root: {
          '& .MuiBadge-badge': {
            fontSize: '0.625rem',
            fontWeight: 700,
            height: 16,
            minWidth: 16,
          },
        },
        colorPrimary: {
          '& .MuiBadge-badge': {
            backgroundColor: '#ef4444',
            color: '#ffffff',
          },
        },
      },
    },
    // IconButton overrides
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        },
        sizeSmall: {
          padding: 4,
          '& .MuiSvgIcon-root': {
            fontSize: '1.25rem',
          },
        },
        sizeMedium: {
          padding: 8,
          '& .MuiSvgIcon-root': {
            fontSize: '1.5rem',
          },
        },
        sizeLarge: {
          padding: 12,
          '& .MuiSvgIcon-root': {
            fontSize: '1.75rem',
          },
        },
      },
    },
    // ListItem overrides
    MuiListItem: {
      styleOverrides: {
        root: {
          padding: '8px 16px',
          borderRadius: 8,
          margin: '2px 8px',
          '&:hover': {
            backgroundColor: '#f1f5f9',
          },
          '&.Mui-selected': {
            backgroundColor: '#e2e8f0',
            '&:hover': {
              backgroundColor: '#cbd5e1',
            },
          },
        },
        button: {
          transition: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    // ListSubheader overrides
    MuiListSubheader: {
      styleOverrides: {
        root: {
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#64748b',
          padding: '12px 16px 8px',
        },
      },
    },
    // AppBar container for layout
    MuiContainer: {
      styleOverrides: {
        root: {
          maxWidth: 1280,
        },
      },
    },
  },
}

export const theme = createTheme(themeOptions)

// Export theme options for extensions
export { themeOptions }
