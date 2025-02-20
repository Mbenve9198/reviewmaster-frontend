"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { IntegrationCard } from "@/components/integration-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Settings, X } from 'lucide-react'
import { AddIntegrationModal } from "@/components/add-integration-modal"
import { getCookie } from "@/lib/utils"
import { toast } from "react-hot-toast"
import { AddPropertyModal } from "@/components/add-property-modal"

interface Hotel {
  id: string
  name: string
  integrations: Integration[]
}

interface Integration {
  _id: string
  platform: 'google' | 'booking' | 'tripadvisor'
  placeId: string
  url: string
  status: 'active' | 'error' | 'disconnected' | 'pending'
  logo?: string
  stats: {
    totalReviews: number
    syncedReviews: number
    lastSyncedReviewDate: Date | null
  }
  syncConfig: {
    type: 'manual' | 'automatic'
    frequency: 'daily' | 'weekly' | 'monthly'
    language: string
    lastSync: Date | null
    nextScheduledSync: Date | null
    error?: {
      message: string
      code: string
      timestamp: Date
    }
  }
}

const platformLogos = {
  google: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/google-my-bussines-logo-png_seeklogo-329002-OvZ3IZAlUXbrND3lwaiejZMlWivOUq.png",
  booking: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bookingcom-1-84iWRXFhKw2uhSLPIc1eL4eZPSKnUv.svg",
  tripadvisor: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Tripadvisor_logoset_solid_green-KkpUOomr3cNSTrXGcYHehXnIDlKdbg.svg"
}

export default function IntegrationsPage() {
  const router = useRouter()
  const [selectedHotel, setSelectedHotel] = useState<string>("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBanner, setShowBanner] = useState(true)
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false)

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
        
        const hotelsData = await response.json()
        
        const hotelsWithIntegrations = await Promise.all(
          hotelsData.map(async (hotel: any) => {
            const integrationsResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/integrations/hotel/${hotel._id}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                }
              }
            )
            
            if (!integrationsResponse.ok) throw new Error('Failed to fetch integrations')
            
            const integrations = await integrationsResponse.json()
            return {
              ...hotel,
              id: hotel._id,
              integrations
            }
          })
        )
        
        setHotels(hotelsWithIntegrations)
        
        const lastSelected = localStorage.getItem('lastSelectedHotel')
        if (lastSelected && hotelsWithIntegrations.some(h => h.id === lastSelected)) {
          setSelectedHotel(lastSelected)
        } else if (hotelsWithIntegrations.length > 0) {
          setSelectedHotel(hotelsWithIntegrations[0].id)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchHotels()
  }, [])

  const handleAddIntegration = () => {
    setIsAddModalOpen(true)
  }

  const handleSettingsClick = () => {
    if (selectedHotel) {
      localStorage.setItem('selectedHotel', selectedHotel)
      router.push('/hotel-settings')
    }
  }

  const handleIntegrationAdded = async (integration: Integration) => {
    if (selectedHotel) {
      const token = getCookie('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/integrations/hotel/${selectedHotel}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      )
      
      if (response.ok) {
        const integrations = await response.json()
        setHotels(prev => prev.map(hotel => 
          hotel.id === selectedHotel 
            ? { ...hotel, integrations } 
            : hotel
        ))
      }
    }
  }

  const handleDeleteIntegration = async (integrationId: string) => {
    try {
      const token = getCookie('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/integrations/${integrationId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      )

      if (!response.ok && response.status !== 404) {
        throw new Error('Failed to delete integration')
      }

      setHotels(prev => prev.map(hotel => 
        hotel.id === selectedHotel 
          ? { 
              ...hotel, 
              integrations: hotel.integrations.filter(i => i._id !== integrationId)
            }
          : hotel
      ))

      toast.success('Integration deleted successfully')
    } catch (error) {
      console.error('Delete integration error:', error)
      toast.error('Failed to delete integration')
    }
  }

  const handleHotelAdded = async () => {
    try {
      const token = getCookie('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch hotels')
      
      const hotelsData = await response.json()
      setHotels(hotelsData)
    } catch (error) {
      console.error('Error fetching hotels:', error)
      toast.error('Failed to refresh hotels list')
    }
  }

  const selectedHotelData = hotels.find(h => h.id === selectedHotel)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

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

      {/* Modern gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#FAFAFB] via-[#F0F0F2] to-[#FAFAFB] backdrop-blur-sm" />
      
      <div className="flex flex-col px-10 md:pl-[96px] py-12 min-h-screen">
        <div className="max-w-[1400px] mx-auto w-full space-y-12">
          {/* Modern left-aligned header */}
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue-600 to-blue-400" />
              <h1 className="text-3xl sm:text-4xl font-semibold bg-gradient-to-b from-blue-800 to-blue-600 bg-clip-text text-transparent">
                Integrations
              </h1>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <p className="text-base">
                Connect and manage your review platforms in one place
              </p>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                {hotels.length} Properties
              </span>
            </div>
          </div>

          {/* Modern card container */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
            {/* Controls section */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <Select value={selectedHotel || undefined} onValueChange={setSelectedHotel}>
                  <SelectTrigger className="w-[250px] rounded-xl border-gray-200 focus:border-primary focus:ring-primary bg-white/50">
                    <SelectValue placeholder="Select hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels.map((hotel) => (
                      <SelectItem 
                        key={hotel.id} 
                        value={hotel.id}
                        className="text-lg py-2 px-4"
                      >
                        {hotel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => setIsAddPropertyModalOpen(true)}
                  className="rounded-xl bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Hotel
                </Button>

                <Button
                  onClick={handleSettingsClick}
                  disabled={!selectedHotel}
                  className="rounded-xl bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all"
                  aria-label="Hotel Settings"
                >
                  <Settings className="w-4 h-4" />
                </Button>

                <Button
                  onClick={handleAddIntegration}
                  disabled={!selectedHotel}
                  className="rounded-xl bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Integration
                </Button>
              </div>
            </div>

            {/* Integrations grid */}
            <div className="p-6">
              {selectedHotelData ? (
                <div className="grid md:grid-cols-3 gap-8">
                  {selectedHotelData.integrations.map((integration) => (
                    <IntegrationCard 
                      key={integration._id} 
                      integration={{
                        ...integration,
                        logo: platformLogos[integration.platform]
                      }}
                      onSync={() => handleIntegrationAdded(integration)}
                      onDelete={() => handleDeleteIntegration(integration._id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Please select a hotel to manage its integrations
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AddIntegrationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        hotelId={selectedHotel || ''}
        onSuccess={handleIntegrationAdded}
      />

      <AddPropertyModal
        isOpen={isAddPropertyModalOpen}
        onClose={() => setIsAddPropertyModalOpen(false)}
        onSuccess={handleHotelAdded}
      />
    </>
  )
}