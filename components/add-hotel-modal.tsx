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

interface AddHotelModalProps {
  isOpen: boolean
  onClose: () => void
  onHotelAdded: () => void
}

export function AddHotelModal({ isOpen, onClose, onHotelAdded }: AddHotelModalProps) {
  const [step, setStep] = useState(1)
  const totalSteps = 3
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    description: "",
    managerSignature: ""
  })
  const [error, setError] = useState<string | null>(null)

  const handleContinue = async () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      try {
        setError(null)
        const token = getCookie('token')
        
        const payload = {
          name: formData.name,
          type: formData.type.toLowerCase(),
          description: formData.description,
          managerSignature: formData.managerSignature,
          responseSettings: {
            style: 'professional',
            length: 'medium'
          }
        }
        console.log('Complete payload being sent:', payload)
        
        if (!token) {
          throw new Error('No authentication token found')
        }

        if (!formData.description) {
          throw new Error('Description is required')
        }

        const hotelsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        })

        console.log('GET /hotels response status:', hotelsResponse.status)
        const userHotels = await hotelsResponse.json()
        console.log('GET /hotels response data:', userHotels)

        if (userHotels.length >= 1) {
          console.log('Blocking hotel creation - existing hotels:', userHotels.length)
          throw new Error('Trial plan allows only one hotel')
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload),
          credentials: 'include'
        })

        const data = await response.json()
        console.log('Server response:', data)

        if (!response.ok) {
          throw new Error(data.message || 'Error creating hotel')
        }

        await onHotelAdded()
        setStep(1)
        setFormData({ name: "", type: "", description: "", managerSignature: "" })
        onClose()

      } catch (error) {
        console.error('Error adding hotel:', error)
        if (error instanceof Error) {
          setError(error.message)
          if (error.message === 'Trial plan allows only one hotel') {
            alert('Your trial plan allows only one hotel. Please upgrade to add more hotels.')
          } else {
            alert('An error occurred while creating the hotel: ' + error.message)
          }
        }
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-2">Add New Hotel</h1>
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
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xl font-bold text-gray-800">Hotel Name</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="p-6 text-xl rounded-2xl border-2 border-gray-200 focus:border-[#58CC02] focus:ring-[#58CC02]"
                        placeholder="Enter your hotel name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xl font-bold text-gray-800">Property Type</label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value })}
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
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="p-6 text-xl rounded-2xl border-2 border-gray-200 focus:border-[#58CC02] focus:ring-[#58CC02] min-h-[200px]"
                        placeholder="Describe your property..."
                        required
                      />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xl font-bold text-gray-800">Manager Signature</label>
                      <Input
                        value={formData.managerSignature}
                        onChange={(e) => setFormData({ ...formData, managerSignature: e.target.value })}
                        className="p-6 text-xl rounded-2xl border-2 border-gray-200 focus:border-[#58CC02] focus:ring-[#58CC02]"
                        placeholder="Your name and title"
                      />
                      <p className="text-sm text-gray-600 px-2">
                        This signature will appear at the end of your review responses
                      </p>
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
                    className="relative bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 px-8 text-xl rounded-2xl shadow-[0_4px_0_0_#1d6d05] transition-all active:top-[2px] active:shadow-[0_0_0_0_#1d6d05]"
                    disabled={
                      (step === 1 && (!formData.name || !formData.type)) ||
                      (step === 2 && !formData.description) ||
                      (step === 3 && !formData.managerSignature)
                    }
                  >
                    {step === totalSteps ? "Complete" : "Continue"}
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
