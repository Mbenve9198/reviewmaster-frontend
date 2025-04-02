"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "sonner"
import { Loader2, MessageSquare, Info } from "lucide-react"
import { getCookie } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface MessageLimitsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newConfig: any) => void
  currentConfig: {
    hotelId: string
    messageLimits?: {
      inboundPerDay: number
      outboundPerDay: number
      enabled: boolean
    }
  }
}

export function EditMessageLimitsModal({ isOpen, onClose, onSuccess, currentConfig }: MessageLimitsModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  // Set default values if messageLimits is not defined
  const initialLimits = currentConfig.messageLimits || {
    inboundPerDay: 10,
    outboundPerDay: 10,
    enabled: true
  }
  
  const [config, setConfig] = useState({
    inboundPerDay: initialLimits.inboundPerDay,
    outboundPerDay: initialLimits.outboundPerDay,
    enabled: initialLimits.enabled
  })

  // Funzione per aggiornare entrambi i valori contemporaneamente
  const handleLimitChange = (value: number) => {
    setConfig(prev => ({
      ...prev,
      inboundPerDay: value,
      outboundPerDay: value
    }))
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      const token = getCookie('token')
      
      console.log('Saving message limits:', config)
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp-assistant/${currentConfig.hotelId}/message-limits`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      })
      
      console.log('Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Server error:', errorText)
        throw new Error(`Error updating message limits: ${response.status} ${response.statusText}`)
      }

      const updatedConfig = await response.json()
      console.log('Updated configuration:', updatedConfig)
      
      onSuccess(updatedConfig)
      toast.success('Message limits updated successfully')
      onClose()
    } catch (error) {
      console.error('Error updating message limits:', error)
      toast.error(`Error saving: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white p-0 gap-0 rounded-3xl overflow-hidden">
        <div className="grid grid-cols-2 flex-1 divide-x">
          {/* Left column - Form */}
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Daily Message Limits</h3>
                
                {/* Enable/disable switch */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-medium text-gray-700">Enable message limits</span>
                  <Switch 
                    checked={config.enabled}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
                  />
                </div>
                
                {/* Info alert */}
                <Alert className="mb-6 bg-blue-50 border-blue-100">
                  <Info className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-sm text-blue-700">
                    Guests will see their daily message limits in their first interaction with the concierge.
                  </AlertDescription>
                </Alert>

                <div className={config.enabled ? "" : "opacity-50 pointer-events-none"}>
                  {/* Common Slider for both inbound and outbound messages */}
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium text-gray-700">
                        Daily Message Limit
                      </label>
                      <span className="text-lg font-bold text-primary">{config.inboundPerDay}</span>
                    </div>
                    <style jsx global>{`
                      .custom-slider .MuiSlider-thumb {
                        background-color: white !important;
                        border: 2px solid var(--primary) !important;
                      }
                    `}</style>
                    <Slider
                      className="custom-slider"
                      value={[config.inboundPerDay]}
                      min={5}
                      max={50}
                      step={1}
                      onValueChange={(value) => handleLimitChange(value[0])}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Min: 5</span>
                      <span>Max: 50</span>
                    </div>
                  </div>

                  {/* Inbound and outbound info */}
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Inbound Messages:</span>
                      <span className="text-sm font-bold">{config.inboundPerDay}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Outbound Messages:</span>
                      <span className="text-sm font-bold">{config.outboundPerDay}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Info */}
          <div className="p-6 bg-gray-50">
            <div className="h-full flex flex-col">
              <h3 className="text-lg font-semibold mb-4">About Message Limits</h3>
              
              <div className="space-y-4 text-sm text-gray-600 flex-grow">
                <p>
                  Message limits help you control the volume of conversations between your guests and the AI concierge.
                </p>
                
                <div className="flex items-start space-x-2">
                  <MessageSquare className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p>
                    <strong>Inbound limit:</strong> Maximum messages a guest can send per day.
                  </p>
                </div>
                
                <div className="flex items-start space-x-2">
                  <MessageSquare className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p>
                    <strong>Outbound limit:</strong> Maximum responses the concierge can send per day.
                  </p>
                </div>
                
                <p>
                  When guests reach their daily limit, they'll receive a polite notification and can continue 
                  the conversation the next day.
                </p>
                
                <p>
                  The minimum limit is 5 messages in each direction to ensure a meaningful conversation experience.
                </p>
              </div>
              
              <div className="mt-auto pt-6 border-t space-y-4">
                <Button 
                  className="w-full rounded-full h-11 font-semibold text-md shadow-md"
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full rounded-full h-11 font-semibold text-md"
                  onClick={onClose}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 