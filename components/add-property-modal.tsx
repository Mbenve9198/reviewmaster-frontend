"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Hotel, BedDouble, Home, ArrowRight } from 'lucide-react'

interface AddPropertyModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddPropertyModal({ isOpen, onClose }: AddPropertyModalProps) {
  const [step, setStep] = useState(1)
  const [propertyData, setPropertyData] = useState({
    name: "",
    type: "",
    description: "",
    managerSignature: "",
    bookingUrl: ""
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setPropertyData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setPropertyData(prev => ({ ...prev, type: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1) {
      setStep(2)
    } else {
      console.log("Submitting property data:", propertyData)
      onClose()
    }
  }

  const progress = (step / 2) * 100

  const buttonClasses = "relative bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all active:top-[2px] active:shadow-[0_0_0_0_#2563eb] disabled:opacity-50 disabled:hover:bg-primary disabled:active:top-0 disabled:active:shadow-[0_4px_0_0_#2563eb]"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-3xl">
        <div className="bg-primary p-4">
          <Progress value={progress} className="h-3 bg-primary/20" />
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 ? (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-primary mb-2">Property Details</h2>
                  <p className="text-gray-600">Tell us about your property</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-700">Property Name</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      value={propertyData.name} 
                      onChange={handleInputChange} 
                      className="rounded-xl border-2 focus:border-primary focus:ring-primary"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-gray-700">Property Type</Label>
                    <Select onValueChange={handleSelectChange} value={propertyData.type}>
                      <SelectTrigger className="rounded-xl border-2">
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hotel">
                          <div className="flex items-center">
                            <Hotel className="w-4 h-4 mr-2" />
                            Hotel
                          </div>
                        </SelectItem>
                        <SelectItem value="b&b">
                          <div className="flex items-center">
                            <BedDouble className="w-4 h-4 mr-2" />
                            B&B
                          </div>
                        </SelectItem>
                        <SelectItem value="apartment">
                          <div className="flex items-center">
                            <Home className="w-4 h-4 mr-2" />
                            Apartment
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-gray-700">Description</Label>
                    <Textarea 
                      id="description" 
                      name="description" 
                      value={propertyData.description} 
                      onChange={handleInputChange}
                      className="rounded-xl border-2 focus:border-primary focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="managerSignature" className="text-gray-700">Manager Signature</Label>
                    <Input 
                      id="managerSignature" 
                      name="managerSignature" 
                      value={propertyData.managerSignature} 
                      onChange={handleInputChange}
                      className="rounded-xl border-2 focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-primary mb-2">Connect Reviews</h2>
                  <p className="text-gray-600">Link your Booking.com listing</p>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-xl flex items-start space-x-3">
                    <ArrowRight className="w-5 h-5 text-blue-500 mt-0.5" />
                    <p className="text-sm text-blue-700">
                      We'll import all your existing reviews and keep them synchronized automatically.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bookingUrl" className="text-gray-700">Booking.com Property URL</Label>
                    <Input 
                      id="bookingUrl" 
                      name="bookingUrl" 
                      value={propertyData.bookingUrl} 
                      onChange={handleInputChange} 
                      className="rounded-xl border-2 focus:border-primary focus:ring-primary"
                      placeholder="https://www.booking.com/hotel/..."
                      required 
                    />
                  </div>
                </div>
              </>
            )}
            <Button 
              type="submit"
              className={`${buttonClasses} w-full text-xl py-6 rounded-xl shadow-[0_4px_0_0_#2563eb] flex items-center justify-center`}
            >
              {step === 1 ? (
                <div className="flex items-center justify-center">
                  Continue
                  <ArrowRight className="ml-2 w-5 h-5" />
                </div>
              ) : (
                'Connect Property'
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

