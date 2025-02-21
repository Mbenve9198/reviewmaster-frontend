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

const ChatInput = ({ value, onChange, onKeyPress, isExpanded, onSend, isLoading }: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyPress: (e: React.KeyboardEvent) => void
  isExpanded: boolean
  onSend: () => void
  isLoading: boolean
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])

  return (
    <div className="relative flex items-start">
      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyPress}
          placeholder={isExpanded ? "Start typing..." : ""}
          rows={1}
          className={`w-full bg-gray-50 border border-gray-200 rounded-xl pr-16 py-3 px-4 resize-none overflow-hidden
            ${isExpanded ? 'min-h-[60px]' : 'min-h-[45px]'}
            focus:ring-0 focus:border-gray-300 placeholder:text-gray-500`}
          style={{
            maxHeight: '200px'  // Altezza massima prima dello scroll
          }}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Button
            onClick={onSend}
            disabled={!value.trim() || isLoading}
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/${analysisId}/follow-up`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: 'initial' })
      })
      
      if (!response.ok) throw new Error('Failed to fetch suggestions')
      
      const data = await response.json()
      if (data && data.suggestions) {
        setSuggestedQuestions(data.suggestions.map((q: string, i: number) => ({
          id: `q-${i}`,
          text: q
        })))
      } else {
        setSuggestedQuestions([])
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      setSuggestedQuestions([])
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/${analysisId}/follow-up`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          question: content
        })
      })
      
      if (!response.ok) throw new Error('Failed to get response')
      
      const data = await response.json()
      
      const newAssistantMessage: Message = {
        role: 'assistant',
        content: data.response || data.analysis,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, newAssistantMessage])
      
      // Aggiorniamo i suggerimenti con quelli ricevuti dalla risposta
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setSuggestedQuestions(data.suggestions.map((text: string, i: number) => ({
          id: `q-${i}`,
          text
        })))
      }

    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Mi dispiace, si è verificato un errore nel processare la tua richiesta. Per favore riprova.',
        timestamp: new Date()
      }])
      setSuggestedQuestions([])
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

  const TypingIndicator = () => (
    <div className="flex justify-start">
      <div className="bg-gray-100 p-3 rounded-2xl flex items-center gap-2">
        <Bot className="h-4 w-4 text-gray-500" />
        <div className="flex gap-1">
          <motion.div
            className="w-1.5 h-1.5 bg-gray-400 rounded-full"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="w-1.5 h-1.5 bg-gray-400 rounded-full"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-1.5 h-1.5 bg-gray-400 rounded-full"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-full bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden flex flex-col">
      {/* Header con bordo inferiore */}
      <div className="p-4 border-b border-gray-100/80 flex justify-between items-center bg-white/50">
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
      <ScrollArea className={`flex-1 ${!isExpanded ? 'px-2' : 'p-4'}`} ref={scrollAreaRef}>
        <div className={`space-y-4 ${!isExpanded ? 'flex flex-col items-center' : ''}`}>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${
                isExpanded 
                  ? message.role === 'user' ? 'justify-end' : 'justify-start'
                  : 'justify-center w-full'
              }`}
            >
              {!isExpanded ? (
                <div className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                  {message.role === 'user' ? (
                    <div className="h-8 w-8 flex items-center justify-center text-gray-600">
                      <span className="text-xs">You</span>
                    </div>
                  ) : (
                    <Bot className="h-5 w-5 text-gray-600" />
                  )}
                </div>
              ) : (
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
              )}
            </motion.div>
          ))}
          {isLoading && (
            <div className={`flex ${!isExpanded ? 'justify-center' : 'justify-start'}`}>
              <TypingIndicator />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input e Suggested Questions */}
      <div className="p-4 space-y-3 border-t border-gray-100">
        <ChatInput
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage(inputValue)
            }
          }}
          isExpanded={isExpanded}
          onSend={() => sendMessage(inputValue)}
          isLoading={isLoading}
        />

        {/* Suggested Questions solo quando è espanso */}
        {isExpanded && suggestedQuestions.length > 0 && (
          <div className="w-full">
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2 overflow-x-auto">
                {suggestedQuestions.map((question) => (
                  <button
                    key={question.id}
                    onClick={() => {
                      setSelectedQuestion(question.id)
                      setInputValue(question.text)
                    }}
                    className={`shrink-0 px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap
                      ${selectedQuestion === question.id 
                        ? 'bg-blue-100 text-blue-700 border-blue-200' 
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      } border`}
                  >
                    {question.text}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  )
} 