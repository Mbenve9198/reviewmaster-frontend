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
import { toast } from "react-hot-toast"
import { Tiles } from "@/components/ui/tiles"
import { HandWrittenTitle } from "@/components/ui/hand-writing-text"

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

      // Aggiorna la lista delle integrazioni
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

  const selectedHotelData = hotels.find(h => h.id === selectedHotel)

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
    <>
      <Tiles 
        className="fixed inset-0 -z-10" 
        rows={100}
        cols={20}
        tileSize="md"
      />
      
      <div className="min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <HandWrittenTitle 
            title="Integrations"
            subtitle="Connect and sync your reviews"
          />
          
          {/* Hotel Selection and Controls */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <Select value={selectedHotel || undefined} onValueChange={setSelectedHotel}>
              <SelectTrigger className="w-[250px] rounded-xl">
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

          {selectedHotelData && (
            <div className="flex justify-center mb-12">
              <div className="bg-white rounded-xl shadow-[0_4px_16px_-3px_rgb(0,0,0,0.15)] px-8 py-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">Total Reviews Synced</p>
                  <div className="flex items-center gap-1 justify-center">
                    <p className="text-3xl font-bold text-primary">
                      {totalReviewsSynced}
                    </p>
                    <span className="text-sm text-gray-400 mt-2">/ {totalReviewsAvailable}</span>
                  </div>
                </div>
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
                onDelete={() => handleDeleteIntegration(integration._id)}
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
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        hotelId={selectedHotel || ''}
        onSuccess={handleIntegrationAdded}
      />
    </>
  )
} 