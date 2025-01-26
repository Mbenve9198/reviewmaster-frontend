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
    style: 'professional'
    length: 'medium'
  }
}

interface IntegrationPayload {
  hotelId: string
  platform: string
  url: string
  syncConfig: {
    type: 'manual' | 'automatic'
    frequency: 'daily' | 'weekly' | 'monthly'
    maxReviews: string
    language: string
  }
}

interface AddPropertyModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => Promise<void>
}

export function AddPropertyModal({ isOpen, onClose, onSuccess }: AddPropertyModalProps) {
  const [step, setStep] = useState(1)
  const totalSteps = 5
  const [hotelData, setHotelData] = useState({
    name: "",
    type: "",
    description: "",
    managerSignature: ""
  })
  const [selectedPlatform, setSelectedPlatform] = useState<string>('google')
  const [platformUrl, setPlatformUrl] = useState("")
  const [syncConfig, setSyncConfig] = useState({
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
            style: 'professional',
            length: 'medium'
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

        const hotelResponseData = await hotelResponse.json()
        
        if (!hotelResponse.ok) {
          throw new Error(hotelResponseData.message || 'Error creating hotel')
        }

        // Then create the integration
        const integrationPayload: IntegrationPayload = {
          hotelId: hotelResponseData._id,
          platform: selectedPlatform,
          url: platformUrl.trim(),
          syncConfig: {
            type: syncConfig.type,
            frequency: syncConfig.frequency,
            maxReviews: syncConfig.maxReviews,
            language: 'en'
          }
        }

        const integrationResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/integrations/hotel/${hotelResponseData._id}`,
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
          throw new Error('Error creating integration')
        }

        toast.success("Property and integration added successfully")
        await onSuccess()
        onClose()
        
      } catch (error) {
        console.error('Error:', error)
        setError(error instanceof Error ? error.message : 'An unexpected error occurred')
        toast.error(error instanceof Error ? error.message : 'An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-2">Add New Property</h1>
              <p className="text-xl text-gray-600">Let's set up your new property</p>
            </div>

            <Progress value={(step / totalSteps) * 100} className="h-3" />

            <div className="flex items-start gap-8">
              <div className="w-48 h-48 flex-shrink-0 sticky top-8">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Animation%20-%201735492269786-mKYfBdc9ahOzlN7orHkSTFifJ4H3MG.gif"
                  alt="ReviewMaster Assistant"
                  width={192}
                  height={192}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex-1 space-y-8">
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
                    <div className="space-y-2">
                      <label className="text-xl font-bold text-gray-800">Property Type</label>
                      <Select
                        value={hotelData.type}
                        onValueChange={(value) => setHotelData({ ...hotelData, type: value })}
                      >
                        <SelectTrigger className="p-6 text-xl rounded-2xl border-2 border-gray-200 focus:border-[#58CC02] focus:ring-[#58CC02]">
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
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

                {/* Step 5: Sync Configuration */}
                {step === 5 && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Sync Type</label>
                        <Select
                          value={syncConfig.type}
                          onValueChange={(value) => 
                            setSyncConfig(prev => ({ ...prev, type: value }))
                          }
                        >
                          <SelectTrigger>
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
                          onValueChange={(value) => 
                            setSyncConfig(prev => ({ ...prev, frequency: value }))
                          }
                        >
                          <SelectTrigger>
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
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="100">Last 100 reviews</SelectItem>
                            <SelectItem value="200">Last 200 reviews</SelectItem>
                            <SelectItem value="500">Last 500 reviews</SelectItem>
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

                <div className="flex justify-end gap-4">
                  {step > 1 && (
                    <Button
                      onClick={() => setStep(step - 1)}
                      variant="outline"
                      className="relative bg-white hover:bg-gray-100 text-primary font-bold py-6 px-8 text-xl border-2 border-primary rounded-2xl shadow-[0_4px_0_0_#1d6d05] transition-all active:top-[2px] active:shadow-[0_0_0_0_#1d6d05]"
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    onClick={handleContinue}
                    disabled={
                      isLoading ||
                      (step === 1 && (!hotelData.name || !hotelData.type)) ||
                      (step === 2 && !hotelData.description) ||
                      (step === 3 && !hotelData.managerSignature) ||
                      (step === 4 && !platformUrl) ||
                      (step === 5 && (!syncConfig.type || !syncConfig.frequency || !syncConfig.maxReviews))
                    }
                    className="relative bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 px-8 text-xl rounded-2xl shadow-[0_4px_0_0_#1d6d05] transition-all active:top-[2px] active:shadow-[0_0_0_0_#1d6d05]"
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

