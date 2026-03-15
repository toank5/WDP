import * as React from "react"
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  TextField,
  Typography,
  Tooltip,
  Collapse,
  useMediaQuery,
  useTheme,
  SxProps,
  Theme,
  Button,
} from "@mui/material"
import {
  ChevronLeft as PanelLeft,
  ChevronRight,
  ExpandLess,
  ExpandMore,
  Menu as MenuIcon,
} from "@mui/icons-material"

// Constants
const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = 256 // 16rem in pixels
const SIDEBAR_WIDTH_MOBILE = 288 // 18rem in pixels
const SIDEBAR_WIDTH_ICON = 48 // 3rem in pixels
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

/**
 * Sidebar state types
 */
export type SidebarState = "expanded" | "collapsed"

/**
 * Sidebar variant types
 */
export type SidebarVariant = "sidebar" | "floating" | "inset"

/**
 * Sidebar collapsible types
 */
export type SidebarCollapsible = "offcanvas" | "icon" | "none"

/**
 * Sidebar side types
 */
export type SidebarSide = "left" | "right"

/**
 * Sidebar context props
 */
interface SidebarContextProps {
  state: SidebarState
  open: boolean
  setOpen: (open: boolean | ((open: boolean) => boolean)) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

/**
 * Hook to use sidebar context
 */
export function useSidebar(): SidebarContextProps {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

/**
 * SidebarProvider component
 * Manages the sidebar state and provides context to child components
 */
export interface SidebarProviderProps {
  /**
   * Default open state
   */
  defaultOpen?: boolean
  /**
   * Controlled open state
   */
  open?: boolean
  /**
   * Callback when open state changes
   */
  onOpenChange?: (open: boolean) => void
  /**
   * Children to render
   */
  children: React.ReactNode
  /**
   * Optional class name
   */
  className?: string
  /**
   * Optional sx prop
   */
  sx?: SxProps<Theme>
}

export const SidebarProvider = React.forwardRef<HTMLDivElement, SidebarProviderProps>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      sx,
      children,
      ...props
    },
    ref
  ) => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down("md"))
    const [openMobile, setOpenMobile] = React.useState(false)

    // Internal state of the sidebar
    const [_open, _setOpen] = React.useState(defaultOpen)
    const open = openProp ?? _open
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }

        // Set cookie to persist sidebar state
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
      },
      [setOpenProp, open]
    )

    // Helper to toggle the sidebar
    const toggleSidebar = React.useCallback(() => {
      return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open)
    }, [isMobile, setOpen, setOpenMobile])

    // Keyboard shortcut to toggle sidebar
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
          event.preventDefault()
          toggleSidebar()
        }
      }

      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])

    // State for data-state attribute
    const state = open ? "expanded" : "collapsed"

    const contextValue = React.useMemo<SidebarContextProps>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <Box
          ref={ref}
          sx={{
            display: "flex",
            minHeight: "100vh",
            width: "100%",
            ...sx,
          }}
          className={className}
          {...props}
        >
          {children}
        </Box>
      </SidebarContext.Provider>
    )
  }
)

SidebarProvider.displayName = "SidebarProvider"

/**
 * Sidebar component
 * Main sidebar container
 */
export interface SidebarProps {
  /**
   * Side of the screen
   * @default "left"
   */
  side?: SidebarSide
  /**
   * Visual variant
   * @default "sidebar"
   */
  variant?: SidebarVariant
  /**
   * Collapsible behavior
   * @default "offcanvas"
   */
  collapsible?: SidebarCollapsible
  /**
   * Children to render
   */
  children: React.ReactNode
  /**
   * Optional class name
   */
  className?: string
  /**
   * Optional sx prop
   */
  sx?: SxProps<Theme>
}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ side = "left", variant = "sidebar", collapsible = "offcanvas", className, sx, children, ...props }, ref) => {
    const theme = useTheme()
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar()
    const isMdDown = useMediaQuery(theme.breakpoints.down("md"))

    // Non-collapsible sidebar
    if (collapsible === "none") {
      return (
        <Box
          ref={ref}
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            width: SIDEBAR_WIDTH,
            bgcolor: "background.default",
            color: "text.primary",
            ...sx,
          }}
          className={className}
          {...props}
        >
          {children}
        </Box>
      )
    }

    // Mobile sidebar (uses Drawer)
    if (isMobile) {
      return (
        <Drawer
          anchor={side}
          open={openMobile}
          onClose={() => setOpenMobile(false)}
          sx={{
            width: SIDEBAR_WIDTH_MOBILE,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: SIDEBAR_WIDTH_MOBILE,
              boxSizing: "border-box",
            },
          }}
        >
          <Box sx={{ overflow: "auto", height: "100%" }}>{children}</Box>
        </Drawer>
      )
    }

    // Desktop sidebar
    const sidebarSx: SxProps<Theme> = {
      display: "flex",
      height: "100vh",
      position: "fixed",
      top: 0,
      [side]: 0,
      width: SIDEBAR_WIDTH,
      zIndex: theme.zIndex.drawer,
      transition: theme.transitions.create(["left", "right", "width"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      ...(state === "collapsed" &&
        collapsible === "offcanvas" && {
          [side]: -SIDEBAR_WIDTH,
        }),
      ...(state === "collapsed" &&
        collapsible === "icon" && {
          width: SIDEBAR_WIDTH_ICON,
        }),
      bgcolor: "background.default",
      ...sx,
    }

    return (
      <Box ref={ref} sx={sidebarSx} className={className} {...props}>
        {children}
      </Box>
    )
  }
)

Sidebar.displayName = "Sidebar"

/**
 * SidebarTrigger component
 * Button to toggle the sidebar
 */
export const SidebarTrigger = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ className, onClick, sx, ...props }, ref) => {
    const { toggleSidebar } = useSidebar()

    return (
      <IconButton
        ref={ref}
        onClick={(event) => {
          onClick?.(event)
          toggleSidebar()
        }}
        sx={{
          width: 28,
          height: 28,
          ...sx,
        }}
        {...props}
      >
        <PanelLeft fontSize="small" />
      </IconButton>
    )
  }
)

SidebarTrigger.displayName = "SidebarTrigger"

/**
 * SidebarRail component
 * Invisible rail to resize sidebar (placeholder for future functionality)
 */
export const SidebarRail = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  ({ className, ...props }, ref) => {
    const { toggleSidebar } = useSidebar()

    return (
      <button
        ref={ref}
        onClick={toggleSidebar}
        aria-label="Toggle Sidebar"
        style={{
          position: "absolute",
          insetY: 0,
          width: 4,
          cursor: "col-resize",
          border: "none",
          background: "transparent",
        }}
        {...props}
      />
    )
  }
)

SidebarRail.displayName = "SidebarRail"

/**
 * SidebarInset component
 * Main content area that adjusts based on sidebar state
 */
export const SidebarInset = React.forwardRef<HTMLDivElement, React.ComponentProps<"main">>(
  ({ className, sx, children, ...props }, ref) => {
    const theme = useTheme()
    const { state } = useSidebar()

    const insetSx: SxProps<Theme> = {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      bgcolor: "background.default",
      transition: theme.transitions.create(["margin"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      ...(state === "expanded" && {
        ml: `${SIDEBAR_WIDTH}px`,
      }),
      ...sx,
    }

    return (
      <main ref={ref} sx={insetSx} className={className} {...props}>
        {children}
      </main>
    )
  }
)

SidebarInset.displayName = "SidebarInset"

/**
 * SidebarInput component
 * Search input for the sidebar
 */
export const SidebarInput = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof TextField>
>(({ className, sx, ...props }, ref) => {
  const theme = useTheme()

  const inputSx: SxProps<Theme> = {
    width: "100%",
    "& .MuiOutlinedInput-root": {
      height: 32,
      bgcolor: "background.paper",
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "divider",
      },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderWidth: 1,
      },
    },
    ...sx,
  }

  return (
    <TextField
      ref={ref}
      placeholder="Search..."
      size="small"
      fullWidth
      sx={inputSx}
      className={className}
      {...props}
    />
  )
})

SidebarInput.displayName = "SidebarInput"

/**
 * SidebarHeader component
 * Header section of the sidebar
 */
export const SidebarHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, sx, children, ...props }, ref) => {
    const headerSx: SxProps<Theme> = {
      display: "flex",
      flexDirection: "column",
      gap: 2,
      p: 2,
      ...sx,
    }

    return (
      <Box ref={ref} sx={headerSx} className={className} {...props}>
        {children}
      </Box>
    )
  }
)

SidebarHeader.displayName = "SidebarHeader"

/**
 * SidebarFooter component
 * Footer section of the sidebar
 */
export const SidebarFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, sx, children, ...props }, ref) => {
    const footerSx: SxProps<Theme> = {
      display: "flex",
      flexDirection: "column",
      gap: 2,
      p: 2,
      mt: "auto",
      ...sx,
    }

    return (
      <Box ref={ref} sx={footerSx} className={className} {...props}>
        {children}
      </Box>
    )
  }
)

SidebarFooter.displayName = "SidebarFooter"

/**
 * SidebarSeparator component
 * Divider in the sidebar
 */
export const SidebarSeparator = React.forwardRef<HTMLHRElement, React.ComponentProps<typeof Divider>>(
  ({ className, sx, ...props }, ref) => {
    const separatorSx: SxProps<Theme> = {
      borderColor: "divider",
      mx: 2,
      ...sx,
    }

    return <Divider ref={ref} sx={separatorSx} className={className} {...props} />
  }
)

SidebarSeparator.displayName = "SidebarSeparator"

/**
 * SidebarContent component
 * Main scrollable content area of the sidebar
 */
export const SidebarContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, sx, children, ...props }, ref) => {
    const contentSx: SxProps<Theme> = {
      flex: 1,
      overflow: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 2,
      p: 2,
      ...sx,
    }

    return (
      <Box ref={ref} sx={contentSx} className={className} {...props}>
        {children}
      </Box>
    )
  }
)

SidebarContent.displayName = "SidebarContent"

/**
 * SidebarGroup component
 * Group container for sidebar items
 */
export const SidebarGroup = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, sx, children, ...props }, ref) => {
    const groupSx: SxProps<Theme> = {
      display: "flex",
      flexDirection: "column",
      p: 2,
      ...sx,
    }

    return (
      <Box ref={ref} sx={groupSx} className={className} {...props}>
        {children}
      </Box>
    )
  }
)

SidebarGroup.displayName = "SidebarGroup"

/**
 * SidebarGroupLabel component
 * Label for a sidebar group
 */
export const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, sx, children, ...props }, ref) => {
    const theme = useTheme()
    const { state } = useSidebar()

    const labelSx: SxProps<Theme> = {
      display: "flex",
      alignItems: "center",
      height: 32,
      px: 2,
      fontSize: "0.75rem",
      fontWeight: 600,
      color: "text.secondary",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      ...(state === "collapsed" && {
        opacity: 0,
      }),
      ...sx,
    }

    return (
      <Typography ref={ref} sx={labelSx} className={className} {...props}>
        {children}
      </Typography>
    )
  }
)

SidebarGroupLabel.displayName = "SidebarGroupLabel"

/**
 * SidebarGroupContent component
 * Content area for a sidebar group
 */
export const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, sx, children, ...props }, ref) => {
    const contentSx: SxProps<Theme> = {
      width: "100%",
      fontSize: "0.875rem",
      ...sx,
    }

    return (
      <Box ref={ref} sx={contentSx} className={className} {...props}>
        {children}
      </Box>
    )
  }
)

SidebarGroupContent.displayName = "SidebarGroupContent"

/**
 * SidebarMenu component
 * List container for menu items
 */
export const SidebarMenu = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, sx, children, ...props }, ref) => {
    const menuSx: SxProps<Theme> = {
      display: "flex",
      flexDirection: "column",
      width: "100%",
      gap: 1,
      listStyle: "none",
      p: 0,
      m: 0,
      ...sx,
    }

    return (
      <List ref={ref as any} sx={menuSx} className={className} {...props} disablePadding>
        {children}
      </List>
    )
  }
)

SidebarMenu.displayName = "SidebarMenu"

/**
 * SidebarMenuItem component
 * Item container in the menu
 */
export const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  ({ className, sx, children, ...props }, ref) => {
    const itemSx: SxProps<Theme> = {
      position: "relative",
      ...sx,
    }

    return (
      <ListItem ref={ref as any} sx={itemSx} className={className} disablePadding {...props}>
        {children}
      </ListItem>
    )
  }
)

SidebarMenuItem.displayName = "SidebarMenuItem"

/**
 * SidebarMenuButton component
 * Button for a menu item
 */
export interface SidebarMenuButtonProps extends React.ComponentProps<typeof ListItemButton> {
  /**
   * Whether the button is active
   */
  isActive?: boolean
  /**
   * Tooltip text (shown when sidebar is collapsed)
   */
  tooltip?: string
}

export const SidebarMenuButton = React.forwardRef<HTMLDivElement, SidebarMenuButtonProps>(
  ({ isActive = false, tooltip, className, sx, children, ...props }, ref) => {
    const theme = useTheme()
    const { state, isMobile } = useSidebar()

    const buttonSx: SxProps<Theme> = {
      minHeight: 32,
      px: 2,
      py: 1,
      borderRadius: 1,
      bgcolor: isActive ? "action.selected" : "transparent",
      color: "text.primary",
      "&:hover": {
        bgcolor: "action.hover",
      },
      ...sx,
    }

    const button = (
      <ListItemButton ref={ref as any} sx={buttonSx} className={className} {...props}>
        {children}
      </ListItemButton>
    )

    if (!tooltip || state !== "collapsed" || isMobile) {
      return button
    }

    return (
      <Tooltip title={tooltip} placement="right">
        <Box sx={{ display: "inline-flex" }}>{button}</Box>
      </Tooltip>
    )
  }
)

SidebarMenuButton.displayName = "SidebarMenuButton"

/**
 * SidebarMenuAction component
 * Action button for a menu item
 */
export const SidebarMenuAction = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  ({ className, sx, children, ...props }, ref) => {
    const { state } = useSidebar()
    const theme = useTheme()

    const actionSx: SxProps<Theme> = {
      position: "absolute",
      right: 4,
      top: "50%",
      transform: "translateY(-50%)",
      width: 20,
      height: 20,
      minWidth: "auto",
      borderRadius: 1,
      p: 0.25,
      color: "text.secondary",
      bgcolor: "transparent",
      "&:hover": {
        bgcolor: "action.hover",
        color: "text.primary",
      },
      ...(state === "collapsed" && {
        display: "none",
      }),
      ...sx,
    }

    return (
      <IconButton ref={ref} sx={actionSx} className={className} {...props}>
        {children}
      </IconButton>
    )
  }
)

SidebarMenuAction.displayName = "SidebarMenuAction"

/**
 * SidebarMenuBadge component
 * Badge for a menu item
 */
export const SidebarMenuBadge = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, sx, children, ...props }, ref) => {
    const { state } = useSidebar()

    const badgeSx: SxProps<Theme> = {
      position: "absolute",
      right: 4,
      top: "50%",
      transform: "translateY(-50%)",
      pointerEvents: "none",
      height: 20,
      minWidth: 20,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 1,
      px: 0.5,
      fontSize: "0.625rem",
      fontWeight: 600,
      color: "text.primary",
      ...(state === "collapsed" && {
        display: "none",
      }),
      ...sx,
    }

    return (
      <Box ref={ref} sx={badgeSx} className={className} {...props}>
        {children}
      </Box>
    )
  }
)

SidebarMenuBadge.displayName = "SidebarMenuBadge"

/**
 * SidebarMenuSub component
 * Submenu container
 */
export const SidebarMenuSub = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, sx, children, ...props }, ref) => {
    const { state } = useSidebar()

    const subSx: SxProps<Theme> = {
      ml: 2,
      pl: 2,
      borderLeft: "1px solid",
      borderColor: "divider",
      display: "flex",
      flexDirection: "column",
      gap: 1,
      ...(state === "collapsed" && {
        display: "none",
      }),
      ...sx,
    }

    return (
      <List ref={ref as any} sx={subSx} className={className} {...props} disablePadding>
        {children}
      </List>
    )
  }
)

SidebarMenuSub.displayName = "SidebarMenuSub"

/**
 * SidebarMenuSubButton component
 * Button for a submenu item
 */
export interface SidebarMenuSubButtonProps extends React.ComponentProps<typeof ListItemButton> {
  /**
   * Size variant
   */
  size?: "sm" | "md"
  /**
   * Whether the button is active
   */
  isActive?: boolean
}

export const SidebarMenuSubButton = React.forwardRef<HTMLDivElement, SidebarMenuSubButtonProps>(
  ({ size = "md", isActive = false, className, sx, children, ...props }, ref) => {
    const { state } = useSidebar()

    const buttonSx: SxProps<Theme> = {
      minHeight: size === "sm" ? 28 : 32,
      px: 2,
      py: 0.5,
      borderRadius: 1,
      bgcolor: isActive ? "action.selected" : "transparent",
      color: "text.primary",
      fontSize: size === "sm" ? "0.75rem" : "0.875rem",
      "&:hover": {
        bgcolor: "action.hover",
      },
      ...(state === "collapsed" && {
        display: "none",
      }),
      ...sx,
    }

    return (
      <ListItemButton ref={ref as any} sx={buttonSx} className={className} {...props}>
        {children}
      </ListItemButton>
    )
  }
)

SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

/**
 * Export all components
 */
export {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
