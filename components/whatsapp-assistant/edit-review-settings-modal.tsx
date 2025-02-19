"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Link } from "lucide-react"
import { getCookie } from "@/lib/utils"

interface ReviewSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newConfig: any) => void
  currentConfig: {
    hotelId: string
    reviewLink: string
    reviewRequestDelay: number
  }
}

export function EditReviewSettingsModal({ isOpen, onClose, onSuccess, currentConfig }: ReviewSettingsModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [config, setConfig] = useState({
    reviewLink: currentConfig.reviewLink,
    reviewRequestDelay: currentConfig.reviewRequestDelay
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
          reviewLink: config.reviewLink,
          reviewRequestDelay: config.reviewRequestDelay
        })
      })

      if (!response.ok) throw new Error('Failed to update settings')

      const updatedConfig = await response.json()
      onSuccess(updatedConfig)
      toast.success('Review settings updated successfully')
      onClose()
    } catch (error) {
      console.error('Error updating review settings:', error)
      toast.error('Failed to update review settings')
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
                <h3 className="text-lg font-semibold mb-4">Edit Review Settings</h3>
                
                {/* Review Link */}
                <div className="space-y-4 mb-6">
                  <label className="block text-sm font-medium text-gray-700">
                    Review Link
                  </label>
                  <Input
                    type="url"
                    placeholder="https://www.google.com/business/..."
                    value={config.reviewLink}
                    onChange={(e) => setConfig(prev => ({ ...prev, reviewLink: e.target.value }))}
                    className="h-14 border-2 border-gray-200 focus:ring-primary focus:ring-offset-0 rounded-xl"
                  />
                </div>

                {/* Review Request Delay */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Review Request Timing
                  </label>
                  <Select
                    value={config.reviewRequestDelay.toString()}
                    onValueChange={(value) => setConfig(prev => ({ 
                      ...prev, 
                      reviewRequestDelay: parseInt(value) 
                    }))}
                  >
                    <SelectTrigger className="h-14 border-2 border-gray-200 focus:ring-primary focus:ring-offset-0 rounded-xl">
                      <SelectValue placeholder="Select days" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[280px] rounded-xl border-2 border-gray-200">
                      <div className="p-2">
                        <div className="text-sm font-medium text-gray-500 px-2 py-1.5">
                          Select delay
                        </div>
                        {[1, 2, 3, 4, 5, 6, 7].map((days) => (
                          <SelectItem
                            key={days}
                            value={days.toString()}
                            className="rounded-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer py-2.5 px-2"
                          >
                            <div className="flex items-center">
                              <Link className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{days} {days === 1 ? 'day' : 'days'} after first interaction</span>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
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
                  disabled={isLoading}
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
            </div>
          </div>

          {/* Colonna destra - Spiegazioni */}
          <div className="w-full overflow-y-auto px-12 py-8 bg-[#f5f3f2] flex items-center relative">
            <div className="absolute inset-0" 
                 style={{
                   backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/star-edDN5Jr4obBxDxUzUa9hZvYsN8VR1v.png')`,
                   backgroundSize: "cover",
                   backgroundPosition: "center",
                   opacity: "0.3"
                 }}>
            </div>
            <div className="w-full max-w-2xl mx-auto space-y-10 relative z-10">
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-2xl shadow-lg">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">About Review Settings</h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                        <span>🔗</span> Review Link
                      </h4>
                      <p className="text-gray-600">
                        The review link is automatically sent to guests after their stay, making it easy for them to share their experience.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                        <span>⏱️</span> Request Timing
                      </h4>
                      <p className="text-gray-600">
                        Choose the optimal delay for sending review requests to ensure guests have had time to experience your services fully.
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