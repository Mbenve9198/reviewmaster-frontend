import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SlidePanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

export function SlidePanel({ 
  open, 
  onOpenChange, 
  children, 
  className 
}: SlidePanelProps) {
  // Handle escape key to close panel
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onOpenChange])

  // Prevent body scroll when panel is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop - copre tutto incluso il banner */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Panel - usiamo -top-0 bottom-0 invece di h-screen */}
      <div
        className={cn(
          "fixed -top-0 bottom-0 right-0 w-full sm:w-[500px] bg-white shadow-2xl z-[100]",
          "transform transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full",
          className
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 rounded-full hover:bg-gray-100"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>
        {children}
      </div>
    </>
  )
}