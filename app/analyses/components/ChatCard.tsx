"use client"

import { useState, useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getCookie } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Send, Bot, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

interface ChatCardProps {
  analysisId: string
  isExpanded: boolean
  onToggleExpand: () => void
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface SuggestedQuestion {
  id: string
  text: string
}

export default function ChatCard({ analysisId, isExpanded, onToggleExpand }: ChatCardProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([])
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null)

  useEffect(() => {
    if (analysisId) {
      fetchSuggestedQuestions()
    }
  }, [analysisId])

  const fetchSuggestedQuestions = async () => {
    try {
      const token = getCookie('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analyses/${analysisId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch suggestions')
      
      const data = await response.json()
      // Assumiamo che le suggestions siano nell'oggetto data
      setSuggestedQuestions(data.suggestions.map((q: string, i: number) => ({
        id: `q-${i}`,
        text: q
      })))
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    }
  }

  const sendMessage = async (content: string) => {
    if (!content.trim()) return

    const newUserMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newUserMessage])
    setInputValue("")
    setIsLoading(true)
    setSelectedQuestion(null)

    try {
      const token = getCookie('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analyses/${analysisId}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: content })
      })
      
      if (!response.ok) throw new Error('Failed to get response')
      
      const data = await response.json()
      
      const newAssistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, newAssistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputValue)
    }
  }

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="h-full bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
        <h2 className="font-semibold text-gray-900">
          {isExpanded ? "AI Assistant" : ""}
        </h2>
        <button
          onClick={onToggleExpand}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isExpanded ? (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronLeft className="h-5 w-5 text-gray-500" />
          )}
        </button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white ml-4'
                    : 'bg-gray-100 text-gray-900 mr-4'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="h-4 w-4" />
                    <span className="text-xs font-medium">AI Assistant</span>
                  </div>
                )}
                <p className="text-sm">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-2xl">
                <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Suggested Questions */}
      {isExpanded && suggestedQuestions.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100">
          <ScrollArea className="whitespace-nowrap">
            <div className="flex gap-2">
              {suggestedQuestions.map((question) => (
                <Button
                  key={question.id}
                  variant="outline"
                  size="sm"
                  className={`shrink-0 text-sm ${
                    selectedQuestion === question.id
                      ? 'bg-blue-50 text-blue-600 border-blue-200'
                      : 'text-gray-600'
                  }`}
                  onClick={() => {
                    setSelectedQuestion(question.id)
                    setInputValue(question.text)
                  }}
                >
                  {question.text}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-100 flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isExpanded ? "Ask a question..." : ""}
          className="bg-white"
        />
        <Button
          onClick={() => sendMessage(inputValue)}
          disabled={!inputValue.trim() || isLoading}
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
} 