import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Bot, X, Copy } from "lucide-react"
import { SentimentChart } from "./charts/SentimentChart"
import { api } from "@/services/api"
import { toast } from "sonner"
import { ChatBubble, ChatBubbleMessage, ChatBubbleAvatar } from "@/components/ui/chat-bubble"
import { Input } from "@/components/ui/input"

interface AnalyticsDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedReviews: any[]
}

export function AnalyticsDialog({ isOpen, onClose, selectedReviews }: AnalyticsDialogProps) {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState("")

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
      setInputValue("")
      
      const { analysis } = await api.analytics.analyzeReviews(selectedReviews, prompt)
      
      setMessages(prev => [...prev, { role: "assistant", content: analysis }])
    } catch (error: any) {
      console.error("Analysis error:", error)
      toast.error(error.message || "Errore durante l'analisi")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Testo copiato negli appunti")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Analisi Recensioni</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-1 h-full">
          <div className="w-2/3 flex flex-col p-4">
            {/* Suggested Prompts */}
            <div className="flex flex-wrap gap-2 mb-4">
              {suggestedPrompts.map(prompt => (
                <Button 
                  key={prompt}
                  variant="outline"
                  onClick={() => handleAnalysis(prompt)}
                  disabled={isLoading}
                  className="bg-white hover:bg-gray-50"
                >
                  {prompt}
                </Button>
              ))}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-4">
              {messages.map((msg, i) => (
                <div key={i} className="relative">
                  <ChatBubble variant={msg.role === "user" ? "sent" : "received"}>
                    {msg.role === "assistant" && (
                      <ChatBubbleAvatar>
                        <div className="bg-black rounded-sm p-1">
                          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-b-[8px] border-b-white border-r-[6px] border-r-transparent" />
                        </div>
                      </ChatBubbleAvatar>
                    )}
                    <ChatBubbleMessage 
                      variant={msg.role === "user" ? "sent" : "received"}
                      className="text-lg"
                    >
                      {msg.content}
                    </ChatBubbleMessage>
                    {msg.role === "assistant" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute bottom-2 right-2 opacity-50 hover:opacity-100"
                        onClick={() => handleCopy(msg.content)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </ChatBubble>
                </div>
              ))}
              {isLoading && (
                <ChatBubble variant="received">
                  <ChatBubbleAvatar>
                    <div className="bg-black rounded-sm p-1">
                      <div className="w-0 h-0 border-l-[6px] border-l-transparent border-b-[8px] border-b-white border-r-[6px] border-r-transparent" />
                    </div>
                  </ChatBubbleAvatar>
                  <ChatBubbleMessage variant="received" isLoading={true} />
                </ChatBubble>
              )}
            </div>

            {/* Input Area */}
            <div className="mt-4">
              <div className="relative">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAnalysis(inputValue)}
                  placeholder="Type your message..."
                  className="pr-10 border-2 border-blue-500 rounded-full"
                />
                <Button
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => handleAnalysis(inputValue)}
                  disabled={!inputValue.trim() || isLoading}
                >
                  <svg width="15" height="15" viewBox="0 0 15 15">
                    <path
                      d="M1.20308 1.04312C1.00481 0.954998 0.772341 1.0048 0.627577 1.16641C0.482813 1.32802 0.458794 1.56455 0.568117 1.75196L3.92115 7.50002L0.568117 13.2481C0.458794 13.4355 0.482813 13.672 0.627577 13.8336C0.772341 13.9952 1.00481 14.045 1.20308 13.9569L14.2031 7.95693C14.3837 7.87668 14.5 7.69762 14.5 7.50002C14.5 7.30243 14.3837 7.12337 14.2031 7.04312L1.20308 1.04312Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    />
                  </svg>
                </Button>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="w-1/3 border-l p-4">
            <SentimentChart reviews={selectedReviews} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}