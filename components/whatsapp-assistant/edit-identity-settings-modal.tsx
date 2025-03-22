"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Check, Download } from "lucide-react"
import { getCookie } from "@/lib/utils"
import { useDebouncedCallback } from 'use-debounce'
import { QRCodeSVG } from 'qrcode.react'

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+393517279170'

interface IdentitySettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newConfig: any) => void
  currentConfig: {
    hotelId: string
    triggerName: string
  }
}

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
      toast.error("Scegli un nome disponibile")
      return
    }

    try {
      setIsLoading(true)
      const token = getCookie('token')
      
      // Log dei dati che stiamo inviando
      console.log('Invio dati di identità al server:', {
        triggerName: config.triggerName
      })
      
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

      // Log della risposta HTTP
      console.log('Status risposta:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Errore dal server:', errorText)
        throw new Error(`Errore durante l'aggiornamento dell'identità: ${response.status} ${response.statusText}`)
      }

      const updatedConfig = await response.json()
      console.log('Configurazione aggiornata:', updatedConfig)
      
      // Generate QR code data
      const message = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(config.triggerName)}`
      setQrCodeData(message)
      
      onSuccess(updatedConfig)
      setStep(2) // Move to QR code step
    } catch (error) {
      console.error('Errore durante l\'aggiornamento dell\'identità dell\'assistente:', error)
      toast.error(`Errore durante il salvataggio: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
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
                    <h3 className="text-lg font-semibold mb-4">Your New QR Code</h3>
                    <div className="space-y-6">
                      <div className="bg-white p-8 rounded-xl border-2 border-gray-100">
                        <div className="flex flex-col items-center justify-center space-y-6">
                          <div className="relative">
                            <div className="absolute -inset-4">
                              <div className="w-full h-full max-w-sm mx-auto lg:mx-0 animate-pulse-subtle">
                                <div className="h-full w-full bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-3xl blur-2xl" />
                              </div>
                            </div>
                            <QRCodeSVG
                              value={qrCodeData}
                              size={200}
                              level="H"
                              includeMargin={true}
                            />
                          </div>
                          <div className="text-center space-y-2">
                            <p className="text-sm text-gray-500">
                              Scan this QR code or click below to download
                            </p>
                            <Button
                              onClick={handleDownloadQR}
                              variant="outline"
                              className="rounded-xl border-gray-200"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download QR Code
                            </Button>
                          </div>
                        </div>
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
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,#00000003_25%,#00000003_50%,transparent_50%,transparent_75%,#00000003_75%)] bg-[length:16px_16px]" />
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