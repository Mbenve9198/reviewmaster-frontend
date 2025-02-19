"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getCookie } from "@/lib/utils"
import { Loader2, MessageSquare, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { it, enUS, fr, de, es } from "date-fns/locale"

interface Hotel {
  _id: string
  name: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface Conversation {
  _id: string
  phoneNumber: string
  firstInteraction: string
  lastInteraction: string
  conversationHistory: Message[]
  hotelId: string
}

const locales = {
  it,
  en: enUS,
  fr,
  de,
  es
}

export default function WhatsAppConversationsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [selectedHotelId, setSelectedHotelId] = useState<string>("")
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const token = getCookie('token')
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        })
        
        if (!response.ok) throw new Error('Failed to fetch hotels')
        
        const data = await response.json()
        setHotels(data)
        
        const savedHotelId = localStorage.getItem('selectedHotel')
        if (savedHotelId && data.find((h: Hotel) => h._id === savedHotelId)) {
          setSelectedHotelId(savedHotelId)
        } else if (data.length > 0) {
          setSelectedHotelId(data[0]._id)
          localStorage.setItem('selectedHotel', data[0]._id)
        }
      } catch (error) {
        console.error('Error fetching hotels:', error)
      }
    }

    fetchHotels()
  }, [])

  useEffect(() => {
    const fetchConversations = async () => {
      if (!selectedHotelId) return
      
      setIsLoading(true)
      try {
        const token = getCookie('token')
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp-assistant/${selectedHotelId}/conversations`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          }
        )
        
        if (!response.ok) throw new Error('Failed to fetch conversations')
        
        const data = await response.json()
        setConversations(data)
        setSelectedConversation(null)
      } catch (error) {
        console.error('Error fetching conversations:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()
  }, [selectedHotelId])

  const filteredConversations = conversations.filter(conv => 
    conv.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 pl-24 pr-8 space-y-8">
      {/* Modern gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#FAFAFB] via-[#F0F0F2] to-[#FAFAFB] backdrop-blur-sm" />

      {/* Header */}
      <div className="flex flex-col items-start">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue-600 to-blue-400" />
          <h1 className="text-3xl sm:text-4xl font-semibold bg-gradient-to-b from-blue-800 to-blue-600 bg-clip-text text-transparent">
            WhatsApp Conversations
          </h1>
        </div>
        <p className="text-base text-gray-500">
          View and manage your AI assistant conversations
        </p>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-12rem)] gap-4">
        {/* Colonna sinistra */}
        <div className="w-96 flex flex-col bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-100 space-y-4">
            <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
              <SelectTrigger className="h-9 bg-white rounded-xl border-gray-200 hover:border-gray-300 text-sm">
                <SelectValue placeholder="Select hotel" />
              </SelectTrigger>
              <SelectContent>
                {hotels.map(hotel => (
                  <SelectItem key={hotel._id} value={hotel._id} className="text-sm">
                    {hotel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 text-sm pl-9 bg-white rounded-xl border-gray-200 hover:border-gray-300"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {filteredConversations.map(conversation => (
                <button
                  key={conversation._id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`w-full p-3 rounded-xl text-left transition-all hover:scale-[0.98] ${
                    selectedConversation?._id === conversation._id
                      ? 'bg-blue-50 border-blue-100 shadow-sm'
                      : 'hover:bg-gray-50/80 border-transparent'
                  } border`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {conversation.phoneNumber}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(conversation.lastInteraction), 'PPp', {
                          locale: locales[getLanguageFromPhone(conversation.phoneNumber) as keyof typeof locales] || locales.en
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Colonna destra */}
        <div className="flex-1 bg-[#f5f3f2] backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden relative">
          {/* Background pattern */}
          <div className="absolute inset-0" 
               style={{
                 backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/time-TwOS9MlmcnNjFliDrzz3oYOiD1LvVk.png')`,
                 backgroundSize: "cover",
                 backgroundPosition: "center",
                 opacity: "0.3"
               }}>
          </div>

          {/* Contenuto esistente con z-index per stare sopra il pattern */}
          <div className="relative z-10 h-full">
            {selectedConversation ? (
              <div className="h-full flex flex-col">
                <div className="shrink-0 bg-white border-b rounded-t-2xl px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        {selectedConversation.phoneNumber}
                      </h2>
                      <p className="text-sm text-gray-500">
                        First interaction: {format(new Date(selectedConversation.firstInteraction), 'PPp', {
                          locale: locales[getLanguageFromPhone(selectedConversation.phoneNumber) as keyof typeof locales] || locales.en
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="space-y-4 p-4">
                    {selectedConversation.conversationHistory.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-4 shadow-md ${
                            message.role === 'user'
                              ? 'bg-blue-500 text-white rounded-[20px] rounded-tr-[5px] shadow-blue-500/20'
                              : 'bg-white text-gray-900 rounded-[20px] rounded-tl-[5px] shadow-gray-200/80'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <p className={`text-xs mt-2 ${
                            message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {format(new Date(message.timestamp), 'p', {
                              locale: locales[getLanguageFromPhone(selectedConversation.phoneNumber) as keyof typeof locales] || locales.en
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8">
                <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">No Conversation Selected</p>
                <p className="text-sm text-gray-500 text-center max-w-sm">
                  Choose a conversation from the list to view the message history
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Utility function to get language from phone number
function getLanguageFromPhone(phoneNumber: string): string {
  const COUNTRY_CODES: { [key: string]: string } = {
    '39': 'it',
    '44': 'en',
    '33': 'fr',
    '49': 'de',
    '34': 'es',
    '31': 'en',
    '351': 'en',
    '41': 'de',
    '43': 'de',
    '32': 'fr'
  }

  const cleanNumber = phoneNumber.replace('whatsapp:', '').replace('+', '')
  const matchingPrefix = Object.keys(COUNTRY_CODES)
    .sort((a, b) => b.length - a.length)
    .find(prefix => cleanNumber.startsWith(prefix))

  return matchingPrefix ? COUNTRY_CODES[matchingPrefix] : 'en'
} 