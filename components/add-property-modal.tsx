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
import { Loader2, ArrowLeft, Lightbulb, CheckSquare, Info, ArrowRight } from "lucide-react"

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
  const totalSteps = 7
  const [setupCompleted, setSetupCompleted] = useState(false)
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
    try {
      setError(null)

      if (step < totalSteps - 1) {
        if (step === 1) {
          if (!hotelData.name || !hotelData.type) {
            setError('Please fill in all required fields')
            return
          }
        }
        if (step === 2) {
          if (!hotelData.description) {
            setError('Please provide a description for your property')
            return
          }
        }
        if (step === 3) {
          if (!hotelData.managerSignature) {
            setError('Please provide a manager signature')
            return
          }
        }
        if (step === 5) {
          if (selectedPlatform && !platformUrl) {
            setError('Please provide a valid platform URL or skip the integration')
            return
          }
        }

        setStep(step + 1)
      } else if (step === totalSteps - 1) {
        setIsLoading(true)
        const token = getCookie('token')

        if (!hotelData.name || !hotelData.type || !hotelData.description || 
            !hotelData.managerSignature) {
          throw new Error('Missing required fields')
        }

        const hotelPayload = {
          ...hotelData,
          responseSettings: {
            style: responseSettings.style,
            length: responseSettings.length
          }
        }

        const hotelResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/hotels`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(hotelPayload)
          }
        )

        const createdHotel = await hotelResponse.json()
        
        if (!hotelResponse.ok) {
          throw new Error(createdHotel.message || 'Error creating hotel')
        }

        if (selectedPlatform && platformUrl) {
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

          const createdIntegration = await integrationResponse.json()

          const syncResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/integrations/${createdIntegration._id}/sync`,
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
            console.error('Initial sync request failed, but setup was successful')
          }
        }

        setSetupCompleted(true)
        setStep(totalSteps)
      } else {
        setSetupCompleted(true)
        onSuccess()
        onClose()
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to save configuration')
      setError('An error occurred while saving the configuration')
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
                    <SelectTrigger className="h-14 rounded-2xl border-2 border-gray-200 focus:ring-[#58CC02] focus:border-[#58CC02] focus:ring-offset-0">
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
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-3">Property Description</h2>
                  
                  <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-6 mb-6">
                    <div className="flex gap-3">
                      <Lightbulb className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-lg font-semibold text-blue-800 mb-2">Why this matters?</h3>
                        <p className="text-blue-700 leading-relaxed">
                          A detailed description helps our AI understand your property's unique features 
                          and generate more accurate, personalized responses to your reviews.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Textarea
                      value={hotelData.description}
                      onChange={(e) => setHotelData({ ...hotelData, description: e.target.value })}
                      className="p-6 text-lg rounded-2xl border-2 border-gray-200 focus:border-[#58CC02] focus:ring-[#58CC02] min-h-[250px] transition-all duration-200 placeholder:text-gray-400 placeholder:italic"
                      placeholder="Example: Our 4-star boutique hotel features 45 rooms and suites, each uniquely designed with modern amenities. Located in the heart of the historic district, we're just steps away from major attractions. Our facilities include a rooftop restaurant, spa, fitness center, and a conference room. We pride ourselves on our personalized service and attention to detail, maintaining high cleanliness standards, and offering a blend of traditional hospitality with modern comfort."
                    />
                    
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-[#58CC02]" />
                        Key Elements to Include:
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          {
                            icon: "🏨",
                            text: "Property size and room types"
                          },
                          {
                            icon: "📍",
                            text: "Location and nearby attractions"
                          },
                          {
                            icon: "✨",
                            text: "Unique amenities and services"
                          },
                          {
                            icon: "👥",
                            text: "Target guest profile"
                          },
                          {
                            icon: "🌟",
                            text: "Service standards and values"
                          },
                          {
                            icon: "🎯",
                            text: "Competitive advantages"
                          }
                        ].map((item, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100">
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-gray-700">{item.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Info className="w-4 h-4" />
                      <span>
                        Minimum 100 characters recommended for better AI understanding
                      </span>
                    </div>
                  </div>
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
                  <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-6 mb-6">
                    <div className="flex gap-3">
                      <Info className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-lg font-semibold text-blue-800 mb-2">Platform Integration</h3>
                        <p className="text-blue-700 leading-relaxed">
                          You can choose to integrate a review platform now or skip this step and add integrations later from the Integrations page.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setSelectedPlatform('')
                      setPlatformUrl('')
                      setStep(6)
                    }}
                    className="w-full p-6 mb-4 rounded-xl border-2 border-gray-200 hover:border-primary bg-gray-50 hover:bg-gray-100 text-gray-700 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Skip platform integration for now
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">or choose a platform</span>
                    </div>
                  </div>

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
                    {selectedPlatform === 'google' && (
                      <div className="text-sm text-gray-600 space-y-2">
                        <p>How to find your Google Maps URL:</p>
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

            {/* Step 7: Success */}
            {step === totalSteps && setupCompleted && (
              <div className="space-y-8 text-center py-12">
                <div className="flex flex-col items-center gap-6">
                  <div className="text-6xl animate-bounce">
                    🎉
                  </div>
                  
                  <h2 className="text-3xl font-bold text-gray-800">
                    Setup Completed Successfully!
                  </h2>
                  
                  <div className="space-y-4 max-w-2xl mx-auto">
                    <p className="text-xl text-gray-600 leading-relaxed">
                      Your property <span className="font-semibold text-primary">{hotelData.name}</span> has been set up successfully with {selectedPlatform} integration!
                    </p>
                    
                    <div className="bg-primary/5 rounded-2xl p-6 mt-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Want to import reviews from other platforms?
                      </h3>
                      <p className="text-gray-600">
                        Visit the <span className="text-primary font-semibold">Integrations</span> section 
                        to add more platforms like Google, Booking.com, or TripAdvisor.
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      onSuccess()
                      onClose()
                    }}
                    className="mt-8 relative bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 px-12 text-xl rounded-2xl shadow-[0_4px_0_0_#1e40af] transition-all active:top-[2px] active:shadow-[0_0_0_0_#1e40af]"
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-4 mt-8">
              {step > 1 && step < totalSteps && (
                <Button
                  onClick={() => setStep(step - 1)}
                  variant="outline"
                  className="relative bg-white hover:bg-gray-100 text-primary font-bold py-6 px-8 text-xl border-2 border-primary rounded-2xl shadow-[0_4px_0_0_#1e40af] transition-all active:top-[2px] active:shadow-[0_0_0_0_#1e40af]"
                >
                  Back
                </Button>
              )}
              {step < totalSteps && (
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
                    step === totalSteps - 1 ? "Complete Setup" : "Continue"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

