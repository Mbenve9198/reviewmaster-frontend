"use client"

import { useState } from "react"
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

export function SetupAssistantModal({ isOpen, onClose, onSuccess }: SetupAssistantModalProps) {
  const [step, setStep] = useState(1)
  const totalSteps = 5
  const [setupCompleted, setSetupCompleted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
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
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto p-0 bg-white">
        <div className="p-8">
          <Progress 
            value={(step / totalSteps) * 100} 
            className="mb-10 h-2 w-[90%] mx-auto [&>div]:bg-primary"
          />
          
          <div className="space-y-8">
            {/* Step 1: Hotel Selection and Timezone */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">Select Hotel & Timezone</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Select Hotel</label>
                    <Select
                      value={config.hotelId}
                      onValueChange={(value) => 
                        setConfig(prev => ({ ...prev, hotelId: value }))
                      }
                    >
                      <SelectTrigger className="h-12 border-2 border-gray-200 focus:ring-primary focus:ring-offset-0">
                        <SelectValue placeholder="Choose a hotel" />
                      </SelectTrigger>
                      <SelectContent>
                        {hotels.map((hotel) => (
                          <SelectItem key={hotel._id} value={hotel._id}>
                            {hotel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Timezone</label>
                    <Select
                      value={config.timezone}
                      onValueChange={(value) => 
                        setConfig(prev => ({ ...prev, timezone: value }))
                      }
                    >
                      <SelectTrigger className="h-12 border-2 border-gray-200 focus:ring-primary focus:ring-offset-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Rome">Europe/Rome (UTC+1)</SelectItem>
                        {/* Aggiungere altri fusi orari */}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Continua con gli altri step... */}

            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error}
              </div>
            )}

            <div className="flex justify-between pt-6">
              {step > 1 && (
                <Button
                  onClick={() => setStep(step - 1)}
                  variant="outline"
                  className="rounded-xl"
                >
                  Back
                </Button>
              )}
              <Button
                onClick={handleContinue}
                className="rounded-xl ml-auto"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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