import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Copy } from 'lucide-react'

interface ResponseModalProps {
  isOpen: boolean
  onClose: () => void
  response: string
  isError?: boolean
}

export function ResponseModal({ isOpen, onClose, response, isError }: ResponseModalProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(response)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border-0 shadow-2xl p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-4xl font-bold text-center">
            {isError ? "Error" : "AI Generated Response"}
          </DialogTitle>
          <DialogDescription className="text-xl text-center text-gray-600">
            {isError ? "Something went wrong" : "Here's your personalized response"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className={`p-8 text-xl rounded-3xl border-2 whitespace-pre-wrap shadow-lg ${
            isError 
              ? "border-red-500 bg-red-50 text-red-600" 
              : "border-gray-200 bg-gray-50/50"
          }`}>
            {response}
          </div>
          {!isError && (
            <Button
              onClick={handleCopy}
              className="w-full text-2xl py-8 rounded-3xl shadow-[0_4px_0_0_#2563eb] flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all active:top-[2px] active:shadow-[0_0_0_0_#2563eb]"
            >
              <Copy className="w-6 h-6" />
              Copy Response
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 