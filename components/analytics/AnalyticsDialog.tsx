"use client"

import { useState, useRef, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Bot, X, Copy, BarChart2, TrendingUp, Star, Lightbulb, SendHorizonal, Download, MessageSquare, Send } from "lucide-react"
import { SentimentChart } from "./charts/SentimentChart"
import { api } from "@/services/api"
import { toast } from "sonner"
import { ChatBubble, ChatBubbleMessage, ChatBubbleAvatar } from "@/components/ui/chat-bubble"
import { Input } from "@/components/ui/input"
import { FormattedMessage } from "./FormattedMessage"
import dynamic from 'next/dynamic'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface AnalyticsDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedReviews: any[]
}

interface Analysis {
  meta: {
    hotelName: string;
    avgRating: string;
  };
  sentiment: {
    excellent: string;
    average: string;
    needsImprovement: string;
  };
  strengths: Array<{
    title: string;
    impact: string;
    quote: string;
    details: string;
    mentions: number;
  }>;
  issues: Array<{
    title: string;
    priority: string;
    quote: string;
    details: string;
    mentions: number;
    solution: {
      title: string;
      timeline: string;
      cost: string;
      roi: string;
    };
  }>;
  trends: Array<{
    metric: string;
    change: string;
    period: string;
  }>;
}

// Funzione per ottenere l'icona appropriata per ogni prompt
const getPromptIcon = (prompt: string) => {
  if (prompt.includes('problemi')) {
    return <BarChart2 className="w-5 h-5 text-blue-500" />
  }
  if (prompt.includes('positivi') || prompt.includes('marketing')) {
    return <Star className="w-5 h-5 text-yellow-500" />
  }
  if (prompt.includes('evoluta') || prompt.includes('mesi')) {
    return <TrendingUp className="w-5 h-5 text-green-500" />
  }
  return <Lightbulb className="w-5 h-5 text-purple-500" />
}

interface Message {
  sender: "user" | "ai"
  content: string
}

interface AIChatHistoryProps {
  messages: Message[]
  onSendMessage: (message: string) => void
  isLoading?: boolean
  className?: string
}

export function AIChatHistory({ messages, onSendMessage, isLoading, className }: AIChatHistoryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSendMessage(input)
      setInput("")
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg bg-primary text-white hover:bg-primary/90"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className={cn("w-full sm:w-[400px] p-0 bg-white", className)}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-lg">Chat History</h3>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex w-max max-w-[80%] rounded-lg px-4 py-2",
                    message.sender === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.content}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="bg-primary text-white hover:bg-primary/90"
              >
                Send
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function AnalyticsDialog({ isOpen, onClose, selectedReviews }: AnalyticsDialogProps) {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [currentTypingContent, setCurrentTypingContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Effetto di digitazione
  const typeMessage = (content: string, speed = 10) => {
    return new Promise<void>((resolve) => {
      let i = 0;
      setCurrentTypingContent("");
      
      const interval = setInterval(() => {
        setCurrentTypingContent(prev => prev + content[i]);
        i++;
        
        if (i === content.length) {
          clearInterval(interval);
          setCurrentTypingContent("");
          resolve();
        }
      }, speed);
    });
  };

  // Funzione per scrollare in fondo
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }

  // Scroll automatico quando arrivano nuovi messaggi
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Esegui l'analisi iniziale quando il dialog viene aperto
  useEffect(() => {
    if (isOpen && selectedReviews.length > 0) {
      handleAnalysis("Analizza queste recensioni")
    }
  }, [isOpen, selectedReviews])

  const handleAnalysis = async (prompt: string) => {
    try {
      setIsLoading(true)
      setMessages(prev => [...prev, { role: "user", content: prompt }])
      setInputValue("")
      
      const previousMessages = messages.length > 0 ? prompt : null
      
      const { analysis, suggestions } = await api.analytics.analyzeReviews(
        selectedReviews, 
        prompt,
        previousMessages,
        messages
      )
      
      // Se è la prima analisi (non ci sono messaggi precedenti), mostra subito il risultato
      if (!previousMessages) {
        setMessages(prev => [...prev, { role: "assistant", content: analysis }])
        setSuggestions(suggestions)
      } else {
        // Per i follow-up, usa l'animazione di typing
        setCurrentTypingContent(analysis)
        const words = analysis.split(' ')
        let currentText = ''
        
        for (let i = 0; i < words.length; i++) {
          currentText += words[i] + ' '
          setCurrentTypingContent(currentText)
          await new Promise(resolve => setTimeout(resolve, 50))
        }
        
        setMessages(prev => [...prev, { role: "assistant", content: analysis }])
        setCurrentTypingContent('')
      }

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
    const analysisContent = messages.length >= 2 ? messages[1].content : null;

    if (!analysisContent) {
      toast.error("Nessuna analisi da scaricare");
      return;
    }

    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default;

      let formattedContent;
      try {
        const analysis: Analysis = JSON.parse(analysisContent);
        formattedContent = `
          <div style="font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto;">
            <h1 style="font-size: 24px; color: #1a1a1a; margin-bottom: 24px;">
              ${analysis.meta.hotelName} - Analisi Recensioni
            </h1>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
              <h2 style="font-size: 18px; color: #334155; margin-bottom: 16px;">Panoramica</h2>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
                <div style="text-align: center;">
                  <div style="font-size: 24px; font-weight: bold; color: #1e40af;">${analysis.meta.avgRating}</div>
                  <div style="font-size: 14px; color: #64748b;">Rating Medio</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 24px; font-weight: bold; color: #15803d;">${analysis.sentiment.excellent}</div>
                  <div style="font-size: 14px; color: #64748b;">Eccellente</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 24px; font-weight: bold; color: #854d0e;">${analysis.sentiment.average}</div>
                  <div style="font-size: 14px; color: #64748b;">Nella Media</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 24px; font-weight: bold; color: #991b1b;">${analysis.sentiment.needsImprovement}</div>
                  <div style="font-size: 14px; color: #64748b;">Da Migliorare</div>
                </div>
              </div>
            </div>

            <div style="margin-bottom: 24px;">
              <h2 style="font-size: 18px; color: #15803d; margin-bottom: 16px;">Punti di Forza</h2>
              ${analysis.strengths.map(strength => `
                <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <div>
                      <strong style="color: #166534;">${strength.title}</strong>
                      <span style="color: #166534; margin-left: 8px; font-size: 14px;">
                        ${strength.mentions} menzioni
                      </span>
                    </div>
                    <span style="color: #166534;">Impact: ${strength.impact}</span>
                  </div>
                  <blockquote style="margin: 8px 0; padding-left: 12px; border-left: 3px solid #86efac; font-style: italic; color: #374151;">
                    "${strength.quote}"
                  </blockquote>
                  <p style="margin: 8px 0; color: #374151;">${strength.details}</p>
                </div>
              `).join('')}
            </div>

            <div style="margin-bottom: 24px;">
              <h2 style="font-size: 18px; color: #991b1b; margin-bottom: 16px;">Problemi Critici</h2>
              ${analysis.issues.map(issue => `
                <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <div>
                      <strong style="color: #991b1b;">${issue.title}</strong>
                      <span style="color: #991b1b; margin-left: 8px; font-size: 14px;">
                        ${issue.mentions} menzioni
                      </span>
                    </div>
                    <span style="color: #991b1b;">Priority: ${issue.priority}</span>
                  </div>
                  <blockquote style="margin: 8px 0; padding-left: 12px; border-left: 3px solid #fca5a5; font-style: italic; color: #374151;">
                    "${issue.quote}"
                  </blockquote>
                  <p style="margin: 8px 0; color: #374151;">${issue.details}</p>
                  <div style="background: white; padding: 12px; border-radius: 6px; margin-top: 12px;">
                    <strong style="color: #991b1b;">${issue.solution.title}</strong>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 8px;">
                      <div style="text-align: center;">
                        <div style="font-size: 12px; color: #64748b;">Timeline</div>
                        <div>${issue.solution.timeline}</div>
                      </div>
                      <div style="text-align: center;">
                        <div style="font-size: 12px; color: #64748b;">Cost</div>
                        <div>${issue.solution.cost}</div>
                      </div>
                      <div style="text-align: center;">
                        <div style="font-size: 12px; color: #64748b;">ROI</div>
                        <div>${issue.solution.roi}</div>
                      </div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>

            <div style="margin-bottom: 24px;">
              <h2 style="font-size: 18px; color: #334155; margin-bottom: 16px;">Trend Recenti</h2>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
                ${analysis.trends.map(trend => `
                  <div style="text-align: center; background: #f8fafc; padding: 16px; border-radius: 8px;">
                    <div style="font-size: 14px; color: #64748b;">${trend.metric}</div>
                    <div style="font-size: 20px; font-weight: bold; color: ${
                      trend.change.startsWith('+') ? '#15803d' : 
                      trend.change.startsWith('-') ? '#991b1b' : 
                      '#334155'
                    };">${trend.change}</div>
                    <div style="font-size: 12px; color: #64748b;">${trend.period}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `;
      } catch (e) {
        formattedContent = analysisContent;
      }

      const element = document.createElement("div");
      element.innerHTML = formattedContent;

      const opt = {
        margin: 10,
        filename: 'analisi-recensioni.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
      toast.success("PDF scaricato con successo");
    } catch (error) {
      console.error("Errore durante il download del PDF:", error);
      toast.error("Errore durante il download del PDF");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-screen h-screen p-0 bg-white max-w-none m-0 rounded-none">
        <DialogTitle className="sr-only">Reviews Analysis</DialogTitle>
        <DialogDescription className="sr-only">
          Analysis of hotel reviews with insights and recommendations
        </DialogDescription>
        <div className="flex flex-1 overflow-hidden h-screen">
          {/* Left panel */}
          <div className="w-[65%] border-r overflow-y-auto bg-gray-50">
            {/* Sticky header with gradient */}
            <div className="sticky top-0 z-10">
              <div className="absolute inset-x-0 h-24 bg-gradient-to-b from-white via-white to-transparent" />
              <div className="relative flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-semibold">Reviews Analysis</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadPDF}
                    className="rounded-full border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                    disabled={!messages.some(msg => msg.role === "assistant")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close dialog</span>
                </Button>
              </div>
            </div>

            <div className="p-8">
              {isLoading && messages.length === 1 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <p className="text-gray-500">Analyzing reviews...</p>
                </div>
              ) : messages.length >= 2 && (
                <div className="bg-white rounded-xl shadow-sm">
                  <FormattedMessage 
                    content={messages[1].content} 
                    variant="received" 
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div className="w-[35%] flex flex-col">
            {/* Sticky header with gradient and suggestions */}
            <div className="sticky top-0 z-10">
              <div className="absolute inset-x-0 h-32 bg-gradient-to-b from-white via-white to-transparent" />
              <div className="relative">
                <div className="flex items-center gap-2 p-4">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-medium text-gray-500">
                    Questions about the analysis
                  </h3>
                </div>
                
                {/* Suggestions directly in header */}
                <div className="px-4 pb-4 space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAnalysis(suggestion)}
                            disabled={isLoading}
                            className="bg-white/80 hover:bg-blue-50 border border-gray-200 
                                     rounded-full h-auto py-2 px-3 flex items-center gap-2 text-left w-full"
                          >
                            {getPromptIcon(suggestion)}
                            <span className="text-base truncate">{suggestion}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-white border border-gray-200 text-gray-900 shadow-lg">
                          <p className="max-w-[300px] text-sm">{suggestion}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat area */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {messages.slice(2).map((msg, i) => (
                  <div key={i} className="relative group" style={{ willChange: 'transform' }}>
                    <ChatBubble variant={msg.role === "user" ? "sent" : "received"}>
                      {msg.role === "assistant" && (
                        <ChatBubbleAvatar>
                          <div className="rounded-full overflow-hidden w-8 h-8">
                            <img 
                              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ai_profile-image-5cGMUYt7uIe4gJLlE9iHrTqpTtVwOS.png"
                              alt="AI Assistant"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </ChatBubbleAvatar>
                      )}
                      
                      {msg.role === "user" ? (
                        <ChatBubbleMessage variant="sent" className="text-base rounded-2xl">
                          {msg.content}
                        </ChatBubbleMessage>
                      ) : (
                        <FormattedMessage 
                          content={msg.content} 
                          onMessage={(message) => handleAnalysis(message)}
                          onSuggestions={(newSuggestions) => setSuggestions(newSuggestions)}
                        />
                      )}
                    </ChatBubble>
                  </div>
                ))}
                
                {currentTypingContent && (
                  <div className="relative group">
                    <ChatBubble variant="received">
                      <ChatBubbleAvatar>
                        <div className="rounded-full overflow-hidden w-8 h-8">
                          <img 
                            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ai_profile-image-5cGMUYt7uIe4gJLlE9iHrTqpTtVwOS.png"
                            alt="AI Assistant"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </ChatBubbleAvatar>
                      <FormattedMessage content={currentTypingContent} />
                    </ChatBubble>
                  </div>
                )}
              </div>
            </div>

            {/* Input area */}
            <div className="border-t bg-white p-4">
              <div className="relative">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && inputValue.trim() && handleAnalysis(inputValue)}
                  placeholder={isLoading ? "Analysis in progress..." : "Ask questions about the analysis..."}
                  disabled={isLoading}
                  className="pr-24 bg-white border-2 border-gray-100 rounded-xl h-12
                            text-base focus:border-blue-500 focus:ring-0"
                />
                {inputValue.trim() && (
                  <Button
                    size="sm"
                    onClick={() => handleAnalysis(inputValue)}
                    disabled={isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}