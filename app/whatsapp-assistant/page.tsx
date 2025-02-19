"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, MessageSquare, Zap, Loader2, AlertCircle, Clock, Edit } from 'lucide-react'
import Image from "next/image"
import { SetupAssistantModal } from "@/components/whatsapp-assistant/setup-assistant-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCookie } from "@/lib/utils"
import { toast } from "sonner"
import { EditTimeSettingsModal } from "@/components/whatsapp-assistant/edit-time-settings-modal"

interface Hotel {
  _id: string;
  name: string;
}

interface WhatsAppConfig {
  hotelId: string;
  timezone: string;
  breakfast: {
    startTime: string;
    endTime: string;
  };
  checkIn: {
    startTime: string;
    endTime: string;
  };
  reviewLink: string;
  reviewRequestDelay: number;
  triggerName: string;
  isActive: boolean;
}

export default function WhatsAppAssistantPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [selectedHotelId, setSelectedHotelId] = useState<string>('')
  const [config, setConfig] = useState<WhatsAppConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTimeSettingsModalOpen, setIsTimeSettingsModalOpen] = useState(false)

  // Fetch hotels
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const token = getCookie('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch hotels');
        
        const data = await response.json();
        setHotels(data);
        
        const savedHotelId = localStorage.getItem('selectedHotel');
        if (savedHotelId && data.find((h: Hotel) => h._id === savedHotelId)) {
          setSelectedHotelId(savedHotelId);
        } else if (data.length > 0) {
          setSelectedHotelId(data[0]._id);
          localStorage.setItem('selectedHotel', data[0]._id);
        }
      } catch (error) {
        console.error('Error fetching hotels:', error);
        setError('Failed to load hotels');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotels();
  }, []);

  // Fetch WhatsApp config when hotel is selected
  useEffect(() => {
    const fetchConfig = async () => {
      if (!selectedHotelId) return;
      
      try {
        const token = getCookie('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp-assistant/${selectedHotelId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch WhatsApp configuration');
        
        const data = await response.json();
        setConfig(data);
      } catch (error) {
        console.error('Error fetching WhatsApp config:', error);
        setConfig(null);
      }
    };

    fetchConfig();
  }, [selectedHotelId]);

  const handleHotelChange = (hotelId: string) => {
    setSelectedHotelId(hotelId);
    localStorage.setItem('selectedHotel', hotelId);
  };

  const handleSuccess = async () => {
    // Refresh the configuration after setup
    if (selectedHotelId) {
      const token = getCookie('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp-assistant/${selectedHotelId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        toast.success('WhatsApp assistant configured successfully!');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500 gap-2">
        <AlertCircle className="h-5 w-5" />
        {error}
      </div>
    );
  }

  // Se non c'è configurazione, mostra la pagina iniziale
  if (!config) {
    return (
      <div className="min-h-screen flex flex-col items-center px-6">
        <div className="max-w-3xl w-full pt-16 pb-16">
          <div className="text-center space-y-8 mb-12">
            <h1 className="text-4xl font-bold text-gray-800">
              Your AI WhatsApp Concierge
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Transform your guest communication with an intelligent WhatsApp assistant that handles inquiries 24/7, speaks multiple languages, and delivers personalized responses.
            </p>
            <div className="relative">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Progetto%20senza%20titolo%20(14)-nQVrvC4MOc1FApRbTnUONYa8vcVqPT.png"
                alt="WhatsApp Assistant"
                width={180}
                height={180}
                className="mx-auto animate-pulse-subtle"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: <MessageSquare className="w-8 h-8 text-blue-500" />,
                title: "Smart Communication",
                description: "Automatically detects guest language based on country code and provides instant, contextual responses tailored to your hotel's services"
              },
              {
                icon: <Sparkles className="w-8 h-8 text-purple-500" />,
                title: "Customizable Intelligence",
                description: "Create custom rules to enhance AI responses with specific details about your property, local attractions, and special offerings"
              },
              {
                icon: <Zap className="w-8 h-8 text-yellow-500" />,
                title: "Automated Follow-ups",
                description: "Schedule review requests, manage time zones, and handle operational tasks like sharing menus or booking information"
              }
            ].map((feature, i) => (
              <div 
                key={i}
                className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center space-y-4">
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="relative bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 px-12 text-xl rounded-2xl shadow-[0_4px_0_0_#1e40af] transition-all active:top-[2px] active:shadow-[0_0_0_0_#1e40af] hover:scale-105"
            >
              Create Your AI Assistant
            </Button>
            <p className="text-sm text-gray-500">
              Set up your personalized WhatsApp concierge in minutes
            </p>
          </div>
        </div>

        <SetupAssistantModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      </div>
    );
  }

  // Se c'è configurazione, mostra la nuova UI
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Modern gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#FAFAFB] via-[#F0F0F2] to-[#FAFAFB] backdrop-blur-sm" />

      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue-600 to-blue-400" />
            <h1 className="text-3xl sm:text-4xl font-semibold bg-gradient-to-b from-blue-800 to-blue-600 bg-clip-text text-transparent">
              WhatsApp Assistant
            </h1>
          </div>
          <p className="text-base text-gray-500">
            Manage your AI assistant configuration and settings
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
          {/* Hotel Selector */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1 w-full sm:w-auto max-w-xs">
                <Select value={selectedHotelId} onValueChange={handleHotelChange}>
                  <SelectTrigger className="h-12 rounded-xl bg-white/50 border-gray-200 focus:border-primary focus:ring-primary">
                    <SelectValue placeholder="Select hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels.map(hotel => (
                      <SelectItem key={hotel._id} value={hotel._id}>
                        {hotel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Configuration Sections */}
          <div className="p-6 space-y-8">
            {/* Time Settings */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">Time Settings</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => setIsTimeSettingsModalOpen(true)}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Breakfast Times */}
                <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                  <h4 className="font-medium text-gray-700 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    Breakfast Hours
                  </h4>
                  <p className="text-gray-600">
                    {config.breakfast.startTime} - {config.breakfast.endTime}
                  </p>
                </div>

                {/* Check-in Times */}
                <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                  <h4 className="font-medium text-gray-700 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    Check-in Hours
                  </h4>
                  <p className="text-gray-600">
                    {config.checkIn.startTime} - {config.checkIn.endTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Review Settings */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">Review Settings</h3>
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                  <h4 className="font-medium text-gray-700">Review Link</h4>
                  <p className="text-gray-600 break-all">{config.reviewLink}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                  <h4 className="font-medium text-gray-700">Request Delay</h4>
                  <p className="text-gray-600">
                    {config.reviewRequestDelay} {config.reviewRequestDelay === 1 ? 'day' : 'days'} after first interaction
                  </p>
                </div>
              </div>
            </div>

            {/* Assistant Identity */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">Assistant Identity</h3>
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                <h4 className="font-medium text-gray-700">Trigger Name</h4>
                <p className="text-gray-600">{config.triggerName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditTimeSettingsModal
        isOpen={isTimeSettingsModalOpen}
        onClose={() => setIsTimeSettingsModalOpen(false)}
        currentConfig={config}
        onSuccess={(updatedConfig) => {
          setConfig(updatedConfig)
          setIsTimeSettingsModalOpen(false)
        }}
      />
    </div>
  );
}

// Aggiungi questi stili globali nel tuo CSS
const styles = `
  @keyframes pulse-subtle {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.9;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
  
  .animate-pulse-subtle {
    animation: pulse-subtle 2s ease-in-out infinite;
  }
`;

// Aggiungi lo style al documento
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style")
  styleSheet.innerText = styles
  document.head.appendChild(styleSheet)
} 