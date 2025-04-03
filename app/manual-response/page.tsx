"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PlusCircle, Send, Settings, Copy, CornerDownLeft, X } from 'lucide-react'
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from 'next/navigation'
import { AddPropertyModal } from "@/components/add-property-modal"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { ResponseModal } from "@/components/response-modal"
import { getCookie } from "@/lib/utils"
import { toast } from "react-hot-toast"
import { ChatMessageList } from "@/components/ui/chat-message-list"
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from "@/components/ui/chat-bubble"
import { HandWrittenTitle } from "@/components/ui/hand-writing-text"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { handleApiResponse } from "@/lib/api-utils"

interface Hotel {
  _id: string
  name: string
  type: string
  description: string
}

type ResponseStyle = 'professional' | 'friendly'
type ResponseLength = 'short' | 'medium' | 'long'
type MessageSender = "user" | "ai"

interface ChatMessage {
  id: number
  content: string
  sender: MessageSender
}

export default function HomePage() {
  const [selectedHotel, setSelectedHotel] = useState("")
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [review, setReview] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false)
  const [newHotelName, setNewHotelName] = useState("")
  const [newHotelType, setNewHotelType] = useState("")
  const [description, setDescription] = useState("")
  const [managerSignature, setManagerSignature] = useState("")
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false)
  const [responseStyle, setResponseStyle] = useState<ResponseStyle>('professional')
  const [responseLength, setResponseLength] = useState<ResponseLength>('medium')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [showBanner, setShowBanner] = useState(true)

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const token = getCookie('token')
      
      if (!token) {
        console.log('No token found, redirecting to login...')
        router.push('/login')
        return
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels`, {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        await handleApiResponse(response)
        
        const data = await response.json()
        console.log('Hotels fetched:', data)
        setHotels(data)

        // Recupera l'hotel selezionato dal localStorage
        const lastSelectedHotel = localStorage.getItem('lastSelectedHotel')
        
        if (lastSelectedHotel && data.some((hotel: Hotel) => hotel._id === lastSelectedHotel)) {
          setSelectedHotel(lastSelectedHotel)
        } else if (data.length > 0) {
          setSelectedHotel(data[0]._id)
          localStorage.setItem('lastSelectedHotel', data[0]._id)
        }
        
        // Imposta isLoading a false dopo aver caricato i dati
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching hotels:', error)
        setIsLoading(false)
      }
    }

    checkAuthAndFetchData()
  }, [router])

  // Mostra un loader mentre verifichiamo l'autenticazione
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Aggiorna il localStorage quando l'utente cambia hotel
  const handleHotelChange = (hotelId: string) => {
    setSelectedHotel(hotelId);
    localStorage.setItem('lastSelectedHotel', hotelId);
  };

  const handleGenerateResponse = async () => {
    if (!selectedHotel || !review.trim()) return;
    
    setIsModalOpen(true)
    setMessages([])
    setIsGenerating(true)
    setError(null)
    
    try {
      const token = getCookie('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const payload = {
        hotelId: selectedHotel,
        review: {
          text: review,
          reviewerName: "Guest" // Puoi aggiungere un campo per il nome del recensore se necessario
        },
        responseSettings: {
          style: responseStyle,
          length: responseLength
        },
        isNewManualReview: true, // Imposta questo flag a true per creare una nuova recensione manuale
        generateSuggestions: true
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      setMessages([{ id: 1, content: data.content, sender: "ai" }]);

    } catch (error: any) {
      setError(error?.message || "An error occurred");
      toast.error(error?.message || "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChatSubmit = async (input: string) => {
    if (!input.trim() || !selectedHotel) return;
    
    setIsGenerating(true);
    setInput(''); // Clear input after sending
    
    try {
      const newUserMessage: ChatMessage = { 
        id: messages.length + 1, 
        content: input, 
        sender: "user"
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      
      const token = getCookie('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hotelId: selectedHotel,
          review: {
            text: review
          },
          responseSettings: {
            style: responseStyle,
            length: responseLength
          },
          previousMessages: [...messages, newUserMessage],
          isNewManualReview: false // Imposta esplicitamente a false per le chat successive
        }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      const aiMessage: ChatMessage = { 
        id: messages.length + 2, 
        content: data.content, 
        sender: "ai"
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast.error("Error generating response");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSettingsClick = () => {
    if (selectedHotel) {
      localStorage.setItem('selectedHotel', selectedHotel)
      router.push('/hotel-settings')
    }
  }

  const handleHotelAdded = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${getCookie('token')}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) throw new Error('Failed to fetch hotels')
      
      const data = await response.json()
      setHotels(data)
    } catch (error) {
      console.error('Error fetching hotels:', error)
      toast.error('Failed to refresh hotels list')
    }
  }

  const buttonClasses = "relative bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all active:top-[2px] active:shadow-[0_0_0_0_#2563eb] disabled:opacity-50 disabled:hover:bg-primary disabled:active:top-0 disabled:active:shadow-[0_4px_0_0_#2563eb]"

  return (
    <>
      {showBanner && (
        <div className="fixed top-0 left-0 right-0 z-20">
          <div className="bg-gradient-to-r from-blue-600/85 via-blue-500/85 via-blue-400/85 to-blue-500/85 backdrop-blur-sm text-white shadow-lg">
            <div className="relative max-w-7xl mx-auto md:pl-[100px]">
              <div className="px-4 py-3 text-center pr-12">
                <p className="text-sm">
                  Want to auto-respond to reviews directly on TripAdvisor and Booking.com? 
                  <a 
                    href="https://chromewebstore.google.com/detail/replai/dgdhioopdabddaifmlbjpabdlegpkepn?authuser=0&hl=it"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline ml-1 hover:text-blue-100"
                  >
                    Get our Chrome extension here
                  </a>
                </p>
              </div>
              <button 
                onClick={() => setShowBanner(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#FAFAFB] via-[#F0F0F2] to-[#FAFAFB] backdrop-blur-sm" />
      
      <div className="min-h-screen flex flex-col items-center px-6">
        <div className="w-full max-w-3xl pt-12">
          <HandWrittenTitle 
            title="Manual Reply"
            subtitle="Create personalized replies with AI"
          />

          <div className="flex items-center justify-center gap-4 mb-8">
            <Select value={selectedHotel} onValueChange={handleHotelChange}>
              <SelectTrigger className="w-[200px] rounded-xl">
                <SelectValue placeholder="Select a hotel" />
              </SelectTrigger>
              <SelectContent>
                {hotels.map((hotel) => (
                  <SelectItem key={hotel._id} value={hotel._id}>
                    {hotel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleSettingsClick}
              disabled={!selectedHotel}
              className="rounded-xl bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all"
              aria-label="Hotel Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setIsAddPropertyModalOpen(true)}
              className="relative bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-xl shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Add Hotel
            </Button>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Paste your review here..."
                className="min-h-[200px] rounded-xl bg-white border-gray-200 focus:border-primary focus:ring-primary resize-none shadow-[0_4px_16px_-3px_rgb(0,0,0,0.15)]"
              />
              
              <div className="absolute bottom-3 left-3 flex items-center gap-2 text-sm text-gray-500">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="hover:text-gray-900 transition-colors">
                      {responseLength} length
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-32 p-1 bg-white border border-gray-200 shadow-md">
                    <div className="flex flex-col gap-1">
                      {['short', 'medium', 'long'].map((length) => (
                        <button
                          key={length}
                          onClick={() => setResponseLength(length as ResponseLength)}
                          className={`px-2 py-1 text-sm rounded-lg transition-colors ${
                            responseLength === length
                              ? 'bg-primary text-white'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {length}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <span>•</span>

                <Popover>
                  <PopoverTrigger asChild>
                    <button className="hover:text-gray-900 transition-colors">
                      {responseStyle} tone
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-32 p-1 bg-white border border-gray-200 shadow-md">
                    <div className="flex flex-col gap-1">
                      {['professional', 'friendly'].map((style) => (
                        <button
                          key={style}
                          onClick={() => setResponseStyle(style as ResponseStyle)}
                          className={`px-2 py-1 text-sm rounded-lg transition-colors ${
                            responseStyle === style
                              ? 'bg-primary text-white'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Button
              onClick={handleGenerateResponse}
              disabled={!selectedHotel || !review.trim() || isGenerating}
              className="w-full rounded-xl bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Send className="w-4 h-4" />
                  </motion.div>
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Generate AI Response
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <ResponseModal
        isOpen={isResponseModalOpen}
        onClose={() => setIsResponseModalOpen(false)}
        response={error || aiResponse}
        isError={!!error}
      />

      <AddPropertyModal
        isOpen={isAddPropertyModalOpen}
        onClose={() => setIsAddPropertyModalOpen(false)}
        onSuccess={handleHotelAdded}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] p-0 bg-white rounded-2xl border shadow-lg">
          <div className="h-full max-h-[90vh] flex flex-col">
            <DialogHeader className="px-6 py-4 border-b bg-gray-50/80 rounded-t-2xl">
              <DialogTitle className="text-lg font-semibold">Generated Response</DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto bg-white px-6" ref={chatContainerRef}>
              <div className="py-6">
                <ChatMessageList>
                  {messages.map((message) => (
                    <ChatBubble 
                      key={message.id} 
                      variant={message.sender === "user" ? "sent" : "received"}
                      className="rounded-2xl shadow-sm"
                    >
                      <ChatBubbleAvatar
                        className="h-8 w-8 shrink-0 rounded-full border-2 border-white shadow-sm"
                        src={message.sender === "user" ? "https://github.com/shadcn.png" : "https://github.com/vercel.png"}
                        fallback={message.sender === "user" ? "US" : "AI"}
                      />
                      <div className="flex flex-col">
                        <ChatBubbleMessage 
                          variant={message.sender === "user" ? "sent" : "received"}
                          className="rounded-2xl relative pr-10"
                        >
                          {message.content}
                          {message.sender === "ai" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                navigator.clipboard.writeText(message.content)
                                toast.success("Response copied to clipboard")
                              }}
                              className="absolute bottom-1 right-1 h-7 w-7 rounded-full bg-primary/10 hover:bg-primary/20 text-primary shadow-sm"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              <span className="sr-only">Copy response</span>
                            </Button>
                          )}
                        </ChatBubbleMessage>
                      </div>
                    </ChatBubble>
                  ))}

                  {isGenerating && (
                    <ChatBubble variant="received" className="rounded-2xl shadow-sm">
                      <ChatBubbleAvatar 
                        className="h-8 w-8 shrink-0 rounded-full border-2 border-white shadow-sm" 
                        src="https://github.com/vercel.png" 
                        fallback="AI" 
                      />
                      <ChatBubbleMessage isLoading className="rounded-2xl" />
                    </ChatBubble>
                  )}
                </ChatMessageList>
              </div>
            </div>

            <div className="border-t px-6 py-4 bg-gray-50">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleChatSubmit(input);
                }}
                className="relative flex items-center gap-4"
              >
                <div className="relative flex-1">
                  <textarea
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = 'inherit';
                      const height = e.target.scrollHeight;
                      e.target.style.height = `${height}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleChatSubmit(input);
                      }
                    }}
                    placeholder="Type your message..."
                    className="w-full min-h-[48px] max-h-[200px] resize-none rounded-xl bg-white border-gray-200 p-3 pr-14 shadow-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                    style={{ overflow: 'hidden' }}
                  />
                  <Button 
                    type="submit" 
                    size="sm" 
                    className="absolute right-2 top-[50%] -translate-y-1/2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_0_0_#1e40af] hover:shadow-[0_2px_0_0_#1e40af] hover:translate-y-[calc(-50%+2px)] transition-all"
                  >
                    <CornerDownLeft className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  onClick={() => {
                    if (messages.length > 0) {
                      const lastAiMessage = [...messages].reverse().find(m => m.sender === "ai");
                      if (lastAiMessage) {
                        setAiResponse(lastAiMessage.content);
                        setIsModalOpen(false);
                      }
                    }
                  }}
                  disabled={isGenerating || !messages.length}
                  className="relative bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-xl shadow-[0_4px_0_0_#1e40af] hover:shadow-[0_2px_0_0_#1e40af] hover:translate-y-[2px] transition-all"
                >
                  Save Response
                </Button>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
