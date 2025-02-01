"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  indeterminate?: boolean
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, indeterminate, ...props }, ref) => {
  const inputRef = React.useRef<HTMLInputElement>(null)
  
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate || false
    }
  }, [indeterminate])

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer h-5 w-5 shrink-0 rounded-lg border-2 border-gray-200 ring-offset-background",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
        "data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:text-primary-foreground",
        "transition-all duration-200 ease-in-out",
        "hover:border-primary/50",
        className
      )}
      {...props}
    >
      <input
        type="checkbox"
        ref={inputRef}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />
      <CheckboxPrimitive.Indicator 
        className={cn(
          "flex items-center justify-center text-current",
          "animate-in zoom-in-50 duration-200"
        )}
      >
        {indeterminate ? (
          <div className="h-2 w-2 rounded-sm bg-current" />
        ) : (
          <Check className="h-3.5 w-3.5 stroke-[3]" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
})
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
