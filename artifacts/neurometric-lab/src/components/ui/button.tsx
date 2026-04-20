import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-primary-border hover:bg-primary/90 active:bg-primary/80 active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground border border-destructive-border hover:bg-destructive/90 active:scale-[0.98]",
        outline:
          "border [border-color:var(--button-outline)] bg-card text-foreground hover:bg-muted active:bg-muted/80 active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground border border-secondary-border hover:bg-secondary/80 active:scale-[0.98]",
        ghost:
          "border border-transparent bg-transparent text-foreground/80 hover:bg-muted/70 hover:text-foreground active:scale-[0.98]",
        link:
          "text-primary underline-offset-4 hover:underline border-transparent bg-transparent",
      },
      size: {
        default: "min-h-9 px-4 py-2",
        sm: "min-h-8 rounded-md px-3 text-xs",
        lg: "min-h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
