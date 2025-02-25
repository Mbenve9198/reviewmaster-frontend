"use client"

import { useState, useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getCookie } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Send, Bot, Loader2, FileText, Plus, X, MessageSquare, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from 'react-markdown'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ChatCardProps {
  analysisId: string
  isExpanded: boolean
  onToggleExpand: () => void
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string | Date
}

interface SuggestedQuestion {
  id: string
  text: string
}

interface Chat {
  _id: string
  messages: Message[]
  createdAt: Date
  title: string
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

// Componente per la navigazione orizzontale delle domande suggerite
const SuggestedQuestionsNav = ({ 
  questions, 
  selectedId, 
  onSelectQuestion 
}: {
  questions: SuggestedQuestion[]
  selectedId: string | null
  onSelectQuestion: (id: string, text: string) => void
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)
  
  useEffect(() => {
    const checkScrollIndicators = () => {
      const container = scrollContainerRef.current
      if (container) {
        setShowLeftArrow(container.scrollLeft > 0)
        setShowRightArrow(
          container.scrollLeft < container.scrollWidth - container.clientWidth - 10
        )
      }
    }
    
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScrollIndicators)
      window.addEventListener('resize', checkScrollIndicators)
      checkScrollIndicators()
      setTimeout(checkScrollIndicators, 300)
      
      return () => {
        container.removeEventListener('scroll', checkScrollIndicators)
        window.removeEventListener('resize', checkScrollIndicators)
      }
    }
  }, [questions])
  
  const scrollLeft = () => {
    const container = scrollContainerRef.current
    if (container) {
      container.scrollBy({ left: -200, behavior: 'smooth' })
    }
  }
  
  const scrollRight = () => {
    const container = scrollContainerRef.current
    if (container) {
      container.scrollBy({ left: 200, behavior: 'smooth' })
    }
  }
  
  return (
    <div className="relative w-full">
      {showLeftArrow && (
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full shadow-md bg-white h-6 w-6"
            onClick={scrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div 
        className="overflow-x-auto hide-scrollbar py-2 px-1 flex gap-2"
        ref={scrollContainerRef}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {questions.map((question) => (
          <button
            key={question.id}
            onClick={() => onSelectQuestion(question.id, question.text)}
            className={`shrink-0 px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap
              ${selectedId === question.id 
                ? 'bg-blue-100 text-blue-700 border-blue-200' 
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              } border`}
          >
            {question.text}
          </button>
        ))}
      </div>
      
      {showRightArrow && (
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full shadow-md bg-white h-6 w-6"
            onClick={scrollRight}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {showLeftArrow && (
        <div className="absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-0" />
      )}
      
      {showRightArrow && (
        <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-0" />
      )}
    </div>
  )
}

// Aggiungi questa funzione helper
const formatTimestamp = (timestamp: string | Date) => {
  if (typeof timestamp === 'string') {
    return new Date(timestamp).toLocaleTimeString()
  }
  return timestamp.toLocaleTimeString()
}

export default function ChatCard({ analysisId, isExpanded, onToggleExpand }: ChatCardProps) {
  const [viewMode, setViewMode] = useState<'list' | 'chat'>('chat')
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null)

  const initializeChats = async () => {
    try {
      const token = getCookie('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/${analysisId}/chats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!response.ok) throw new Error('Failed to fetch chats')
      const data = await response.json()
      
      // Filtra le chat valide (che hanno almeno un messaggio)
      const validChats = data.conversations.filter((chat: Chat) => 
        chat && chat.messages && chat.messages.length > 0
      )
      
      setChats(validChats)

      if (validChats.length > 0) {
        const lastChat = validChats[validChats.length - 1]
        // Verifica che la chat sia valida prima di selezionarla
        if (lastChat && lastChat.messages && lastChat.messages.length > 0) {
          setSelectedChat(lastChat)
          setMessages(lastChat.messages)
          setViewMode('chat')
        } else {
          setSelectedChat(null)
          setMessages([])
          setViewMode('list')
          loadInitialSuggestions()
        }
      } else {
        setSelectedChat(null)
        setMessages([])
        setViewMode('list')
        loadInitialSuggestions()
      }
    } catch (error) {
      console.error('Error fetching chats:', error)
      // In caso di errore, resetta lo stato
      setSelectedChat(null)
      setMessages([])
      setViewMode('list')
      loadInitialSuggestions()
    }
  }

  const loadInitialSuggestions = async () => {
    try {
      const token = getCookie('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/${analysisId}`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      )

      if (!response.ok) throw new Error('Failed to fetch analysis')
      const data = await response.json()
      
      // Usa le followUpSuggestions salvate nell'analisi
      if (data.followUpSuggestions && data.followUpSuggestions.length > 0) {
        setSuggestedQuestions(data.followUpSuggestions.map((text: string, index: number) => ({
          id: `suggestion-${index}`,
          text
        })))
      }
    } catch (error) {
      console.error('Error loading initial suggestions:', error)
    }
  }

  useEffect(() => {
    if (analysisId) {
      initializeChats()
    }
  }, [analysisId])

  const sendMessage = async (content: string) => {
    if (!content.trim()) return

    const newUserMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date()
    }

    if (!selectedChat) {
      try {
        const token = getCookie('token')
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/${analysisId}/chats`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            firstMessage: content
          })
        })

        if (!response.ok) throw new Error('Failed to create chat')
        const newChat = await response.json()
        setChats(prev => [...prev, newChat])
        setSelectedChat(newChat)
      } catch (error) {
        console.error('Error creating chat:', error)
        return
      }
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
          question: content,
          messages: messages,
          conversationId: selectedChat?._id
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

  const handleSelectQuestion = (id: string, text: string) => {
    setSelectedQuestion(id)
    setInputValue(text)
  }

  const deleteChat = async (chatId: string) => {
    try {
      const token = getCookie('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/${analysisId}/chats/${chatId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      )

      if (!response.ok) throw new Error('Failed to delete chat')
      
      setChats(prev => prev.filter(chat => chat._id !== chatId))
      if (selectedChat?._id === chatId) {
        setSelectedChat(null)
        setMessages([])
        loadInitialSuggestions()
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
    }
  }

  // Aggiungiamo un useEffect per gestire il cambio di isExpanded
  useEffect(() => {
    if (!isExpanded) {
      setViewMode('list')
      setSelectedChat(null)
      setMessages([])
    }
  }, [isExpanded])

  return (
    <div className="h-full bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100/80 flex justify-between items-center bg-white/50">
        <h2 className="font-semibold text-gray-900">
          {isExpanded ? (viewMode === 'list' ? "AI Assistant" : selectedChat?.title || "Chat") : ""}
        </h2>
        <div className="flex items-center gap-2">
          {isExpanded && selectedChat && (
            <>
              {/* Pulsante elimina nella vista chat */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white rounded-2xl border border-gray-200/50 shadow-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-semibold text-gray-900">
                      Elimina chat
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-600">
                      Sei sicuro di voler eliminare questa chat? L'azione non può essere annullata.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel className="rounded-xl bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                      Annulla
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteChat(selectedChat._id)}
                      className="rounded-xl bg-red-600 text-white hover:bg-red-700"
                    >
                      Elimina
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'chat' : 'list')}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {viewMode === 'chat' ? (
                  <FileText className="h-5 w-5 text-gray-500" />
                ) : (
                  <MessageSquare className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </>
          )}
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
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {viewMode === 'list' ? (
          <div className="p-4 overflow-hidden">
            <div className={`${isExpanded ? 'space-y-3 pr-4' : 'space-y-1'} overflow-hidden`}>
              {/* Pulsante Nuova Chat */}
              <motion.button
                onClick={() => {
                  setSelectedChat(null)
                  setMessages([])
                  setViewMode('chat')
                  loadInitialSuggestions()
                  if (!isExpanded) {
                    onToggleExpand()
                  }
                }}
                className={`
                  w-full ${isExpanded ? 'py-4' : 'py-3'} 
                  rounded-xl text-left transition-all hover:scale-[0.98]
                  bg-gradient-to-br from-blue-50 to-blue-100/50 
                  border border-blue-200 shadow-sm hover:shadow-md
                  overflow-hidden
                `}
              >
                <div className={`
                  ${isExpanded ? 'flex items-center gap-2 px-4' : 'flex justify-center items-center'}
                `}>
                  <Plus className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  {isExpanded && <span className="text-blue-700 truncate">New Chat</span>}
                </div>
              </motion.button>

              {/* Lista delle chat esistenti con pulsante elimina */}
              {chats.map(chat => (
                <div key={chat._id} className="relative group w-full">
                  <motion.button
                    onClick={() => {
                      setSelectedChat(chat)
                      setMessages(chat.messages)
                      setViewMode('chat')
                      if (!isExpanded) {
                        onToggleExpand()
                      }
                    }}
                    className={`
                      w-full ${isExpanded ? 'py-4' : 'py-3'} 
                      rounded-xl text-left transition-all hover:scale-[0.98]
                      bg-gradient-to-br from-white to-gray-50/50 
                      hover:from-gray-50 hover:to-gray-100/50 
                      border border-gray-200 shadow-sm hover:shadow-md
                      overflow-hidden
                    `}
                  >
                    <div className={`
                      ${isExpanded ? 'flex items-center gap-2 px-4' : 'flex justify-center items-center'}
                      overflow-hidden
                    `}>
                      <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      {isExpanded && (
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-start justify-between gap-1 w-full">
                            <h3 className="font-medium text-sm text-gray-900 truncate overflow-hidden text-ellipsis max-w-[70%]">
                              {chat.title || "Chat"}
                            </h3>
                            <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                              {new Date(chat.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 truncate overflow-hidden text-ellipsis w-full">
                            {chat.messages[chat.messages.length - 1]?.content || "No messages"}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.button>

                  {/* Pulsante elimina nella vista lista */}
                  {isExpanded && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 
                            rounded-lg transition-all opacity-0 group-hover:opacity-100
                            hover:bg-red-100 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white rounded-2xl border border-gray-200/50 shadow-lg">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-xl font-semibold text-gray-900">
                            Elimina chat
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-600">
                            Sei sicuro di voler eliminare questa chat? L'azione non può essere annullata.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2">
                          <AlertDialogCancel className="rounded-xl bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                            Annulla
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteChat(chat._id)}
                            className="rounded-xl bg-red-600 text-white hover:bg-red-700"
                          >
                            Elimina
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 p-4">
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
                        {message.role === 'assistant' ? (
                          <div className="text-sm prose prose-sm max-w-none">
                            <ReactMarkdown>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm">{message.content}</p>
                        )}
                        <p className="text-xs mt-1 opacity-70">
                          {formatTimestamp(message.timestamp)}
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
          </div>
        )}
      </ScrollArea>

      {/* Input section */}
      {isExpanded && viewMode === 'chat' && (
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

          {/* Mostra i suggerimenti solo se non ci sono messaggi */}
          {messages.length === 0 && suggestedQuestions.length > 0 && (
            <div className="w-full">
              <SuggestedQuestionsNav 
                questions={suggestedQuestions}
                selectedId={selectedQuestion}
                onSelectQuestion={handleSelectQuestion}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
} 