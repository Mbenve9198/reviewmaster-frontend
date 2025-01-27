import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { SentimentChart } from "./charts/SentimentChart"
import { api } from "@/services/api"
import { toast } from "sonner"

interface AnalyticsDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedReviews: any[]
}

export function AnalyticsDialog({ isOpen, onClose, selectedReviews }: AnalyticsDialogProps) {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [isLoading, setIsLoading] = useState(false)

  const suggestedPrompts = [
    "Analizza i problemi più ricorrenti e suggerisci soluzioni concrete",
    "Identifica i punti di forza più apprezzati dai clienti",
    "Mostra il trend delle valutazioni e analizza i periodi critici",
    "Suggerisci azioni di miglioramento basate sui feedback"
  ]

  const handleAnalysis = async (prompt: string) => {
    try {
      setIsLoading(true)
      setMessages(prev => [...prev, { role: "user", content: prompt }])
      
      const { analysis } = await api.analytics.analyzeReviews(selectedReviews, prompt)
      
      setMessages(prev => [...prev, { role: "assistant", content: analysis }])
    } catch (error: any) {
      console.error("Analysis error:", error)
      toast.error(error.message || "Errore durante l'analisi")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Analisi Recensioni</DialogTitle>
          <DialogDescription>
            Analisi di {selectedReviews.length} recensioni selezionate
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex gap-4">
          <div className="w-2/3 flex flex-col">
            <div className="flex flex-wrap gap-2 mb-4">
              {suggestedPrompts.map(prompt => (
                <Button 
                  key={prompt}
                  variant="outline"
                  onClick={() => handleAnalysis(prompt)}
                  disabled={isLoading}
                >
                  {prompt}
                </Button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 border rounded-lg">
              {messages.map((msg, i) => (
                <div key={i} className={`mb-4 ${msg.role === "assistant" ? "pl-4" : ""}`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analisi in corso...
                </div>
              )}
            </div>
          </div>

          <div className="w-1/3">
            <SentimentChart reviews={selectedReviews} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}