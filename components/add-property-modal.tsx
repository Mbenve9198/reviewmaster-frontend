"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Image from "next/image"
import { getCookie } from '@/lib/utils'
import { toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"

const PLATFORMS = [
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

interface HotelPayload {
  name: string
  type: string
  description: string
  managerSignature: string
  responseSettings: {
    style: 'professional' | 'friendly'
    length: 'short' | 'medium' | 'long'
  }
}

interface IntegrationPayload {
  hotelId: string
  platform: string
  url: string
  placeId: string
  syncConfig: {
    type: 'manual' | 'automatic'
    frequency: 'daily' | 'weekly' | 'monthly'
    maxReviews: string
    language: string
  }
}

interface SyncConfig {
  type: 'manual' | 'automatic'
  frequency: 'daily' | 'weekly' | 'monthly'
  maxReviews: string
}

interface ResponseSettings {
  style: 'professional' | 'friendly'
  length: 'short' | 'medium' | 'long'
}

interface AddPropertyModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => Promise<void>
}

export function AddPropertyModal({ isOpen, onClose, onSuccess }: AddPropertyModalProps) {
  const [step, setStep] = useState(1)
  const totalSteps = 6
  const [hotelData, setHotelData] = useState({
    name: "",
    type: "",
    description: "",
    managerSignature: ""
  })
  const [responseSettings, setResponseSettings] = useState<ResponseSettings>({
    style: 'professional',
    length: 'medium'
  })
  const [selectedPlatform, setSelectedPlatform] = useState<string>('google')
  const [platformUrl, setPlatformUrl] = useState("")
  const [syncConfig, setSyncConfig] = useState<SyncConfig>({
    type: 'automatic',
    frequency: 'daily',
    maxReviews: '100'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleContinue = async () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      try {
        setIsLoading(true)
        setError(null)
        const token = getCookie('token')

        // First create the hotel
        const hotelPayload: HotelPayload = {
          name: hotelData.name,
          type: hotelData.type.toLowerCase(),
          description: hotelData.description,
          managerSignature: hotelData.managerSignature,
          responseSettings: {
            style: responseSettings.style,
            length: responseSettings.length
          }
        }

        const hotelResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(hotelPayload)
        })

        const createdHotel = await hotelResponse.json()
        
        if (!hotelResponse.ok) {
          throw new Error(createdHotel.message || 'Error creating hotel')
        }

        // Then create the integration
        const integrationPayload = {
          hotelId: createdHotel._id,
          platform: selectedPlatform,
          url: platformUrl.trim(),
          placeId: 'placeholder',
          syncConfig: {
            type: syncConfig.type,
            frequency: syncConfig.frequency,
            maxReviews: syncConfig.maxReviews,
            language: 'en'
          }
        }

        const integrationResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/integrations/hotel/${createdHotel._id}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(integrationPayload)
          }
        )

        if (!integrationResponse.ok) {
          const error = await integrationResponse.json()
          throw new Error(error.message || 'Error creating integration')
        }

        onSuccess()
        onClose()
        toast.success('Property and integration setup completed successfully')
      } catch (error) {
        console.error('Setup error:', error)
        setError(error instanceof Error ? error.message : 'An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:min-w-[700px] md:min-w-[800px] lg:min-w-[900px] max-w-[90vw] max-h-[90vh] overflow-y-auto p-0 bg-white">
        <div className="p-8">
          <Progress 
            value={(step / totalSteps) * 100} 
            className="mb-10 h-2 w-[90%] mx-auto [&>div]:bg-primary"
          />
          
          <div className="space-y-8">
            {/* Step 1-3: Hotel Details */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xl font-bold text-gray-800">Property Name</label>
                  <Input
                    value={hotelData.name}
                    onChange={(e) => setHotelData({ ...hotelData, name: e.target.value })}
                    className="p-6 text-xl rounded-2xl border-2 border-gray-200 focus:border-[#58CC02] focus:ring-[#58CC02]"
                    placeholder="Enter your property name"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-sm font-medium">Property Type</label>
                  <Select
                    value={hotelData.type}
                    onValueChange={(value) => 
                      setHotelData(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger className="border-2 border-gray-200 focus:ring-primary focus:ring-offset-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hotel">Hotel</SelectItem>
                      <SelectItem value="resort">Resort</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="bb">B&B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xl font-bold text-gray-800">Description</label>
                  <Textarea
                    value={hotelData.description}
                    onChange={(e) => setHotelData({ ...hotelData, description: e.target.value })}
                    className="p-6 text-xl rounded-2xl border-2 border-gray-200 focus:border-[#58CC02] focus:ring-[#58CC02] min-h-[200px]"
                    placeholder="Describe your property..."
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xl font-bold text-gray-800">Manager Signature</label>
                  <Input
                    value={hotelData.managerSignature}
                    onChange={(e) => setHotelData({ ...hotelData, managerSignature: e.target.value })}
                    className="p-6 text-xl rounded-2xl border-2 border-gray-200 focus:border-[#58CC02] focus:ring-[#58CC02]"
                    placeholder="Your name and title"
                  />
                  <p className="text-sm text-gray-600 px-2">
                    This signature will appear at the end of your review responses
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Platform Selection and URL */}
            {step === 4 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-6">Response Settings</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-medium mb-4 block">Response Style</label>
                      <div className="grid grid-cols-2 gap-6">
                        <button
                          type="button"
                          onClick={() => setResponseSettings(prev => ({ ...prev, style: 'professional' }))}
                          className={`relative p-6 rounded-2xl text-left transition-all ${
                            responseSettings.style === 'professional'
                              ? 'bg-primary text-white shadow-[0_4px_0_0_#1e40af]'
                              : 'bg-white border-2 border-gray-200 hover:border-primary'
                          } active:top-[2px] active:shadow-[0_0_0_0_#1e40af]`}
                        >
                          <div className="font-bold text-lg mb-2">Professional</div>
                          <div className="text-sm opacity-90">Formal and business-like tone</div>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setResponseSettings(prev => ({ ...prev, style: 'friendly' }))}
                          className={`relative p-6 rounded-2xl text-left transition-all ${
                            responseSettings.style === 'friendly'
                              ? 'bg-primary text-white shadow-[0_4px_0_0_#1e40af]'
                              : 'bg-white border-2 border-gray-200 hover:border-primary'
                          } active:top-[2px] active:shadow-[0_0_0_0_#1e40af]`}
                        >
                          <div className="font-bold text-lg mb-2">Friendly</div>
                          <div className="text-sm opacity-90">Warm and conversational tone</div>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-4 block">Response Length</label>
                      <div className="grid grid-cols-3 gap-6">
                        {['short', 'medium', 'long'].map((length) => (
                          <button
                            key={length}
                            type="button"
                            onClick={() => setResponseSettings(prev => ({ 
                              ...prev, 
                              length: length as ResponseSettings['length'] 
                            }))}
                            className={`relative p-6 rounded-2xl text-center transition-all ${
                              responseSettings.length === length
                                ? 'bg-primary text-white shadow-[0_4px_0_0_#1e40af]'
                                : 'bg-white border-2 border-gray-200 hover:border-primary'
                            } active:top-[2px] active:shadow-[0_0_0_0_#1e40af]`}
                          >
                            <div className="font-bold text-lg capitalize">{length}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  {PLATFORMS.map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => setSelectedPlatform(platform.id)}
                      className={`relative p-6 rounded-xl border-2 transition-all ${
                        selectedPlatform === platform.id
                          ? "border-primary bg-primary/5 shadow-lg"
                          : "border-gray-200 hover:border-gray-300"
                      } w-full`}
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
                          <h3 className="font-medium">{platform.name}</h3>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {selectedPlatform && (
                  <div className="space-y-4">
                    <Input
                      value={platformUrl}
                      onChange={(e) => setPlatformUrl(e.target.value)}
                      placeholder={PLATFORMS.find(p => p.id === selectedPlatform)?.placeholder}
                      className="h-12 rounded-xl"
                    />
                    <p className="text-sm text-gray-500">
                      Example: {PLATFORMS.find(p => p.id === selectedPlatform)?.example}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 6: Sync Configuration */}
            {step === 6 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Sync Settings</h2>
                
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-sm font-medium">Sync Type</label>
                    <Select
                      value={syncConfig.type}
                      onValueChange={(value: 'manual' | 'automatic') => 
                        setSyncConfig(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger className="border-2 border-gray-200 focus:ring-primary focus:ring-offset-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automatic">Automatic</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {syncConfig.type === 'automatic' && (
                    <div className="space-y-4">
                      <label className="text-sm font-medium">Sync Frequency</label>
                      <Select
                        value={syncConfig.frequency}
                        onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                          setSyncConfig(prev => ({ ...prev, frequency: value }))
                        }
                      >
                        <SelectTrigger className="border-2 border-gray-200 focus:ring-primary focus:ring-offset-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-4">
                    <label className="text-sm font-medium">Initial Reviews to Sync</label>
                    <Select
                      value={syncConfig.maxReviews}
                      onValueChange={(value: string) => 
                        setSyncConfig(prev => ({ ...prev, maxReviews: value }))
                      }
                    >
                      <SelectTrigger className="border-2 border-gray-200 focus:ring-primary focus:ring-offset-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">Last 50 reviews</SelectItem>
                        <SelectItem value="100">Last 100 reviews</SelectItem>
                        <SelectItem value="200">Last 200 reviews</SelectItem>
                        <SelectItem value="500">Last 500 reviews</SelectItem>
                        <SelectItem value="1000">Last 1000 reviews</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-4 mt-8">
              {step > 1 && (
                <Button
                  onClick={() => setStep(step - 1)}
                  variant="outline"
                  className="relative bg-white hover:bg-gray-100 text-primary font-bold py-6 px-8 text-xl border-2 border-primary rounded-2xl shadow-[0_4px_0_0_#1e40af] transition-all active:top-[2px] active:shadow-[0_0_0_0_#1e40af]"
                >
                  Back
                </Button>
              )}
              <Button
                onClick={handleContinue}
                disabled={isLoading}
                className="relative bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 px-8 text-xl rounded-2xl shadow-[0_4px_0_0_#1e40af] transition-all active:top-[2px] active:shadow-[0_0_0_0_#1e40af]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up property...
                  </>
                ) : (
                  step === totalSteps ? "Complete Setup" : "Continue"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

