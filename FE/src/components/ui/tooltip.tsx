import * as React from "react"
import Tooltip, { TooltipProps } from "@mui/material/Tooltip"
import { SxProps, Theme } from "@mui/material/styles"

/**
 * Placement options for the tooltip
 */
export type TooltipPlacement =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end"
  | "right"
  | "right-start"
  | "right-end"

/**
 * Props for the Tooltip content
 */
export interface TooltipContentProps {
  /**
   * Content to display in the tooltip
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
   * Side offset in pixels
   */
  sideOffset?: number
}

/**
 * Props for the Tooltip trigger element wrapper
 */
export interface TooltipTriggerProps {
  /**
   * The trigger element (typically a button or interactive element)
   */
  asChild?: boolean
  /**
   * Children to render
   */
  children: React.ReactNode
}

/**
 * Props for the root Tooltip component
 */
export interface CustomTooltipProps {
  /**
   * Whether to disable the tooltip
   */
  disabled?: boolean
  /**
   * Whether to delay showing the tooltip
   */
  delayDuration?: number
  /**
   * Whether to skip the delay duration on hover
   */
  skipDelayDuration?: number
  /**
   * Children to render (TooltipTrigger + TooltipContent)
   */
  children: React.ReactNode
}

/**
 * Tooltip context for managing state
 */
interface TooltipContextValue {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  disabled: boolean
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null)

/**
 * Hook to access tooltip context
 */
function useTooltipContext(): TooltipContextValue {
  const context = React.useContext(TooltipContext)
  if (!context) {
    throw new Error("Tooltip components must be used within Tooltip")
  }
  return context
}

/**
 * Tooltip root component (context provider)
 * Manages the tooltip state and provides context to child components
 */
export function TooltipRoot({
  disabled = false,
  delayDuration = 0,
  skipDelayDuration = 300,
  children,
}: CustomTooltipProps) {
  const [open, setOpen] = React.useState(false)
  const [openDelayed, setOpenDelayed] = React.useState(false)
  const timeoutRef = React.useRef<NodeJS.Timeout>()

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleOpen = () => {
    if (disabled) return

    if (skipDelayDuration && open) {
      setOpen(true)
      setOpenDelayed(true)
      return
    }

    timeoutRef.current = setTimeout(() => {
      setOpen(true)
      setOpenDelayed(true)
    }, delayDuration)
  }

  const handleClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setOpen(false)
    setOpenDelayed(false)
  }

  const contextValue = React.useMemo<TooltipContextValue>(
    () => ({
      open: openDelayed,
      setOpen: (value) => {
        if (typeof value === "function") {
          const result = value(openDelayed)
          result ? handleOpen() : handleClose()
        } else {
          value ? handleOpen() : handleClose()
        }
      },
      disabled,
    }),
    [openDelayed, disabled, delayDuration, skipDelayDuration, open]
  )

  return <TooltipContext.Provider value={contextValue}>{children}</TooltipContext.Provider>
}

/**
 * Tooltip component built on top of MUI Tooltip
 * Provides consistent tooltip styles across the application
 *
 * @example
 * ```tsx
 * <TooltipProvider>
 *   <Tooltip>
 *     <TooltipTrigger>
 *       <Button>Hover me</Button>
 *     </TooltipTrigger>
 *     <TooltipContent>
 *       This is a tooltip
 *     </TooltipContent>
 *   </Tooltip>
 * </TooltipProvider>
 * ```
 *
 * Simple usage with title prop:
 * ```tsx
 * <Tooltip title="This is a tooltip">
 *   <Button>Hover me</Button>
 * </Tooltip>
 * ```
 */

/**
 * Simple Tooltip wrapper around MUI Tooltip
 * Use this for simple tooltips with just a title
 */
export const SimpleTooltip = React.forwardRef<
  HTMLButtonElement,
  TooltipProps & {
    /**
     * The content to display in the tooltip
     */
    title: string
    /**
     * The child element that triggers the tooltip
     */
    children: React.ReactElement
  }
>(({ title, children, placement = "top", arrow = true, ...props }, ref) => {
  return (
    <Tooltip
      title={title}
      placement={placement}
      arrow={arrow}
      enterDelay={0}
      leaveDelay={0}
      {...props}
    >
      {React.cloneElement(children, {
        ref,
        ...children.props,
      })}
    </Tooltip>
  )
})

SimpleTooltip.displayName = "SimpleTooltip"

/**
 * Complex Tooltip with content composition
 */
export const CustomTooltip = React.forwardRef<
  HTMLDivElement,
  Omit<TooltipProps, "title" | "open" | "onClose" | "onOpen"> & {
    /**
     * Whether the tooltip is open (controlled)
     */
    open?: boolean
    /**
     * Callback when tooltip closes
     */
    onClose?: () => void
    /**
     * Callback when tooltip opens
     */
    onOpen?: () => void
    /**
     * The content to display in the tooltip
     */
    title: React.ReactNode
    /**
     * The child element that triggers the tooltip
     */
    children: React.ReactElement
    /**
     * Side offset in pixels
     */
    sideOffset?: number
  }
>(({ title, children, placement = "top", arrow = true, sideOffset = 4, open, onClose, onOpen, ...props }, ref) => {
  return (
    <Tooltip
      title={title}
      placement={placement}
      arrow={arrow}
      open={open}
      onClose={onClose}
      onOpen={onOpen}
      slotProps={{
        popper: {
          sx: {
            "& .MuiTooltip-tooltip": {
              backgroundColor: "grey.900",
              color: "common.white",
              fontSize: "0.75rem",
              padding: "6px 12px",
              borderRadius: 1,
            },
            "& .MuiTooltip-arrow": {
              color: "grey.900",
              ...(sideOffset && {
                "&:before": {
                  transform: `scale(${1 + sideOffset / 16})`,
                },
              }),
            },
          },
        },
      }}
      {...props}
    >
      {React.cloneElement(children, {
        ref,
        ...children.props,
      })}
    </Tooltip>
  )
})

CustomTooltip.displayName = "CustomTooltip"

/**
 * Tooltip content component (for composition pattern)
 */
export function TooltipContent({ children, className, sx, sideOffset = 4 }: TooltipContentProps) {
  // This component is for composition pattern compatibility
  // The actual rendering is handled by MUI Tooltip
  return <>{children}</>
}

/**
 * Tooltip trigger component (for composition pattern)
 */
export function TooltipTrigger({ asChild = false, children }: TooltipTriggerProps) {
  // This component is for composition pattern compatibility
  // The actual rendering is handled by MUI Tooltip
  return <>{children}</>
}

/**
 * Tooltip provider component (for composition pattern)
 */
export const TooltipProvider = TooltipRoot

// Re-export components with simpler names
export { SimpleTooltip as Tooltip, CustomTooltip as RichTooltip }

/**
 * Pre-configured tooltip variants for convenience
 */
export const TopTooltip = React.forwardRef<
  HTMLButtonElement,
  Omit<TooltipProps, "placement"> & { title: string; children: React.ReactElement }
>(({ title, children, ...props }, ref) => (
  <SimpleTooltip title={title} placement="top" {...props} ref={ref}>
    {children}
  </SimpleTooltip>
))

TopTooltip.displayName = "TopTooltip"

export const BottomTooltip = React.forwardRef<
  HTMLButtonElement,
  Omit<TooltipProps, "placement"> & { title: string; children: React.ReactElement }
>(({ title, children, ...props }, ref) => (
  <SimpleTooltip title={title} placement="bottom" {...props} ref={ref}>
    {children}
  </SimpleTooltip>
))

BottomTooltip.displayName = "BottomTooltip"

export const LeftTooltip = React.forwardRef<
  HTMLButtonElement,
  Omit<TooltipProps, "placement"> & { title: string; children: React.ReactElement }
>(({ title, children, ...props }, ref) => (
  <SimpleTooltip title={title} placement="left" {...props} ref={ref}>
    {children}
  </SimpleTooltip>
))

LeftTooltip.displayName = "LeftTooltip"

export const RightTooltip = React.forwardRef<
  HTMLButtonElement,
  Omit<TooltipProps, "placement"> & { title: string; children: React.ReactElement }
>(({ title, children, ...props }, ref) => (
  <SimpleTooltip title={title} placement="right" {...props} ref={ref}>
    {children}
  </SimpleTooltip>
))

RightTooltip.displayName = "RightTooltip"
