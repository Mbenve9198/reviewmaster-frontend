"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { getCookie } from "@/lib/utils"

interface TimeSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newConfig: any) => void
  currentConfig: {
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
  }
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

const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4)
  const minute = (i % 4) * 15
  const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  return {
    value: time,
    label: time
  }
})

export function EditTimeSettingsModal({ isOpen, onClose, onSuccess, currentConfig }: TimeSettingsModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [config, setConfig] = useState({
    timezone: currentConfig.timezone,
    breakfast: { ...currentConfig.breakfast },
    checkIn: { ...currentConfig.checkIn }
  })

  const handleSave = async () => {
    try {
      setIsLoading(true)
      const token = getCookie('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp-assistant/${currentConfig.hotelId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timezone: config.timezone,
          breakfast: config.breakfast,
          checkIn: config.checkIn
        })
      })

      if (!response.ok) throw new Error('Failed to update settings')

      const updatedConfig = await response.json()
      onSuccess(updatedConfig)
      toast.success('Time settings updated successfully')
      onClose()
    } catch (error) {
      console.error('Error updating time settings:', error)
      toast.error('Failed to update time settings')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white p-0 gap-0 rounded-3xl overflow-hidden">
        <div className="grid grid-cols-2 flex-1 divide-x">
          {/* Colonna sinistra - Form */}
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Edit Time Settings</h3>
                
                {/* Timezone */}
                <div className="space-y-4 mb-6">
                  <label className="block text-sm font-medium text-gray-700">
                    Timezone
                  </label>
                  <Select
                    value={config.timezone}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map(tz => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Breakfast Hours */}
                <div className="space-y-4 mb-6">
                  <label className="block text-sm font-medium text-gray-700">
                    Breakfast Hours
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Select
                        value={config.breakfast.startTime}
                        onValueChange={(value) => setConfig(prev => ({
                          ...prev,
                          breakfast: { ...prev.breakfast, startTime: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Start time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map(time => (
                            <SelectItem key={time.value} value={time.value}>
                              {time.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Select
                        value={config.breakfast.endTime}
                        onValueChange={(value) => setConfig(prev => ({
                          ...prev,
                          breakfast: { ...prev.breakfast, endTime: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="End time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map(time => (
                            <SelectItem key={time.value} value={time.value}>
                              {time.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Check-in Hours */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Check-in Hours
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Select
                        value={config.checkIn.startTime}
                        onValueChange={(value) => setConfig(prev => ({
                          ...prev,
                          checkIn: { ...prev.checkIn, startTime: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Start time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map(time => (
                            <SelectItem key={time.value} value={time.value}>
                              {time.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Select
                        value={config.checkIn.endTime}
                        onValueChange={(value) => setConfig(prev => ({
                          ...prev,
                          checkIn: { ...prev.checkIn, endTime: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="End time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map(time => (
                            <SelectItem key={time.value} value={time.value}>
                              {time.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Colonna destra - Spiegazioni */}
          <div className="w-full overflow-y-auto px-12 py-8 bg-[#f5f3f2] flex items-center relative">
            <div className="absolute inset-0" 
                 style={{
                   backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/time-TwOS9MlmcnNjFliDrzz3oYOiD1LvVk.png')`,
                   backgroundSize: "cover",
                   backgroundPosition: "center",
                   opacity: "0.3"
                 }}>
            </div>
            <div className="w-full max-w-2xl mx-auto space-y-10 relative z-10">
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-2xl shadow-lg">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Why These Settings Matter</h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                        <span>🌍</span> Timezone Configuration
                      </h4>
                      <p className="text-gray-600">
                        Setting the correct timezone ensures that all automated messages and responses 
                        consider local time, improving accuracy for time-sensitive information.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                        <span>⏰</span> Time Management
                      </h4>
                      <p className="text-gray-600">
                        Accurate breakfast and check-in times help guests plan their stay and ensure 
                        they receive timely information about available services.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 