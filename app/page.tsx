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
import { PlusCircle, Send, Settings, Copy, CornerDownLeft } from 'lucide-react'
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from 'next/navigation'
import { AddHotelModal } from "@/components/add-hotel-modal"
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
import { Tiles } from "@/components/ui/tiles"
import { HandWrittenTitle } from "@/components/ui/hand-writing-text"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

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
  const [isAddHotelModalOpen, setIsAddHotelModalOpen] = useState(false)
  const [newHotelName, setNewHotelName] = useState("")
  const [newHotelType, setNewHotelType] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [step, setStep] = useState(1)
  const totalSteps = 3
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

        if (!response.ok) {
          if (response.status === 401) {
            console.log('Token invalid, redirecting to login...')
            router.push('/login')
            return
          }
          throw new Error('Failed to fetch hotels')
        }

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
      } catch (error) {
        console.error('Error fetching hotels:', error)
        if (error instanceof Error && error.message.includes('401')) {
          router.push('/login')
        }
      } finally {
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
        review: review,
        responseSettings: {
          style: responseStyle,
          length: responseLength
        }
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
      
      setMessages([{ id: 1, content: data.response, sender: "ai" }]);

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
          review: review,
          responseSettings: {
            style: responseStyle,
            length: responseLength
          },
          previousMessages: [...messages, newUserMessage]
        }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      const aiMessage: ChatMessage = { 
        id: messages.length + 2, 
        content: data.response, 
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

  const handleAddHotel = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getCookie('token')}`
        },
        body: JSON.stringify({
          name: newHotelName,
          type: newHotelType,
          description: description,
          managerSignature: managerSignature,
          responseSettings: {
            style: 'professional',
            length: 'medium'
          }
        }),
        credentials: 'include'
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (!response.ok) {
        throw new Error(data.message);
      }

      setDialogOpen(false);
      const updatedResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels`, {
        headers: {
          'Authorization': `Bearer ${getCookie('token')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      const updatedHotels = await updatedResponse.json();
      setHotels(updatedHotels);

    } catch (error) {
      console.error('Full error details:', error);
      setError(error instanceof Error ? error.message : 'Error adding hotel');
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return newHotelName && newHotelType
      case 2:
        return description.length > 0
      case 3:
        return managerSignature.length > 0
      default:
        return false
    }
  }

  const handleHotelAdded = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels`, {
      headers: {
        'Authorization': `Bearer ${getCookie('token')}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    const updatedHotels = await response.json();
    setHotels(updatedHotels);
  }

  const buttonClasses = "relative bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all active:top-[2px] active:shadow-[0_0_0_0_#2563eb] disabled:opacity-50 disabled:hover:bg-primary disabled:active:top-0 disabled:active:shadow-[0_4px_0_0_#2563eb]"

  return (
    <>
      <Tiles 
        className="fixed inset-0 -z-10" 
        rows={100}
        cols={20}
        tileSize="md"
      />
      
      <div className="relative">
        <HandWrittenTitle 
          title="Manual Responses"
          subtitle="Create personalized responses to your guest reviews with AI assistance"
        />
        
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-center gap-4 mb-12">
            <Select value={selectedHotel} onValueChange={handleHotelChange}>
              <SelectTrigger className="w-full rounded-xl">
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
              onClick={() => setIsAddHotelModalOpen(true)}
              className="rounded-xl bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Add Hotel
            </Button>
          </div>

          <div className="flex flex-col gap-4 w-full max-w-3xl">
            <div className="space-y-4">
              <div className="relative">
                <Textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Paste your review here..."
                  className="min-h-[200px] rounded-xl bg-white border-gray-200 focus:border-primary focus:ring-primary resize-none"
                />
                
                <div className="absolute bottom-3 left-3 flex items-center gap-2 text-sm text-gray-500">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="hover:text-gray-900 transition-colors">
                        {responseLength} length
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-32 p-1">
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
                    <PopoverContent className="w-32 p-1">
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

          <ResponseModal
            isOpen={isResponseModalOpen}
            onClose={() => setIsResponseModalOpen(false)}
            response={error || aiResponse}
            isError={!!error}
          />
        </div>
        
        <AddHotelModal
          isOpen={isAddHotelModalOpen}
          onClose={() => setIsAddHotelModalOpen(false)}
          onHotelAdded={handleHotelAdded}
        />

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-white max-w-4xl h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-4xl font-bold text-center">Add New Hotel</DialogTitle>
              <DialogDescription className="text-xl text-center">
                Let's set up your new property
              </DialogDescription>
            </DialogHeader>

            <div className="mt-8">
              <div className="max-w-3xl mx-auto">
                <Progress value={(step / totalSteps) * 100} className="h-3 mb-8" />

                {step === 1 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xl font-bold">Property Name</label>
                      <Input
                        value={newHotelName}
                        onChange={(e) => setNewHotelName(e.target.value)}
                        className="p-6 text-xl rounded-2xl border-2 border-gray-200 focus:border-[#58CC02] focus:ring-[#58CC02]"
                        placeholder="Enter your property name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xl font-bold">Property Type</label>
                      <Select value={newHotelType} onValueChange={setNewHotelType}>
                        <SelectTrigger className="p-6 text-xl rounded-2xl border-2">
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hotel">Hotel</SelectItem>
                          <SelectItem value="b&b">B&B</SelectItem>
                          <SelectItem value="resort">Resort</SelectItem>
                          <SelectItem value="apartment">Apartment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xl font-bold">Property Description</label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="p-6 text-xl rounded-2xl border-2 min-h-[200px]"
                        placeholder="Describe your property..."
                      />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xl font-bold">Manager Signature</label>
                      <Input
                        value={managerSignature}
                        onChange={(e) => setManagerSignature(e.target.value)}
                        className="p-6 text-xl rounded-2xl border-2"
                        placeholder="Your name and title"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end mt-8 gap-4">
                  {step > 1 && (
                    <Button onClick={() => setStep(step - 1)} variant="outline" className="text-xl py-6 px-8">
                      Back
                    </Button>
                  )}
                  <Button
                    onClick={step === totalSteps ? handleAddHotel : () => setStep(step + 1)}
                    className="text-xl py-6 px-8"
                    disabled={!isStepValid()}
                  >
                    {step === totalSteps ? "Complete" : "Continue"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
      </div>
    </>
  )
}
