"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, X, Download, MessageSquare, Send, BarChart2, LineChart, Bot } from "lucide-react"
import { api } from "@/services/api"
import { toast } from "sonner"
import { FormattedMessage } from "@/components/analytics/FormattedMessage"
import { ChatBubble, ChatBubbleMessage, ChatBubbleAvatar } from "@/components/ui/chat-bubble"
import { Input } from "@/components/ui/input"
import { AnalysesDropdown } from "@/components/analyses/AnalysesDropdown"
import { ChatInput } from "@/components/ui/chat-input"
import AnalysisDashboard from "@/components/analytics/AnalysisDashboard"

// Prima definiamo l'interfaccia base per l'analisi che verrà usata dal dashboard
interface DashboardAnalysis {
  meta: {
    hotelName: string;
    reviewCount: number;
    avgRating: number;  // Questo deve essere number per il dashboard
    platforms: string;
  };
  sentiment: {
    excellent: string;
    average: string;
    needsImprovement: string;
    distribution?: {
      rating5: string;
      rating4: string;
      rating3: string;
      rating2: string;
      rating1: string;
    };
  };
  strengths: Array<{
    title: string;
    impact: string;
    mentions: number;
    quote: string;
    details: string;
    marketingTips: Array<{
      action: string;
      cost: string;
      roi: string;
    }>;
  }>;
  issues: Array<{
    title: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    impact: string;
    mentions: number;
    quote: string;
    details: string;
    solution: {
      title: string;
      timeline: string;
      cost: string;
      roi: string;
      steps: string[];
    };
  }>;
  quickWins: Array<{
    action: string;
    timeline: string;
    cost: string;
    impact: string;
  }>;
  trends: Array<{
    metric: string;
    change: string;
    period: string;
  }>;
}

// Interfaccia per i dati che arrivano dall'API
interface APIAnalysis extends Omit<DashboardAnalysis, 'meta'> {
  meta: {
    hotelName: string;
    reviewCount: number;
    avgRating: string;  // Questo arriva come string dall'API
    platforms: string;
  };
}

// Interfaccia per il dropdown
interface DropdownAnalysis {
  _id: string;
  title: string;
  hotelId: string;
  hotelName: string;
  createdAt: string;
  updatedAt: string;
  reviewsAnalyzed: number;
  metadata: {
    dateRange: {
      start: string;
      end: string;
    };
    platforms: string[];
    creditsUsed: number;
  };
  analysis: APIAnalysis;
}

interface SelectedAnalysis extends DropdownAnalysis {}

interface Props {
  selectedAnalysis: SelectedAnalysis | null;
  // ... altri props se necessari
}

// Aggiungiamo il componente ThinkingMessage come in AnalyticsDialog
const ThinkingMessage = () => (
  <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl">
    <Bot className="h-6 w-6 text-blue-500 mt-1" />
    <div className="flex flex-col gap-2">
      <div className="font-medium text-gray-700">Thinking...</div>
      <div className="flex gap-1">
        <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]"></div>
        <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]"></div>
        <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce"></div>
      </div>
    </div>
  </div>
);

export default function AnalysesPage() {
  const [selectedAnalysis, setSelectedAnalysis] = useState<SelectedAnalysis | null>(null)
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [currentTypingContent, setCurrentTypingContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Effetto di digitazione come in AnalyticsDialog
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

  // Carica i messaggi quando viene selezionata un'analisi
  useEffect(() => {
    if (selectedAnalysis) {
      const loadFullAnalysis = async () => {
        try {
          setIsLoading(true);
          const fullAnalysis = await api.analytics.getFullAnalysis(selectedAnalysis._id);
          
          // Passa solo fullAnalysis.analysis al componente
          setMessages([
            { role: "user", content: "Analyze these reviews" },
            { role: "assistant", content: JSON.stringify(fullAnalysis.analysis) }
          ]);
        } catch (error) {
          toast.error("Errore nel caricamento dell'analisi completa");
        } finally {
          setIsLoading(false);
        }
      };

      loadFullAnalysis();
    }
  }, [selectedAnalysis])

  const handleAnalysis = async (prompt: string) => {
    if (!selectedAnalysis) return
    try {
      setIsLoading(true)
      setIsThinking(true)
      setMessages(prev => [...prev, { role: "user", content: prompt }])
      setInputValue("")
      
      const { analysis, suggestions } = await api.analytics.getFollowUpAnalysis(
        selectedAnalysis._id,
        prompt,
        messages
      )

      // Usa typeMessage per l'effetto di typing
      await typeMessage(analysis)
      
      setMessages(prev => [...prev, { role: "assistant", content: analysis }])
      setSuggestions(suggestions || [])
      
    } catch (error: any) {
      toast.error(error.message || "Error analyzing reviews")
    } finally {
      setIsLoading(false)
      setIsThinking(false)
      setCurrentTypingContent("")
    }
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
                onChange={(analysis: any) => {
                  setSelectedAnalysis(analysis as SelectedAnalysis);
                }}
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
                    <AnalysisDashboard 
                      data={{
                        ...selectedAnalysis.analysis,
                        meta: {
                          ...selectedAnalysis.analysis.meta,
                          avgRating: parseFloat(selectedAnalysis.analysis.meta.avgRating)
                        }
                      }}
                      onIssueAction={async (issue) => {
                        try {
                          const response = await api.analytics.getSolutionPlan(issue);
                          if (response.plan) {
                            handleAnalysis(`Come possiamo risolvere il problema "${issue.title}"?`);
                            setTimeout(() => {
                              handleAnalysis(JSON.stringify(response.plan, null, 2));
                            }, 500);
                          }
                        } catch (error: any) {
                          toast.error(error.message || "Error generating solution plan");
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="text-center">
                      <p className="text-gray-500 mb-4">Seleziona un'analisi per visualizzare gli insights</p>
                      <div className="flex justify-center">
                        <LineChart 
                          className="w-32 h-32 text-gray-300" 
                          strokeWidth={1.5}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right panel - Chat */}
            <div className="w-[35%] border-l flex flex-col bg-white relative">
              {selectedAnalysis ? (
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
                      
                      {/* Suggestions directly in header */}
                      <div className="px-4 pb-4 space-y-2">
                        {selectedAnalysis.analysis.issues.map((issue, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleAnalysis(issue.title)}
                            disabled={isLoading}
                            className="bg-white/80 hover:bg-blue-50 border border-gray-200 
                                     rounded-full h-auto py-2 px-3 flex items-center gap-2 text-left w-full"
                          >
                            <BarChart2 className="w-5 h-5 text-blue-500" />
                            <span className="text-base truncate">{issue.title}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Chat messages */}
                  <div 
                    ref={chatContainerRef} 
                    className="flex-1 overflow-y-auto pb-[80px]"
                  >
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
                                onMessage={(message) => {
                                  setIsThinking(true);
                                  setMessages(prev => [...prev, { role: 'user', content: message }]);
                                  handleAnalysis(message);
                                }}
                                onSuggestions={(newSuggestions) => setSuggestions(newSuggestions)}
                              />
                            )}
                          </ChatBubble>
                        </div>
                      ))}
                      
                      {isThinking && (
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
                            <ThinkingMessage />
                          </ChatBubble>
                        </div>
                      )}
                      
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
                            <FormattedMessage 
                              content={currentTypingContent}
                              onMessage={(message) => {
                                setIsThinking(true);
                                handleAnalysis(message);
                              }}
                            />
                          </ChatBubble>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Input area - ora fixed */}
                  <div className="absolute bottom-0 left-0 right-0 border-t bg-white p-4">
                    <div className="py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
                      {isLoading ? (
                        Array(3).fill(0).map((_, i) => (
                          <div 
                            key={i}
                            className="h-9 w-32 rounded-full bg-gray-100 animate-pulse"
                          />
                        ))
                      ) : suggestions.length > 0 ? (
                        suggestions.map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleAnalysis(suggestion)}
                            className="rounded-full text-sm whitespace-nowrap hover:bg-primary hover:text-white border-gray-200"
                          >
                            {suggestion}
                          </Button>
                        ))
                      ) : null}
                    </div>

                    <div className="relative">
                      <ChatInput
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && inputValue.trim()) {
                            e.preventDefault();
                            handleAnalysis(inputValue);
                          }
                        }}
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