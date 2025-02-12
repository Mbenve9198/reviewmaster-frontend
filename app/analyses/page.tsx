"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, X, Download, MessageSquare, Send, BarChart2 } from "lucide-react"
import { api } from "@/services/api"
import { toast } from "sonner"
import { FormattedMessage } from "@/components/analytics/FormattedMessage"
import { ChatBubble, ChatBubbleMessage, ChatBubbleAvatar } from "@/components/ui/chat-bubble"
import { Input } from "@/components/ui/input"
import { AnalysesDropdown } from "@/components/analyses/AnalysesDropdown"

interface Analysis {
  _id: string
  title: string
  hotelName: string
  createdAt: string
  reviewsAnalyzed: number
  analysis: {
    meta: {
      avgRating: string
    }
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
    if (!selectedAnalysis) return
    try {
      setIsLoading(true)
      setMessages(prev => [...prev, { role: "user", content: prompt }])
      setInputValue("")
      
      const previousMessages = messages.length > 0 ? prompt : null
      
      const { analysis } = await api.analytics.getFollowUpAnalysis(
        selectedAnalysis._id,
        prompt,
        previousMessages,
        messages
      )

      await typeMessage(analysis)
      setMessages(prev => [...prev, { role: "assistant", content: analysis }])
      
    } catch (error: any) {
      toast.error(error.message || "Error analyzing reviews")
    } finally {
      setIsLoading(false)
    }
  }

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

  const handleDownloadPDF = async () => {
    if (!selectedAnalysis) return
    try {
      await api.analytics.downloadAnalysisPDF(selectedAnalysis._id)
      toast.success("PDF download started")
    } catch (error) {
      toast.error("Failed to download PDF")
    }
  }

  return (
    <div className="flex flex-col px-10 md:pl-[96px] py-12 min-h-screen">
      <div className="max-w-[1400px] mx-auto w-full space-y-12">
        {/* Header modernizzato e allineato a sinistra */}
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue-600 to-blue-400" />
            <h1 className="text-3xl sm:text-4xl font-semibold bg-gradient-to-b from-blue-800 to-blue-600 bg-clip-text text-transparent">
              Analysis
            </h1>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <p className="text-base">
              Analyze your reviews and get AI-powered insights
            </p>
          </div>
        </div>

        {/* Main content */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {selectedAnalysis && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadPDF}
                    className="rounded-xl border-gray-200 hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                )}
              </div>
              <AnalysesDropdown 
                value={selectedAnalysis} 
                onChange={setSelectedAnalysis}
              />
            </div>
          </div>

          {/* Main content */}
          <div className="flex overflow-hidden">
            {/* Left panel - Analysis */}
            <div className="w-[65%] bg-gray-50 overflow-y-auto">
              <div className="max-w-4xl mx-auto p-8">
                {selectedAnalysis ? (
                  <div className="bg-white rounded-xl shadow-sm">
                    <FormattedMessage 
                      content={JSON.stringify(selectedAnalysis.analysis)} 
                      variant="received" 
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="text-center">
                      <p className="text-gray-500 mb-4">Select an analysis to view insights</p>
                      <img 
                        src="/empty-state.svg" 
                        alt="Select analysis" 
                        className="w-64 h-64 opacity-50"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right panel - Chat */}
            <div className="w-[35%] border-l flex flex-col bg-white">
              {selectedAnalysis ? (
                <>
                  {/* Suggestions */}
                  <div className="border-b p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="h-4 w-4 text-gray-500" />
                      <h3 className="text-sm font-medium text-gray-500">
                        Ask about the analysis
                      </h3>
                    </div>
                    
                    <div className="space-y-2">
                      {selectedAnalysis.followUpSuggestions?.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleAnalysis(suggestion)}
                          disabled={isLoading}
                          className="w-full justify-start text-left"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Chat messages */}
                  <div 
                    ref={chatContainerRef} 
                    className="flex-1 overflow-y-auto p-4 space-y-4"
                  >
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

                  {/* Input area */}
                  <div className="border-t p-4">
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
                        className="pr-24 rounded-xl"
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
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Select an analysis to start a conversation
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}