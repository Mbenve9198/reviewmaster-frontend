"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PlusCircle, Send, Settings } from 'lucide-react'
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from 'next/navigation'
import { AddHotelModal } from "@/components/add-hotel-modal"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { ResponseModal } from "@/components/response-modal"
import { getCookie } from "@/lib/utils"

interface Hotel {
  _id: string
  name: string
  type: string
  description: string
}

type ResponseStyle = 'professional' | 'friendly'
type ResponseLength = 'short' | 'medium' | 'long'

export default function HomePage() {
  const [selectedHotel, setSelectedHotel] = useState("")
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [review, setReview] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [isAddHotelModalOpen, setIsAddHotelModalOpen] = useState(false)
  const [newHotelName, setNewHotelName] = useState("")
  const [newHotelType, setNewHotelType] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [step, setStep] = useState(1)
  const totalSteps = 3
  const [description, setDescription] = useState("")
  const [managerSignature, setManagerSignature] = useState("")
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false)
  const [responseStyle, setResponseStyle] = useState<ResponseStyle>('professional')
  const [responseLength, setResponseLength] = useState<ResponseLength>('medium')

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/hotels', {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${getCookie('token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch hotels');
        }

        const data = await response.json();
        console.log('Hotels fetched:', data); // Per debug
        setHotels(data);
      } catch (error) {
        console.error('Error fetching hotels:', error);
      }
    };

    fetchHotels();
  }, []); // Esegui solo al mount del componente

  const handleAddHotel = () => {
    setIsAddHotelModalOpen(true)
  }

  const handleSettingsClick = () => {
    if (selectedHotel) {
      localStorage.setItem('selectedHotel', selectedHotel)
      router.push('/hotel-settings')
    }
  }

  const handleGenerateResponse = async () => {
    if (!selectedHotel || !review.trim()) return;
    setIsLoading(true);
    setError(null);
    setAiResponse("");
    
    try {
      const token = getCookie('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:3000/api/reviews/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hotelId: selectedHotel,
          review: review,
          rating: 5,
          reviewerName: "Guest",
          platform: "booking",
          responseSettings: {
            style: responseStyle,
            length: responseLength
          }
        }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      setAiResponse(data.response);
      setIsResponseModalOpen(true);

      // Aggiorna i crediti usati
      const statsResponse = await fetch('http://localhost:3000/api/users/stats', {
        headers: {
          'Authorization': `Bearer ${getCookie('token')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        // Aggiorna i crediti nel componente padre o nel context se necessario
      }

    } catch (error) {
      console.error('Error generating response:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setIsResponseModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonClasses = "relative bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all active:top-[2px] active:shadow-[0_0_0_0_#2563eb] disabled:opacity-50 disabled:hover:bg-primary disabled:active:top-0 disabled:active:shadow-[0_4px_0_0_#2563eb]"

  const isStepValid = () => {
    switch (step) {
      case 1:
        return newHotelName && newHotelType
      case 2:
        return description.length > 0
      case 3:
        return managerSignature.length > 0
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    // La logica esistente per salvare l'hotel, ma con tutti i campi
    // ... 
  }

  const handleHotelAdded = async () => {
    // Ricarica la lista degli hotel
    const token = localStorage.getItem('token')
    const response = await fetch('http://localhost:3000/api/hotels', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    })
    const updatedHotels = await response.json()
    setHotels(updatedHotels)
  }

  return (
    <div className="min-h-screen bg-white py-12">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Manual Responses</h1>
        <p className="text-xl text-gray-600">Create personalized responses to your guest reviews with AI assistance</p>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <Select value={selectedHotel} onValueChange={setSelectedHotel}>
            <SelectTrigger className="w-[200px] text-xl border-2">
              <SelectValue placeholder="Select hotel" />
            </SelectTrigger>
            <SelectContent>
              {hotels.map((hotel) => (
                <SelectItem key={hotel._id} value={hotel._id} className="text-lg">
                  {hotel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleSettingsClick}
            disabled={!selectedHotel}
            className={`${buttonClasses} text-xl p-4 rounded-full shadow-[0_4px_0_0_#2563eb]`}
            aria-label="Hotel Settings"
          >
            <Settings className="w-6 h-6" />
          </Button>
          <Button
            onClick={handleAddHotel}
            className={`${buttonClasses} text-xl py-6 px-8 rounded-2xl shadow-[0_4px_0_0_#2563eb] flex items-center gap-2`}
          >
            <PlusCircle className="w-6 h-6" />
            Add Hotel
          </Button>
        </div>

        {/* Review Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-12"
        >
          <div className="flex items-start gap-8 w-full max-w-3xl">
            <div className="w-48 h-48 flex-shrink-0">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Animation%20-%201735475353995%20(1)-gb0Iqm2o4UfOtqKV9ci6WaYC8gW8R8.gif"
                alt="ReviewMaster Assistant"
                width={192}
                height={192}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Enter Guest Review</h2>
                
                {/* Response Options */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 font-medium">Tone of voice</p>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setResponseStyle('professional')}
                        className={`px-6 py-3 text-base rounded-xl transition-all ${
                          responseStyle === 'professional'
                            ? 'bg-primary text-primary-foreground shadow-[0_2px_0_0_#1d6d05] hover:bg-primary/90'
                            : 'bg-gray-100 text-gray-600 shadow-[0_2px_0_0_#d1d5db] hover:bg-gray-200'
                        }`}
                      >
                        Professional
                      </Button>
                      <Button
                        onClick={() => setResponseStyle('friendly')}
                        className={`px-6 py-3 text-base rounded-xl transition-all ${
                          responseStyle === 'friendly'
                            ? 'bg-primary text-primary-foreground shadow-[0_2px_0_0_#1d6d05] hover:bg-primary/90'
                            : 'bg-gray-100 text-gray-600 shadow-[0_2px_0_0_#d1d5db] hover:bg-gray-200'
                        }`}
                      >
                        Friendly
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 font-medium">Length</p>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setResponseLength('short')}
                        className={`px-6 py-3 text-base rounded-xl transition-all ${
                          responseLength === 'short'
                            ? 'bg-primary text-primary-foreground shadow-[0_2px_0_0_#1d6d05] hover:bg-primary/90'
                            : 'bg-gray-100 text-gray-600 shadow-[0_2px_0_0_#d1d5db] hover:bg-gray-200'
                        }`}
                      >
                        Short
                      </Button>
                      <Button
                        onClick={() => setResponseLength('medium')}
                        className={`px-6 py-3 text-base rounded-xl transition-all ${
                          responseLength === 'medium'
                            ? 'bg-primary text-primary-foreground shadow-[0_2px_0_0_#1d6d05] hover:bg-primary/90'
                            : 'bg-gray-100 text-gray-600 shadow-[0_2px_0_0_#d1d5db] hover:bg-gray-200'
                        }`}
                      >
                        Medium
                      </Button>
                      <Button
                        onClick={() => setResponseLength('long')}
                        className={`px-6 py-3 text-base rounded-xl transition-all ${
                          responseLength === 'long'
                            ? 'bg-primary text-primary-foreground shadow-[0_2px_0_0_#1d6d05] hover:bg-primary/90'
                            : 'bg-gray-100 text-gray-600 shadow-[0_2px_0_0_#d1d5db] hover:bg-gray-200'
                        }`}
                      >
                        Long
                      </Button>
                    </div>
                  </div>
                </div>

                <Textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="p-6 text-xl rounded-2xl border-2 border-gray-200 focus:border-primary focus:ring-primary min-h-[200px]"
                  placeholder="Paste the guest review here..."
                />
                
                <Button
                  onClick={handleGenerateResponse}
                  disabled={!selectedHotel || !review.trim() || isLoading}
                  className={`${buttonClasses} w-full text-2xl py-8 rounded-2xl shadow-[0_4px_0_0_#2563eb] flex items-center justify-center gap-2`}
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Send className="w-6 h-6" />
                      </motion.div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Send className="w-6 h-6" />
                      Generate AI Response
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <ResponseModal
          isOpen={isResponseModalOpen}
          onClose={() => setIsResponseModalOpen(false)}
          response={error || aiResponse}
          isError={!!error}
        />
      </div>
      <AddHotelModal
        isOpen={isAddHotelModalOpen}
        onClose={() => setIsAddHotelModalOpen(false)}
        onHotelAdded={handleHotelAdded}
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white max-w-4xl h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-4xl font-bold text-center">Add New Hotel</DialogTitle>
            <DialogDescription className="text-xl text-center">
              Let's set up your new property
            </DialogDescription>
          </DialogHeader>

          <div className="mt-8">
            <div className="max-w-3xl mx-auto">
              {/* Progress bar come nell'onboarding */}
              <Progress value={(step / totalSteps) * 100} className="h-3 mb-8" />

              {/* Step 1: Hotel Name & Type */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xl font-bold">Property Name</label>
                    <Input
                      value={newHotelName}
                      onChange={(e) => setNewHotelName(e.target.value)}
                      className="p-6 text-xl rounded-2xl border-2 border-gray-200 focus:border-[#58CC02] focus:ring-[#58CC02]"
                      placeholder="Enter your property name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xl font-bold">Property Type</label>
                    <Select value={newHotelType} onValueChange={setNewHotelType}>
                      <SelectTrigger className="p-6 text-xl rounded-2xl border-2">
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hotel">Hotel</SelectItem>
                        <SelectItem value="b&b">B&B</SelectItem>
                        <SelectItem value="resort">Resort</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Step 2: Description */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xl font-bold">Property Description</label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="p-6 text-xl rounded-2xl border-2 min-h-[200px]"
                      placeholder="Describe your property..."
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Manager Details */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xl font-bold">Manager Signature</label>
                    <Input
                      value={managerSignature}
                      onChange={(e) => setManagerSignature(e.target.value)}
                      className="p-6 text-xl rounded-2xl border-2"
                      placeholder="Your name and title"
                    />
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-end mt-8 gap-4">
                {step > 1 && (
                  <Button onClick={() => setStep(step - 1)} variant="outline" className="text-xl py-6 px-8">
                    Back
                  </Button>
                )}
                <Button
                  onClick={step === totalSteps ? handleSubmit : () => setStep(step + 1)}
                  className="text-xl py-6 px-8"
                  disabled={!isStepValid()}
                >
                  {step === totalSteps ? "Complete" : "Continue"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

