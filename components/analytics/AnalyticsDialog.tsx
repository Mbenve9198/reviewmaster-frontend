import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Bot } from "lucide-react"
import { SentimentChart } from "./charts/SentimentChart"
import { api } from "@/services/api"
import { toast } from "sonner"
import { ChatBubble, ChatBubbleMessage, ChatBubbleAvatar } from "@/components/ui/chat-bubble"

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
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col bg-white rounded-lg shadow-xl">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-semibold">Analisi Recensioni</DialogTitle>
          <DialogDescription className="text-gray-600">
            Analisi di {selectedReviews.length} recensioni selezionate
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex gap-4 p-6">
          <div className="w-2/3 flex flex-col">
            <div className="flex flex-wrap gap-2 mb-4">
              {suggestedPrompts.map(prompt => (
                <Button 
                  key={prompt}
                  variant="outline"
                  onClick={() => handleAnalysis(prompt)}
                  disabled={isLoading}
                  className="bg-white hover:bg-gray-50 border rounded-lg"
                >
                  {prompt}
                </Button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 p-4">
              {messages.map((msg, i) => (
                <ChatBubble
                  key={i}
                  variant={msg.role === "user" ? "sent" : "received"}
                >
                  {msg.role === "assistant" && (
                    <ChatBubbleAvatar fallback="AI">
                      <Bot className="h-5 w-5" />
                    </ChatBubbleAvatar>
                  )}
                  <ChatBubbleMessage 
                    variant={msg.role === "user" ? "sent" : "received"}
                    className="prose prose-sm max-w-none"
                  >
                    {msg.content}
                  </ChatBubbleMessage>
                </ChatBubble>
              ))}
              {isLoading && (
                <ChatBubble variant="received">
                  <ChatBubbleAvatar fallback="AI">
                    <Bot className="h-5 w-5" />
                  </ChatBubbleAvatar>
                  <ChatBubbleMessage 
                    variant="received"
                    isLoading={true}
                  />
                </ChatBubble>
              )}
            </div>
          </div>

          <div className="w-1/3 bg-white p-4 border rounded-lg">
            <SentimentChart reviews={selectedReviews} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}