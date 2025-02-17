"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getCookie } from '@/lib/utils'
import { toast } from "sonner"
import { Loader2, Clock, Calendar, MessageSquare, QrCode } from "lucide-react"
import QRCode from 'qrcode.react'

interface SetupAssistantModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => Promise<void>
}

interface Hotel {
  _id: string
  name: string
  type: string
  description: string
}

interface AssistantConfig {
  hotelId: string
  timezone: string
  breakfast: {
    startTime: string
    endTime: string
  }
  checkIn: {
    startTime: string
    endTime: string
  }
  reviewLink: string
  reviewRequestDelay: number
  triggerName: string
}

const TIMEZONES = [
  { value: "Europe/Rome", label: "Rome (UTC+1)" },
  { value: "Europe/London", label: "London (UTC+0)" },
  { value: "Europe/Paris", label: "Paris (UTC+1)" },
  { value: "Europe/Berlin", label: "Berlin (UTC+1)" },
  { value: "Europe/Madrid", label: "Madrid (UTC+1)" },
  { value: "Europe/Amsterdam", label: "Amsterdam (UTC+1)" },
  { value: "Europe/Brussels", label: "Brussels (UTC+1)" },
  { value: "Europe/Copenhagen", label: "Copenhagen (UTC+1)" },
  { value: "Europe/Dublin", label: "Dublin (UTC+0)" },
  { value: "Europe/Helsinki", label: "Helsinki (UTC+2)" },
  { value: "Europe/Lisbon", label: "Lisbon (UTC+0)" },
  { value: "Europe/Oslo", label: "Oslo (UTC+1)" },
  { value: "Europe/Prague", label: "Prague (UTC+1)" },
  { value: "Europe/Stockholm", label: "Stockholm (UTC+1)" },
  { value: "Europe/Vienna", label: "Vienna (UTC+1)" },
  { value: "Europe/Warsaw", label: "Warsaw (UTC+1)" },
  { value: "Europe/Budapest", label: "Budapest (UTC+1)" },
  { value: "Europe/Athens", label: "Athens (UTC+2)" },
  { value: "Europe/Moscow", label: "Moscow (UTC+3)" },
  { value: "Europe/Istanbul", label: "Istanbul (UTC+3)" },
  { value: "America/New_York", label: "New York (UTC-5)" },
  { value: "America/Chicago", label: "Chicago (UTC-6)" },
  { value: "America/Denver", label: "Denver (UTC-7)" },
  { value: "America/Los_Angeles", label: "Los Angeles (UTC-8)" },
  { value: "America/Anchorage", label: "Anchorage (UTC-9)" },
  { value: "Pacific/Honolulu", label: "Honolulu (UTC-10)" },
  { value: "America/Phoenix", label: "Phoenix (UTC-7)" },
  { value: "America/Miami", label: "Miami (UTC-5)" },
  { value: "America/Las_Vegas", label: "Las Vegas (UTC-8)" },
  { value: "America/Houston", label: "Houston (UTC-6)" }
]

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+393517279170'

export function SetupAssistantModal({ isOpen, onClose, onSuccess }: SetupAssistantModalProps) {
  const [step, setStep] = useState(1)
  const totalSteps = 5
  const [setupCompleted, setSetupCompleted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [qrCodeData, setQrCodeData] = useState<string>("")

  const [config, setConfig] = useState<AssistantConfig>({
    hotelId: "",
    timezone: "Europe/Rome",
    breakfast: {
      startTime: "07:00",
      endTime: "10:30"
    },
    checkIn: {
      startTime: "14:00",
      endTime: "22:00"
    },
    reviewLink: "",
    reviewRequestDelay: 3,
    triggerName: ""
  })

  // Fetch hotels on component mount
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const token = getCookie('token')
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels`, {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          if (response.status === 401) {
            // Gestione unauthorized
            console.log('Token invalid')
            return
          }
          throw new Error('Failed to fetch hotels')
        }

        const data = await response.json()
        console.log('Hotels fetched:', data) // Debug log
        setHotels(data)

        // Se c'è un hotel salvato nel localStorage, selezionalo
        const lastSelectedHotel = localStorage.getItem('lastSelectedHotel')
        if (lastSelectedHotel && data.some((hotel: Hotel) => hotel._id === lastSelectedHotel)) {
          setConfig(prev => ({ ...prev, hotelId: lastSelectedHotel }))
        } else if (data.length > 0) {
          setConfig(prev => ({ ...prev, hotelId: data[0]._id }))
        }
      } catch (error) {
        console.error('Error fetching hotels:', error)
        toast.error('Error loading hotels')
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      fetchHotels()
    }
  }, [isOpen])

  const handleContinue = async () => {
    try {
      setError(null)

      // Validazione per step 1
      if (step === 1) {
        if (!config.hotelId || !config.timezone) {
          setError("Please select both hotel and timezone")
          return
        }
      }

      // Validazione per step 2
      if (step === 2) {
        if (!config.breakfast.startTime || !config.breakfast.endTime || 
            !config.checkIn.startTime || !config.checkIn.endTime) {
          setError("Please fill in all time fields")
          return
        }

        // Salva i dati dello step 1 e 2
        const token = getCookie('token')
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp-assistant`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            hotelId: config.hotelId,
            timezone: config.timezone,
            breakfast: {
              startTime: config.breakfast.startTime,
              endTime: config.breakfast.endTime
            },
            checkIn: {
              startTime: config.checkIn.startTime,
              endTime: config.checkIn.endTime
            }
          })
        })

        if (!response.ok) {
          throw new Error('Failed to save assistant configuration')
        }

        const data = await response.json()
        console.log('Saved configuration:', data)
        toast.success('Configuration saved successfully')
      }

      // Validazione per step 3
      if (step === 3) {
        if (!config.reviewLink) {
          setError("Please enter a review link")
          return
        }
        
        // Valida che il link sia un URL valido
        try {
          new URL(config.reviewLink)
        } catch {
          setError("Please enter a valid URL")
          return
        }

        // Salva i dati dello step 3
        const token = getCookie('token')
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp-assistant/${config.hotelId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reviewLink: config.reviewLink,
            reviewRequestDelay: config.reviewRequestDelay
          })
        })

        if (!response.ok) {
          throw new Error('Failed to save review settings')
        }

        const data = await response.json()
        console.log('Saved review settings:', data)
        toast.success('Review settings saved successfully')
      }

      // Validazione per step 4
      if (step === 4) {
        if (!config.triggerName) {
          setError("Please enter a trigger name")
          return
        }

        // Validazione del formato del trigger name
        if (!/^[a-zA-Z\s]+$/.test(config.triggerName)) {
          setError("Trigger name can only contain letters and spaces")
          return
        }

        // Salva i dati dello step 4
        const token = getCookie('token')
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp-assistant/${config.hotelId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            triggerName: config.triggerName
          })
        })

        if (!response.ok) {
          const data = await response.json()
          if (data.message.includes('duplicate')) {
            setError("This trigger name is already in use. Please choose another one.")
            return
          }
          throw new Error('Failed to save trigger name')
        }

        const data = await response.json()
        console.log('Saved trigger name:', data)
        toast.success('Trigger name saved successfully')
      }

      // Procedi allo step successivo
      setStep(step + 1)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to save configuration')
      setError('An error occurred while saving the configuration')
    }
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] min-h-[600px] max-h-[90vh] overflow-y-auto p-0 bg-white">
        <div className="p-12">
          <Progress 
            value={(step / totalSteps) * 100} 
            className="mb-12 h-2 w-[90%] mx-auto [&>div]:bg-primary"
          />
          
          <div className="max-w-3xl mx-auto space-y-10">
            {/* Step 1: Hotel Selection and Timezone */}
            {step === 1 && (
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-gray-800">Select Hotel & Timezone</h2>
                  <p className="text-gray-600">Choose the hotel you want to set up the WhatsApp assistant for</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">Select Hotel</label>
                    <Select
                      value={config.hotelId}
                      onValueChange={(value) => 
                        setConfig(prev => ({ ...prev, hotelId: value }))
                      }
                    >
                      <SelectTrigger className="h-14 border-2 border-gray-200 focus:ring-primary focus:ring-offset-0 rounded-xl">
                        <SelectValue placeholder="Choose a hotel" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {hotels.map((hotel) => (
                          <SelectItem key={hotel._id} value={hotel._id}>
                            {hotel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">Timezone</label>
                    <Select
                      value={config.timezone}
                      onValueChange={(value) => 
                        setConfig(prev => ({ ...prev, timezone: value }))
                      }
                    >
                      <SelectTrigger className="h-14 border-2 border-gray-200 focus:ring-primary focus:ring-offset-0 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl max-h-[300px]">
                        {TIMEZONES.map((timezone) => (
                          <SelectItem key={timezone.value} value={timezone.value}>
                            {timezone.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Orari */}
            {step === 2 && (
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-gray-800">Hotel Schedule</h2>
                  <p className="text-gray-600">Set your hotel's breakfast and check-in times</p>
                </div>

                <div className="space-y-8">
                  {/* Breakfast Times */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-700">Breakfast Time</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Start Time</label>
                        <Input
                          type="time"
                          value={config.breakfast.startTime}
                          onChange={(e) => 
                            setConfig(prev => ({
                              ...prev,
                              breakfast: {
                                ...prev.breakfast,
                                startTime: e.target.value
                              }
                            }))
                          }
                          className="h-14 border-2 border-gray-200 focus:ring-primary focus:ring-offset-0 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">End Time</label>
                        <Input
                          type="time"
                          value={config.breakfast.endTime}
                          onChange={(e) => 
                            setConfig(prev => ({
                              ...prev,
                              breakfast: {
                                ...prev.breakfast,
                                endTime: e.target.value
                              }
                            }))
                          }
                          className="h-14 border-2 border-gray-200 focus:ring-primary focus:ring-offset-0 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Check-in Times */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-700">Check-in Time</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Start Time</label>
                        <Input
                          type="time"
                          value={config.checkIn.startTime}
                          onChange={(e) => 
                            setConfig(prev => ({
                              ...prev,
                              checkIn: {
                                ...prev.checkIn,
                                startTime: e.target.value
                              }
                            }))
                          }
                          className="h-14 border-2 border-gray-200 focus:ring-primary focus:ring-offset-0 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">End Time</label>
                        <Input
                          type="time"
                          value={config.checkIn.endTime}
                          onChange={(e) => 
                            setConfig(prev => ({
                              ...prev,
                              checkIn: {
                                ...prev.checkIn,
                                endTime: e.target.value
                              }
                            }))
                          }
                          className="h-14 border-2 border-gray-200 focus:ring-primary focus:ring-offset-0 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review Settings */}
            {step === 3 && (
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-gray-800">Review Settings</h2>
                  <p className="text-gray-600">Configure when and how to request reviews from your guests</p>
                </div>

                <div className="space-y-8">
                  {/* Review Link */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">Review Link</label>
                    <Input
                      type="url"
                      placeholder="https://www.google.com/business/..."
                      value={config.reviewLink}
                      onChange={(e) => 
                        setConfig(prev => ({
                          ...prev,
                          reviewLink: e.target.value
                        }))
                      }
                      className="h-14 border-2 border-gray-200 focus:ring-primary focus:ring-offset-0 rounded-xl"
                    />
                    <p className="text-sm text-gray-500">
                      Enter the link where guests can leave a review (e.g., Google Business, TripAdvisor)
                    </p>
                  </div>

                  {/* Review Request Delay */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">Days Before Requesting Review</label>
                    <Select
                      value={config.reviewRequestDelay.toString()}
                      onValueChange={(value) => 
                        setConfig(prev => ({
                          ...prev,
                          reviewRequestDelay: parseInt(value)
                        }))
                      }
                    >
                      <SelectTrigger className="h-14 border-2 border-gray-200 focus:ring-primary focus:ring-offset-0 rounded-xl">
                        <SelectValue placeholder="Select days" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {[1, 2, 3, 4, 5, 6, 7].map((days) => (
                          <SelectItem key={days} value={days.toString()}>
                            {days} {days === 1 ? 'day' : 'days'} after check-out
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500">
                      Choose how many days after check-out the review request should be sent
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Trigger Name */}
            {step === 4 && (
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-gray-800">Assistant Name</h2>
                  <p className="text-gray-600">Choose a name that will trigger your WhatsApp assistant</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">Trigger Name</label>
                    <Input
                      type="text"
                      placeholder="e.g., Concierge, Assistant, Helper"
                      value={config.triggerName}
                      onChange={(e) => {
                        const value = e.target.value.trim()
                        setConfig(prev => ({
                          ...prev,
                          triggerName: value
                        }))
                      }}
                      className="h-14 border-2 border-gray-200 focus:ring-primary focus:ring-offset-0 rounded-xl"
                    />
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">
                        This name will be used to activate your assistant in WhatsApp conversations.
                      </p>
                      <p className="text-sm text-gray-500">
                        Example: If you choose "Concierge", guests can type "Concierge, what are the breakfast hours?"
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-xl space-y-3">
                    <h4 className="font-medium text-blue-700">Tips for choosing a name:</h4>
                    <ul className="list-disc list-inside text-sm text-blue-600 space-y-2">
                      <li>Keep it simple and easy to remember</li>
                      <li>Use a professional title that reflects your hotel's brand</li>
                      <li>Avoid special characters or numbers</li>
                      <li>Make sure it's unique to prevent conflicts</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: QR Code e Completamento */}
            {step === 5 && (
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-gray-800">Setup Complete!</h2>
                  <p className="text-gray-600">Scan the QR code to start using your WhatsApp assistant</p>
                </div>

                <div className="flex flex-col items-center space-y-8">
                  <div className="bg-white p-8 rounded-2xl shadow-lg">
                    <QRCode 
                      value={`https://wa.me/${WHATSAPP_NUMBER}?text=Start%20${encodeURIComponent(config.triggerName)}`}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>

                  <div className="space-y-4 text-center max-w-md">
                    <h3 className="text-xl font-semibold text-gray-700">How to use your assistant:</h3>
                    <ol className="text-left space-y-3 text-gray-600">
                      <li className="flex items-start space-x-2">
                        <span className="font-bold text-primary">1.</span>
                        <span>Scan the QR code above with your phone's camera</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="font-bold text-primary">2.</span>
                        <span>Click the link to open WhatsApp</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="font-bold text-primary">3.</span>
                        <span>Send a message using your trigger word: "{config.triggerName}"</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="font-bold text-primary">4.</span>
                        <span>Try asking about breakfast times or check-in hours!</span>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-xl w-full">
                    <div className="flex items-center space-x-3 text-blue-700">
                      <MessageSquare className="h-5 w-5" />
                      <h4 className="font-medium">Example commands:</h4>
                    </div>
                    <ul className="mt-3 space-y-2 text-blue-600 text-sm">
                      <li>"{config.triggerName}, what are the breakfast hours?"</li>
                      <li>"{config.triggerName}, when can I check in?"</li>
                      <li>"{config.triggerName}, how can I leave a review?"</li>
                    </ul>
                  </div>
                </div>

                <div className="flex justify-center pt-6">
                  <Button
                    onClick={() => {
                      setSetupCompleted(true)
                      onSuccess()
                      onClose()
                    }}
                    className="h-14 px-12 rounded-xl bg-green-500 hover:bg-green-600 text-white"
                  >
                    Start Using Assistant
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <div className="text-red-500 text-sm mt-4 text-center">
                {error}
              </div>
            )}

            <div className="flex justify-between pt-8">
              {step > 1 && (
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="h-14 px-8 rounded-xl"
                >
                  Back
                </Button>
              )}
              <Button
                onClick={handleContinue}
                className="h-14 px-8 rounded-xl ml-auto"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
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