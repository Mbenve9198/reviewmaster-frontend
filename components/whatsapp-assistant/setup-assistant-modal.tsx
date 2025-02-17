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

export function SetupAssistantModal({ isOpen, onClose, onSuccess }: SetupAssistantModalProps) {
  const [step, setStep] = useState(1)
  const totalSteps = 5
  const [setupCompleted, setSetupCompleted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hotels, setHotels] = useState<Hotel[]>([])

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
    if (step < totalSteps) {
      // Validazione per ogni step
      if (step === 1) {
        if (!config.hotelId || !config.timezone) {
          setError('Please select a hotel and timezone')
          return
        }
      }
      
      if (step === 2) {
        if (!config.breakfast.startTime || !config.breakfast.endTime || 
            !config.checkIn.startTime || !config.checkIn.endTime) {
          setError('Please fill in all time fields')
          return
        }
      }

      if (step === 3) {
        if (!config.reviewLink) {
          setError('Please provide a review link')
          return
        }
      }

      if (step === 4) {
        if (!config.triggerName) {
          setError('Please provide a trigger name')
          return
        }
      }

      setError(null)
      setStep(step + 1)
    } else {
      // Qui andrà la logica di salvataggio finale
      try {
        setIsLoading(true)
        // API call per salvare la configurazione
        // ...
        setSetupCompleted(true)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }
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

            {/* Continua con gli altri step... */}

            {error && (
              <div className="text-red-500 text-sm mt-4">
                {error}
              </div>
            )}

            <div className="flex justify-between pt-8">
              {step > 1 && (
                <Button
                  onClick={() => setStep(step - 1)}
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
                    Setting up...
                  </>
                ) : step === totalSteps ? (
                  "Complete Setup"
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 