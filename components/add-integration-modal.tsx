"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"
import Image from "next/image"
import { getCookie } from "cookies-next"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

const buttonBaseStyles = "transition-all shadow-[0_4px_0_0_#2563eb] active:shadow-[0_0_0_0_#2563eb] active:translate-y-1"
const inputBaseStyles = "border-2 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"

const PLATFORMS: Array<{
  id: Integration['platform'];
  name: string;
  logo: string;
  placeholder: string;
  example: string;
}> = [
  {
    id: 'google',
    name: 'Google Business',
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/google-my-bussines-logo-png_seeklogo-329002-OvZ3IZAlUXbrND3lwaiejZMlWivOUq.png",
    placeholder: "Enter your Google Business URL",
    example: "https://www.google.com/maps/place/your-hotel-name"
  },
  {
    id: 'booking',
    name: 'Booking.com',
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bookingcom-1-84iWRXFhKw2uhSLPIc1eL4eZPSKnUv.svg",
    placeholder: "Enter your Booking.com property URL",
    example: "https://www.booking.com/hotel/it/hotel-name.it.html"
  },
  {
    id: 'tripadvisor',
    name: 'TripAdvisor',
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Tripadvisor_logoset_solid_green-KkpUOomr3cNSTrXGcYHehXnIDlKdbg.svg",
    placeholder: "Enter your TripAdvisor property URL",
    example: "https://www.tripadvisor.com/Hotel_Review-g123-d456-Reviews-Hotel_Name.html"
  }
];

interface Integration {
  _id: string;
  hotelId: string;
  platform: 'google' | 'booking' | 'tripadvisor';
  url: string;
  placeId: string;
  status: 'active' | 'error' | 'disconnected' | 'pending';
  stats: {
    totalReviews: number;
    syncedReviews: number;
    lastSyncedReviewDate: Date | null;
  };
  syncConfig: {
    type: 'manual' | 'automatic';
    frequency: 'daily' | 'weekly' | 'monthly';
    language: string;
    lastSync: Date | null;
    nextScheduledSync: Date | null;
    error?: {
      message: string;
      code: string;
      timestamp: Date;
    };
  };
}

interface SyncConfig {
  type: 'manual' | 'automatic';
  frequency: 'daily' | 'weekly' | 'monthly';
  maxReviews: string;
}

const validateUrl = (url: string, platform: Integration['platform']): boolean => {
  const patterns = {
    google: /^https:\/\/(www\.)?google\.com\/maps\/place\//,
    booking: /^https:\/\/www\.booking\.com\/hotel\/[a-z]{2}\/.*\..*\.html$/,
    tripadvisor: /^https:\/\/(www\.)?tripadvisor\.[a-z]+\/Hotel_Review-.*\.html$/
  }

  return patterns[platform].test(url)
}

const extractPlaceId = (url: string, platform: Integration['platform']): string => {
  try {
    switch (platform) {
      case 'google':
        // Estrai il nome del posto dall'URL in modo più robusto
        const placeNameMatch = url.match(/\/place\/([^@\/]+)/);
        if (placeNameMatch && placeNameMatch[1]) {
          return placeNameMatch[1];
        }
        
        // Fallback: cerca l'ID nella parte finale dell'URL
        const idMatch = url.match(/!1s([^:!]+)/);
        if (idMatch && idMatch[1]) {
          return idMatch[1];
        }
        
        return 'google-place';  // Fallback generico
        
      case 'tripadvisor':
        return url.split('Hotel_Review-')[1]?.split('-')[0] || ''
      case 'booking':
        return url.split('/hotel/')[1]?.split('.')[0] || ''
      default:
        return ''
    }
  } catch {
    return 'place-id-fallback'  // Fallback in caso di errore
  }
}

export function AddIntegrationModal({
  isOpen,
  onClose,
  hotelId,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  hotelId: string;
  onSuccess: (integration: Integration) => Promise<void>;
}) {
  const [selectedPlatform, setSelectedPlatform] = useState<Integration['platform']>('google')
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [syncConfig, setSyncConfig] = useState<SyncConfig>({
    type: 'automatic',
    frequency: 'daily',
    maxReviews: '100'
  })
  const [error, setError] = useState<string | null>(null)

  const handleNext = () => {
    if (!url.trim()) {
      toast.error("Please enter a valid URL")
      return
    }
    setStep(2)
  }

  const handleBack = () => {
    setStep(1)
  }

  const handleSubmit = async () => {
    try {
      setIsLoading(true)
      
      const token = getCookie('token')
      if (!token) {
        throw new Error('Please log in to add an integration')
      }

      // Validazione URL
      if (!validateUrl(url.trim(), selectedPlatform)) {
        throw new Error(`Invalid ${selectedPlatform} URL format. Please check the example and try again.`)
      }

      // Estrai placeId dall'URL
      const placeId = extractPlaceId(url.trim(), selectedPlatform)
      if (!placeId) {
        throw new Error('Could not extract place ID from URL')
      }

      const payload = {
        hotelId,
        platform: selectedPlatform,
        url: url.trim(),
        placeId,
        syncConfig: {
          type: syncConfig.type,
          frequency: syncConfig.frequency,
          maxReviews: syncConfig.maxReviews,
          language: 'en'
        }
      }

      console.log('Sending payload:', JSON.stringify(payload, null, 2))

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/integrations/hotel/${hotelId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      const responseData = await response.json()
      console.log('Server response:', {
        status: response.status,
        data: responseData
      })

      if (!response.ok) {
        throw new Error(responseData.message || `Error setting up integration: ${response.status}`)
      }

      // Avvia la sincronizzazione immediata con il numero di recensioni selezionato
      const syncResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/integrations/${responseData._id}/sync`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            maxReviews: parseInt(syncConfig.maxReviews)
          })
        }
      )

      if (!syncResponse.ok) {
        console.error('Initial sync request failed, but integration was created')
      }

      toast.success("Integration added successfully")
      await onSuccess(responseData)
      onClose()
    } catch (error) {
      console.error('Full error details:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('An unexpected error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:min-w-[700px] md:min-w-[800px] lg:min-w-[900px] max-w-[90vw] max-h-[90vh] overflow-y-auto p-0 bg-white">
        <div className="p-8">
          <Progress 
            value={(step / 2) * 100} 
            className="mb-10 h-2 w-[90%] mx-auto [&>div]:bg-primary"
          />

          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold text-gray-800">Add Integration</DialogTitle>
            <DialogDescription className="text-gray-600 text-lg">
              Connect your hotel reviews from various platforms
            </DialogDescription>
          </DialogHeader>

          {step === 1 ? (
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-6">
                {PLATFORMS.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => setSelectedPlatform(platform.id)}
                    className={`relative p-6 rounded-xl border-2 transition-all w-full ${
                      selectedPlatform === platform.id
                        ? "border-primary bg-primary/5 shadow-lg"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <Image
                        src={platform.logo}
                        alt={platform.name}
                        width={40}
                        height={40}
                        className="rounded"
                      />
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-lg">{platform.name}</h3>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {selectedPlatform && (
                <div className="space-y-4">
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={PLATFORMS.find(p => p.id === selectedPlatform)?.placeholder}
                    className="h-12 rounded-xl border-2 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <p className="text-sm text-gray-500">
                    Example: {PLATFORMS.find(p => p.id === selectedPlatform)?.example}
                  </p>
                  {selectedPlatform === 'google' && (
                    <div className="text-sm text-gray-600 space-y-2 bg-gray-50 p-4 rounded-xl">
                      <p className="font-medium">How to find your Google Maps URL:</p>
                      <ol className="list-decimal pl-4 space-y-1">
                        <li>
                          Go to{" "}
                          <a 
                            href="https://www.google.com/maps" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Google Maps
                          </a>
                        </li>
                        <li>Search for your hotel/property name</li>
                        <li>Click on your property from the search results</li>
                        <li>Copy the URL from your browser&apos;s address bar</li>
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sync Type</label>
                  <Select
                    value={syncConfig.type}
                    onValueChange={(value: SyncConfig['type']) => 
                      setSyncConfig(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger className="h-12 rounded-xl border-2 focus:ring-2 focus:ring-primary/20 focus:border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automatic">Automatic</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sync Frequency</label>
                  <Select
                    value={syncConfig.frequency}
                    onValueChange={(value: SyncConfig['frequency']) => 
                      setSyncConfig(prev => ({ ...prev, frequency: value }))
                    }
                  >
                    <SelectTrigger className="h-12 rounded-xl border-2 focus:ring-2 focus:ring-primary/20 focus:border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Initial Reviews to Sync</label>
                  <Select
                    value={syncConfig.maxReviews}
                    onValueChange={(value) => 
                      setSyncConfig(prev => ({ ...prev, maxReviews: value }))
                    }
                  >
                    <SelectTrigger className="h-12 rounded-xl border-2 focus:ring-2 focus:ring-primary/20 focus:border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">Last 50 reviews</SelectItem>
                      <SelectItem value="100">Last 100 reviews</SelectItem>
                      <SelectItem value="500">Last 500 reviews</SelectItem>
                      <SelectItem value="1000">Last 1000 reviews</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 mt-8">
            {step > 1 && (
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="relative bg-white hover:bg-gray-100 text-primary font-bold py-6 px-8 text-xl border-2 border-primary rounded-2xl shadow-[0_4px_0_0_#1e40af] transition-all active:top-[2px] active:shadow-[0_0_0_0_#1e40af]"
              >
                Back
              </Button>
            )}
            <Button
              onClick={step === 1 ? handleNext : handleSubmit}
              disabled={isLoading}
              className="relative bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 px-8 text-xl rounded-2xl shadow-[0_4px_0_0_#1e40af] transition-all active:top-[2px] active:shadow-[0_0_0_0_#1e40af]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up integration...
                </>
              ) : (
                step === 1 ? "Continue" : "Complete Setup"
              )}
            </Button>
          </div>

          {error && (
            <div className="text-red-500 text-sm mt-4">
              {error}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}