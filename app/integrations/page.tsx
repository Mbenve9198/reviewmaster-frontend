"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { IntegrationCard } from "@/components/integration-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Settings } from 'lucide-react'
import { AddIntegrationModal } from "@/components/add-integration-modal"
import { getCookie } from "@/lib/utils"

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
  const [selectedHotel, setSelectedHotel] = useState<string | null>(null)
  const [isAddIntegrationModalOpen, setIsAddIntegrationModalOpen] = useState(false)
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    setIsAddIntegrationModalOpen(true)
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

  const selectedHotelData = hotels.find(hotel => hotel.id === selectedHotel)

  const totalReviewsSynced = selectedHotelData
    ? selectedHotelData.integrations.reduce((sum, integration) => sum + integration.stats.syncedReviews, 0)
    : 0

  const totalReviewsAvailable = selectedHotelData
    ? selectedHotelData.integrations.reduce((sum, integration) => sum + integration.stats.totalReviews, 0)
    : 0

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Manage Your Integrations</h1>
          <p className="text-xl text-gray-600 mb-8">
            Connect and sync your reviews from multiple platforms for each of your hotels
          </p>
          
          {/* Hotel Selection and Controls */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <Select value={selectedHotel || undefined} onValueChange={setSelectedHotel}>
              <SelectTrigger className="w-[250px] text-lg border-2 border-gray-200 rounded-xl">
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
              onClick={handleSettingsClick}
              disabled={!selectedHotel}
              className="text-xl p-4 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
              aria-label="Hotel Settings"
            >
              <Settings className="w-6 h-6" />
            </Button>

            <Button
              onClick={handleAddIntegration}
              disabled={!selectedHotel}
              className="text-xl py-6 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
            >
              <PlusCircle className="w-6 h-6" />
              Add Integration
            </Button>
          </div>

          {selectedHotelData && (
            <div className="flex justify-center space-x-8">
              <div>
                <p className="text-sm text-gray-500">Total Reviews Synced</p>
                <p className="text-2xl font-bold text-primary">
                  {totalReviewsSynced}/{totalReviewsAvailable}
                </p>
                <Progress 
                  value={totalReviewsAvailable > 0 ? (totalReviewsSynced / totalReviewsAvailable) * 100 : 0} 
                  className="w-40 mt-2" 
                />
              </div>
            </div>
          )}
        </div>

        {selectedHotelData ? (
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {selectedHotelData.integrations.map((integration) => (
              <IntegrationCard 
                key={integration._id} 
                integration={{
                  ...integration,
                  logo: platformLogos[integration.platform]
                }}
                onSync={async () => {
                  const token = getCookie('token')
                  await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/integrations/${integration._id}/sync`,
                    {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                      }
                    }
                  )
                  handleIntegrationAdded(integration)
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500">
            Please select a hotel to manage its integrations
          </div>
        )}
      </div>

      <AddIntegrationModal 
        isOpen={isAddIntegrationModalOpen} 
        onClose={() => setIsAddIntegrationModalOpen(false)}
        hotelId={selectedHotel || ''}
        onIntegrationAdded={handleIntegrationAdded}
      />
    </div>
  )
} 