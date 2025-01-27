import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Bot, X, Copy, BarChart2, TrendingUp, Star, Lightbulb, SendHorizonal, Download } from "lucide-react"
import { SentimentChart } from "./charts/SentimentChart"
import { api } from "@/services/api"
import { toast } from "sonner"
import { ChatBubble, ChatBubbleMessage, ChatBubbleAvatar } from "@/components/ui/chat-bubble"
import { Input } from "@/components/ui/input"
import { FormattedMessage } from "./FormattedMessage"
import dynamic from 'next/dynamic'

interface AnalyticsDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedReviews: any[]
}

// Funzione per ottenere l'icona appropriata per ogni prompt
const getPromptIcon = (prompt: string) => {
  if (prompt.includes('problemi')) {
    return <BarChart2 className="w-5 h-5 text-blue-500" />
  }
  if (prompt.includes('forza')) {
    return <Star className="w-5 h-5 text-yellow-500" />
  }
  if (prompt.includes('trend')) {
    return <TrendingUp className="w-5 h-5 text-green-500" />
  }
  return <Lightbulb className="w-5 h-5 text-purple-500" />
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

  const handleDownloadPDF = async () => {
    const analysisContent = messages
      .filter(msg => msg.role === "assistant")
      .map(msg => msg.content)
      .join("\n\n");

    if (!analysisContent) {
      toast.error("Nessuna analisi da scaricare");
      return;
    }

    try {
      // Import dinamico di html2pdf solo quando necessario
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default;

      const element = document.createElement("div");
      element.innerHTML = `
        <div style="font-family: system-ui, sans-serif; padding: 2rem;">
          <h1 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem;">
            Analisi Recensioni
          </h1>
          <div style="white-space: pre-wrap;">${analysisContent}</div>
        </div>
      `;

      const opt = {
        margin: 1,
        filename: 'analisi-recensioni.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
      toast.success("PDF scaricato con successo");
    } catch (error) {
      toast.error("Errore durante il download del PDF");
      console.error(error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] p-0 bg-white rounded-3xl overflow-hidden flex flex-col">
        {/* Header solo con pulsante download */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Analisi Recensioni</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownloadPDF}
            className="rounded-full hover:bg-gray-100"
            disabled={!messages.some(msg => msg.role === "assistant")}
          >
            <Download className="h-5 w-5" />
          </Button>
        </div>

        {/* Chat Area - scrollabile */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className="relative group">
                <ChatBubble variant={msg.role === "user" ? "sent" : "received"}>
                  {msg.role === "assistant" && (
                    <ChatBubbleAvatar>
                      <div className="bg-black rounded-full p-1">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    </ChatBubbleAvatar>
                  )}
                  
                  {msg.role === "user" ? (
                    <ChatBubbleMessage variant="sent" className="text-lg rounded-2xl">
                      {msg.content}
                    </ChatBubbleMessage>
                  ) : (
                    <FormattedMessage content={msg.content} />
                  )}

                  {msg.role === "assistant" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCopy(msg.content)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </ChatBubble>
              </div>
            ))}
          </div>
        </div>

        {/* Input Area - fisso, più compatto */}
        <div className="border-t bg-white p-4 space-y-3">
          {/* Input con altezza fissa */}
          <div className="relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && inputValue.trim() && handleAnalysis(inputValue)}
              placeholder={isLoading ? "Analisi in corso..." : "Fai domande sull'analisi..."}
              disabled={isLoading}
              className="pr-24 bg-white border-2 border-gray-100 rounded-xl h-12
                        text-base focus:border-blue-500 focus:ring-0"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
              {inputValue && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setInputValue("")}
                  className="rounded-full h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="icon"
                className="rounded-full h-8 w-8 bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => handleAnalysis(inputValue)}
                disabled={!inputValue.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SendHorizonal className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Suggerimenti con scroll orizzontale */}
          <div className="relative">
            <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 pb-2">
              {suggestedPrompts.map(prompt => (
                <Button
                  key={prompt}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAnalysis(prompt)}
                  disabled={isLoading}
                  className="flex-shrink-0 bg-white hover:bg-blue-50 
                            border border-gray-200 rounded-full h-9
                            flex items-center gap-2 whitespace-nowrap"
                >
                  {getPromptIcon(prompt)}
                  <span className="text-sm">{prompt}</span>
                </Button>
              ))}
            </div>
            
            {/* Fade effect per indicare lo scroll */}
            <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white pointer-events-none" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}