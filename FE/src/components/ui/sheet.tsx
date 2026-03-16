"use client"

import * as React from "react"
import {
  Drawer,
  DrawerProps,
  Box,
  BoxProps,
  Typography,
  IconButton,
  SxProps,
  Theme,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import { useTheme } from "@mui/material/styles"

/**
 * Side from which the sheet/drawer emerges
 */
export type SheetSide = "top" | "bottom" | "left" | "right"

/**
 * Props for the Sheet component (root)
 */
export interface SheetRootProps {
  /**
   * Whether the sheet is open
   */
  open: boolean
  /**
   * Callback when the open state changes
   */
  onOpenChange: (open: boolean) => void
  /**
   * Children to render
   */
  children: React.ReactNode
}

/**
 * Props for the Sheet content
 */
export interface SheetContentProps {
  /**
   * Side from which the sheet emerges
   * @default "right"
   */
  side?: SheetSide
  /**
   * Whether the sheet is open
   */
  open: boolean
  /**
   * Callback when the sheet closes
   */
  onClose: () => void
  /**
   * Children to render
   */
  children: React.ReactNode
  /**
   * Optional class name (uses sx prop instead)
   */
  className?: string
  /**
   * Additional MUI sx prop for custom styling
   */
  sx?: SxProps<Theme>
  /**
   * Maximum width of the sheet (for side sheets)
   */
  maxWidth?: number | string
  /**
   * Width of the sheet
   */
  width?: number | string
  /**
   * Height of the sheet
   */
  height?: number | string
}

/**
 * Props for the Sheet header
 */
export interface SheetHeaderProps extends BoxProps {
  /**
   * Children to render
   */
  children: React.ReactNode
}

/**
 * Props for the Sheet footer
 */
export interface SheetFooterProps extends BoxProps {
  /**
   * Children to render
   */
  children: React.ReactNode
}

/**
 * Props for the Sheet title
 */
export interface SheetTitleProps {
  /**
   * Title text
   */
  children: React.ReactNode
  /**
   * Optional class name (uses sx prop instead)
   */
  className?: string
  /**
   * Additional MUI sx prop for custom styling
   */
  sx?: SxProps<Theme>
}

/**
 * Props for the Sheet description
 */
export interface SheetDescriptionProps {
  /**
   * Description text
   */
  children: React.ReactNode
  /**
   * Optional class name (uses sx prop instead)
   */
  className?: string
  /**
   * Additional MUI sx prop for custom styling
   */
  sx?: SxProps<Theme>
}

/**
 * Sheet context for managing state
 */
interface SheetContextValue {
  open: boolean
  onClose: () => void
}

const SheetContext = React.createContext<SheetContextValue | null>(null)

/**
 * Hook to access sheet context
 */
function useSheetContext(): SheetContextValue {
  const context = React.useContext(SheetContext)
  if (!context) {
    throw new Error("Sheet components must be used within SheetContent")
  }
  return context
}

/**
 * Sheet root component (context provider)
 * Manages the open state and provides context to child components
 */
export function Sheet({ open, onOpenChange, children }: SheetRootProps) {
  const handleClose = React.useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  const contextValue = React.useMemo<SheetContextValue>(
    () => ({
      open,
      onClose: handleClose,
    }),
    [open, handleClose]
  )

  return <SheetContext.Provider value={contextValue}>{children}</SheetContext.Provider>
}

/**
 * Sheet content component (the actual drawer)
 * Renders the drawer overlay and content
 */
export function SheetContent({
  side = "right",
  open,
  onClose,
  children,
  className,
  sx,
  maxWidth,
  width,
  height,
}: SheetContentProps) {
  const theme = useTheme()
  const isVertical = side === "left" || side === "right"

  // Map side to MUI Drawer anchor
  const getAnchor = (side: SheetSide): DrawerProps["anchor"] => {
    switch (side) {
      case "top":
        return "top"
      case "bottom":
        return "bottom"
      case "left":
        return "left"
      case "right":
        return "right"
    }
  }

  // Calculate width based on side and maxWidth
  const getWidth = (): number | string | undefined => {
    if (width) return width
    if (maxWidth) return maxWidth
    if (isVertical) {
      return {
        xs: "85vw",
        sm: 400,
      }
    }
    return undefined
  }

  // Calculate height based on side
  const getHeight = (): number | string | undefined => {
    if (height) return height
    if (!isVertical) {
      return "auto"
    }
    return "100%"
  }

  const drawerSx: SxProps<Theme> = {
    "& .MuiDrawer-paper": {
      width: getWidth(),
      height: getHeight(),
      maxWidth: isVertical ? maxWidth || "85vw" : undefined,
      maxHeight: !isVertical ? "85vh" : undefined,
      bgcolor: "background.paper",
      border: "none",
      boxShadow: theme.shadows[20],
      ...sx,
    },
  }

  return (
    <Drawer
      anchor={getAnchor(side)}
      open={open}
      onClose={onClose}
      sx={drawerSx}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: "rgba(0, 0, 0, 0.5)",
          },
        },
      }}
    >
      <SheetContext.Provider
        value={React.useMemo(
          () => ({
            open,
            onClose,
          }),
          [open, onClose]
        )}
      >
        <Box sx={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
          {/* Close button */}
          <IconButton
            onClick={onClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              zIndex: 1,
              color: "text.secondary",
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
            aria-label="Close sheet"
          >
            <CloseIcon />
          </IconButton>
          {children}
        </Box>
      </SheetContext.Provider>
    </Drawer>
  )
}

/**
 * Sheet header component
 * Renders the header section of the sheet
 */
export function SheetHeader({ children, sx, ...props }: SheetHeaderProps) {
  const headerSx: SxProps<Theme> = {
    display: "flex",
    flexDirection: "column",
    gap: 1,
    pr: 5, // Padding right to accommodate close button
    ...sx,
  }

  return (
    <Box sx={headerSx} {...props}>
      {children}
    </Box>
  )
}

/**
 * Sheet footer component
 * Renders the footer section of the sheet (typically action buttons)
 */
export function SheetFooter({ children, sx, ...props }: SheetFooterProps) {
  const theme = useTheme()

  const footerSx: SxProps<Theme> = {
    display: "flex",
    flexDirection: "column",
    gap: 1,
    mt: "auto",
    p: 2,
    pt: 3,
    borderTop: `1px solid ${theme.palette.divider}`,
    [theme.breakpoints.up("sm")]: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
    },
    ...sx,
  }

  return (
    <Box sx={footerSx} {...props}>
      {children}
    </Box>
  )
}

/**
 * Sheet title component
 * Renders the title text for the sheet
 */
export function SheetTitle({ children, sx }: SheetTitleProps) {
  const titleSx: SxProps<Theme> = {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "text.primary",
    ...sx,
  }

  return (
    <Typography variant="h6" component="h2" sx={titleSx}>
      {children}
    </Typography>
  )
}

/**
 * Sheet description component
 * Renders the description text for the sheet
 */
export function SheetDescription({ children, sx }: SheetDescriptionProps) {
  const descriptionSx: SxProps<Theme> = {
    fontSize: "0.875rem",
    color: "text.secondary",
    ...sx,
  }

  return (
    <Typography variant="body2" sx={descriptionSx}>
      {children}
    </Typography>
  )
}

/**
 * Sheet body component
 * Renders the main content area of the sheet
 */
export interface SheetBodyProps extends BoxProps {
  /**
   * Children to render
   */
  children: React.ReactNode
}

export function SheetBody({ children, sx, ...props }: SheetBodyProps) {
  const bodySx: SxProps<Theme> = {
    flex: 1,
    overflow: "auto",
    p: 2,
    ...sx,
  }

  return (
    <Box sx={bodySx} {...props}>
      {children}
    </Box>
  )
}

// Re-export all components for convenience
export {
  Sheet as SheetRoot,
  SheetContent as SheetPortal,
  SheetContent as SheetOverlay,
  SheetContent as SheetClose,
}
