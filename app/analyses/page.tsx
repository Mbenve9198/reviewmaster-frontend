"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, X, Download, MessageSquare, Send } from "lucide-react"
import { api } from "@/services/api"
import { toast } from "sonner"
import { FormattedMessage } from "@/components/analytics/FormattedMessage"
import { ChatBubble, ChatBubbleMessage, ChatBubbleAvatar } from "@/components/ui/chat-bubble"
import { Input } from "@/components/ui/input"
import { AnalysesCombobox } from "@/components/analyses/AnalysesCombobox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"

interface Analysis {
  _id: string
  title: string
  hotelId: string
  hotelName: string
  createdAt: string
  reviewsAnalyzed: number
  metadata: {
    dateRange: {
      start: string
      end: string
    }
    platforms: string[]
    creditsUsed: number
  }
  analysis: {
    meta: {
      hotelName: string
      avgRating: string
    }
    sentiment: {
      excellent: string
      average: string
      needsImprovement: string
    }
    strengths: Array<{
      title: string
      impact: string
      quote: string
      details: string
      mentions: number
    }>
    issues: Array<{
      title: string
      priority: string
      quote: string
      details: string
      mentions: number
      solution: {
        title: string
        timeline: string
        cost: string
        roi: string
      }
    }>
    trends: Array<{
      metric: string
      change: string
      period: string
    }>
  }
  followUpSuggestions?: string[]
}

export default function AnalysesPage() {
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null)
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [currentTypingContent, setCurrentTypingContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Effetto di digitazione
  const typeMessage = (content: string, speed = 10) => {
    return new Promise<void>((resolve) => {
      let i = 0
      setCurrentTypingContent("")
      
      const interval = setInterval(() => {
        setCurrentTypingContent(prev => prev + content[i])
        i++
        
        if (i === content.length) {
          clearInterval(interval)
          setCurrentTypingContent("")
          resolve()
        }
      }, speed)
    })
  }

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

  // Carica i messaggi quando viene selezionata un'analisi
  useEffect(() => {
    if (selectedAnalysis) {
      setMessages([
        { role: "user", content: "Analyze these reviews" },
        { role: "assistant", content: JSON.stringify(selectedAnalysis.analysis) }
      ])
    }
  }, [selectedAnalysis])

  const handleAnalysis = async (prompt: string) => {
    try {
      setIsLoading(true)
      setMessages(prev => [...prev, { role: "user", content: prompt }])
      setInputValue("")
      
      const previousMessages = messages.length > 0 ? prompt : null
      
      const { analysis } = await api.analytics.getFollowUpAnalysis(
        selectedAnalysis?._id as string,
        prompt,
        previousMessages,
        messages
      )

      // Per i follow-up, usa l'animazione di typing
      await typeMessage(analysis)
      setMessages(prev => [...prev, { role: "assistant", content: analysis }])
      
    } catch (error: any) {
      toast.error(error.message || "Error analyzing reviews")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    // ... stesso codice di AnalyticsDialog ...
  }

  const handleRenameAnalysis = async (newTitle: string) => {
    try {
      await api.analytics.renameAnalysis(selectedAnalysis?._id as string, newTitle)
      toast.success("Analysis renamed successfully")
    } catch (error: any) {
      toast.error(error.message || "Error renaming analysis")
    }
  }

  const handleDeleteAnalysis = async () => {
    if (!selectedAnalysis) return

    try {
      await api.analytics.deleteAnalysis(selectedAnalysis._id)
      setSelectedAnalysis(null)
      toast.success("Analysis deleted successfully")
    } catch (error: any) {
      toast.error(error.message || "Error deleting analysis")
    }
  }

  return (
    <>
      {/* Sfondo con gradiente */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#FAFAFB] via-[#F0F0F2] to-[#FAFAFB] backdrop-blur-sm" />
      
      <div className="flex flex-col px-10 md:pl-[96px] py-12">
        <div className="max-w-[1400px] mx-auto w-full space-y-12">
          {/* Header modernizzato e allineato a sinistra */}
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue-600 to-blue-400" />
              <h1 className="text-3xl sm:text-4xl font-semibold bg-gradient-to-b from-blue-800 to-blue-600 bg-clip-text text-transparent">
                Analyses
              </h1>
            </div>
            <p className="text-gray-500">
              Review and analyze your hotel performance data
            </p>
          </div>

          {/* Main content */}
          <div className="flex gap-8 h-[calc(100vh-220px)]">
            {/* Left panel */}
            <div className="w-[65%] bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <AnalysesCombobox
                    value={selectedAnalysis}
                    onChange={setSelectedAnalysis}
                  />
                  {selectedAnalysis && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadPDF}
                        className="rounded-xl border-gray-200 hover:bg-gray-50"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="rounded-xl"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => {
                            const newTitle = prompt("Enter new title", selectedAnalysis.title)
                            if (newTitle) handleRenameAnalysis(newTitle)
                          }}>
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={handleDeleteAnalysis}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              </div>

              <div className="p-6">
                {selectedAnalysis ? (
                  <FormattedMessage 
                    content={JSON.stringify(selectedAnalysis.analysis)} 
                    variant="received" 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Select an analysis to view details</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right panel */}
            <div className="w-[35%] bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden flex flex-col">
              {selectedAnalysis && (
                <>
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
                      
                      {/* Suggestions */}
                      <div className="px-4 pb-4 space-y-2">
                        {selectedAnalysis.followUpSuggestions?.map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleAnalysis(suggestion)}
                            disabled={isLoading}
                            className="w-full justify-start"
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Chat area */}
                  <div ref={chatContainerRef} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                      {messages.slice(2).map((msg, i) => (
                        <ChatBubble
                          key={i}
                          variant={msg.role === "user" ? "sent" : "received"}
                        >
                          {msg.role === "assistant" && (
                            <ChatBubbleAvatar>
                              <img 
                                src="/ai-avatar.png"
                                alt="AI Assistant"
                                className="w-8 h-8 rounded-full"
                              />
                            </ChatBubbleAvatar>
                          )}
                          
                          {msg.role === "user" ? (
                            <ChatBubbleMessage variant="sent">
                              {msg.content}
                            </ChatBubbleMessage>
                          ) : (
                            <FormattedMessage content={msg.content} />
                          )}
                        </ChatBubble>
                      ))}
                      
                      {currentTypingContent && (
                        <ChatBubble variant="received">
                          <ChatBubbleAvatar>
                            <img 
                              src="/ai-avatar.png"
                              alt="AI Assistant"
                              className="w-8 h-8 rounded-full"
                            />
                          </ChatBubbleAvatar>
                          <FormattedMessage content={currentTypingContent} />
                        </ChatBubble>
                      )}
                    </div>
                  </div>

                  {/* Input area */}
                  <div className="border-t bg-white p-4">
                    <div className="relative">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && inputValue.trim()) {
                            handleAnalysis(inputValue)
                          }
                        }}
                        placeholder={isLoading ? "Analysis in progress..." : "Ask questions about the analysis..."}
                        disabled={isLoading}
                        className="pr-24"
                      />
                      {inputValue.trim() && (
                        <Button
                          size="sm"
                          onClick={() => handleAnalysis(inputValue)}
                          disabled={isLoading}
                          className="absolute right-2 top-1/2 -translate-y-1/2"
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 