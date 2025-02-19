"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Check, X, Download } from "lucide-react"
import { getCookie } from "@/lib/utils"
import { useDebouncedCallback } from 'use-debounce'
import { QRCodeSVG } from 'qrcode.react'

interface IdentitySettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newConfig: any) => void
  currentConfig: {
    hotelId: string
    triggerName: string
  }
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+393517279170'

export function EditIdentitySettingsModal({ isOpen, onClose, onSuccess, currentConfig }: IdentitySettingsModalProps) {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingName, setIsCheckingName] = useState(false)
  const [isNameAvailable, setIsNameAvailable] = useState<boolean | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [qrCodeData, setQrCodeData] = useState<string>("")
  const [config, setConfig] = useState({
    triggerName: currentConfig.triggerName
  })

  // Funzione debounced per controllare la disponibilità del nome
  const checkTriggerName = useDebouncedCallback(async (name: string) => {
    if (!name || name.length < 3) {
      setIsNameAvailable(null)
      setNameError("Name must be at least 3 characters long")
      return
    }

    if (!/^[a-zA-Z\s]+$/.test(name)) {
      setIsNameAvailable(null)
      setNameError("Only letters and spaces are allowed")
      return
    }

    try {
      setIsCheckingName(true)
      const token = getCookie('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp-assistant/check-name/${name}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      setIsNameAvailable(data.available)
      setNameError(data.available ? null : "This name is already in use")
    } catch (error) {
      console.error('Error checking name:', error)
      setNameError("Error checking name availability")
    } finally {
      setIsCheckingName(false)
    }
  }, 500)

  const handleSave = async () => {
    if (!isNameAvailable) {
      toast.error("Please choose an available name")
      return
    }

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
          triggerName: config.triggerName
        })
      })

      if (!response.ok) throw new Error('Failed to update settings')

      const updatedConfig = await response.json()
      
      // Generate QR code data
      const message = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(config.triggerName)}`
      setQrCodeData(message)
      
      // Move to QR code step
      setStep(2)
      
      onSuccess(updatedConfig)
    } catch (error) {
      console.error('Error updating assistant identity:', error)
      toast.error('Failed to update assistant identity')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadQR = () => {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.download = 'whatsapp-qr.png'
      a.href = url
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white p-0 gap-0 rounded-3xl overflow-hidden">
        <div className="grid grid-cols-2 flex-1 divide-x">
          {/* Colonna sinistra - Form */}
          <div className="p-6">
            <div className="space-y-6">
              {step === 1 ? (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Edit Assistant Identity</h3>
                    
                    {/* Trigger Name */}
                    <div className="space-y-4 mb-6">
                      <label className="block text-sm font-medium text-gray-700">
                        Assistant Name
                      </label>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="e.g., Concierge, Assistant, Helper"
                          value={config.triggerName}
                          onChange={(e) => {
                            setConfig(prev => ({ ...prev, triggerName: e.target.value }))
                            checkTriggerName(e.target.value)
                          }}
                          className="h-14 border-2 border-gray-200 focus:ring-primary focus:ring-offset-0 rounded-xl pr-10"
                        />
                        {isCheckingName ? (
                          <Loader2 className="absolute right-3 top-4 h-6 w-6 animate-spin text-gray-400" />
                        ) : isNameAvailable && config.triggerName ? (
                          <Check className="absolute right-3 top-4 h-6 w-6 text-green-500" />
                        ) : null}
                      </div>
                      {nameError && (
                        <p className="text-sm text-red-500">{nameError}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button 
                      variant="outline" 
                      onClick={onClose}
                      className="rounded-xl border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSave} 
                      disabled={isLoading || !isNameAvailable}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
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
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Updated QR Code</h3>
                    <div className="space-y-6">
                      <div className="bg-white p-8 rounded-xl border-2 border-gray-100 flex flex-col items-center justify-center">
                        <QRCodeSVG
                          value={qrCodeData}
                          size={200}
                          level="H"
                          includeMargin={true}
                        />
                        <Button
                          onClick={handleDownloadQR}
                          variant="outline"
                          className="mt-4 rounded-xl border-gray-200"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download QR Code
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={onClose}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      Done
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Colonna destra - Spiegazioni */}
          <div className="w-full overflow-y-auto px-12 py-8 bg-[#f5f3f2] flex items-center relative">
            <div className="absolute inset-0" 
                 style={{
                   backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/trigger%20name-ykOAx3BcvzTLzzuq1etQy46OoBvSl2.png')`,
                   backgroundSize: "cover",
                   backgroundPosition: "center",
                   opacity: "0.3"
                 }}>
            </div>
            <div className="w-full max-w-2xl mx-auto space-y-10 relative z-10">
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-2xl shadow-lg">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    {step === 1 ? "Choosing the Perfect Name" : "Your New QR Code"}
                  </h3>
                  <div className="space-y-6">
                    {step === 1 ? (
                      <>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                            <span>💬</span> Natural Interaction
                          </h4>
                          <p className="text-gray-600">
                            Choose a name that feels natural in conversation. Your guests will use this name 
                            to activate the assistant in their messages.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                            <span>🎯</span> Brand Identity
                          </h4>
                          <p className="text-gray-600">
                            The name should reflect your hotel's brand and create a cohesive guest experience.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                            <span>📱</span> Update Your QR Codes
                          </h4>
                          <p className="text-gray-600">
                            Download and replace all existing QR codes with this new one to ensure guests 
                            can interact with your assistant using the new name.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                            <span>🔄</span> Transition Period
                          </h4>
                          <p className="text-gray-600">
                            The old trigger name will continue to work for a short period to ensure a smooth 
                            transition for existing guests.
                          </p>
                        </div>
                      </>
                    )}
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