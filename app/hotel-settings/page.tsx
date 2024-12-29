"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, Save } from 'lucide-react'
import Image from "next/image"
import { useRouter } from 'next/navigation'
import { motion } from "framer-motion"
import { getCookie } from "@/lib/utils"

export default function HotelSettingsPage() {
  const router = useRouter()
  const [selectedHotel, setSelectedHotel] = useState("")
  const [hotelData, setHotelData] = useState({
    name: "",
    type: "",
    description: "",
    managerSignature: ""
  })
  const [hotels, setHotels] = useState([])

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/hotels', {
          headers: {
            'Authorization': `Bearer ${getCookie('token')}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('Failed to fetch hotels')
        }

        const data = await response.json()
        setHotels(data)
        
        // Se c'è un hotel selezionato nella home page, selezionalo qui
        const selectedHotelFromHome = localStorage.getItem('selectedHotel')
        if (selectedHotelFromHome) {
          setSelectedHotel(selectedHotelFromHome)
          const hotel = data.find(h => h._id === selectedHotelFromHome)
          if (hotel) {
            setHotelData({
              name: hotel.name,
              type: hotel.type,
              description: hotel.description,
              managerSignature: hotel.signature
            })
          }
        }
      } catch (err) {
        console.error('Error fetching hotels:', err)
      }
    }

    fetchHotels()
  }, [])

  const handleHotelSelect = (hotelId: string) => {
    setSelectedHotel(hotelId)
    const hotel = hotels.find(h => h._id === hotelId)
    if (hotel) {
      setHotelData({
        name: hotel.name,
        type: hotel.type,
        description: hotel.description,
        managerSignature: hotel.signature
      })
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setHotelData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/hotels/${selectedHotel}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getCookie('token')}`
        },
        credentials: 'include',
        body: JSON.stringify({
          name: hotelData.name,
          type: hotelData.type,
          description: hotelData.description,
          managerName: hotelData.managerSignature.split(',')[0].trim(),
          signature: hotelData.managerSignature,
          responseSettings: {
            style: 'professional',
            length: 'medium'
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error updating hotel')
      }

      // Aggiorna la lista degli hotel dopo il salvataggio
      const updatedHotelsResponse = await fetch('http://localhost:3000/api/hotels', {
        headers: {
          'Authorization': `Bearer ${getCookie('token')}`
        },
        credentials: 'include'
      })
      
      if (updatedHotelsResponse.ok) {
        const updatedHotels = await updatedHotelsResponse.json()
        setHotels(updatedHotels)
      }

      router.push('/')
    } catch (error) {
      console.error('Error saving hotel:', error)
    }
  }

  const buttonClasses = "relative bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all active:top-[2px] active:shadow-[0_0_0_0_#2563eb] disabled:opacity-50 disabled:hover:bg-primary disabled:active:top-0 disabled:active:shadow-[0_4px_0_0_#2563eb]"

  return (
    <div className="min-h-screen bg-white py-12">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Hotel Settings</h1>
        <p className="text-xl text-gray-600">Update your hotel information and preferences</p>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        {/* Hotel Selection */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <Button
            onClick={() => router.push('/')}
            className={`relative bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all active:top-[2px] active:shadow-[0_0_0_0_#2563eb] disabled:opacity-50 disabled:hover:bg-primary disabled:active:top-0 disabled:active:shadow-[0_4px_0_0_#2563eb] text-xl p-4 rounded-full shadow-[0_4px_0_0_#1d6d05]`}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Select value={selectedHotel} onValueChange={handleHotelSelect}>
            <SelectTrigger className="w-[300px] text-xl border-2">
              <SelectValue placeholder="Select hotel to edit" />
            </SelectTrigger>
            <SelectContent>
              {hotels.map((hotel) => (
                <SelectItem key={hotel._id} value={hotel._id} className="text-lg">
                  {hotel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedHotel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
          >
            <div className="flex items-start gap-8 w-full max-w-3xl">
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
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-xl font-bold text-gray-800">Hotel Name</label>
                    <Input
                      id="name"
                      value={hotelData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="p-6 text-xl rounded-2xl border-2 border-gray-200 focus:border-[#58CC02] focus:ring-[#58CC02]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="type" className="text-xl font-bold text-gray-800">Property Type</label>
                    <Select value={hotelData.type} onValueChange={(value) => handleInputChange('type', value)}>
                      <SelectTrigger className="p-6 text-xl rounded-2xl border-2 border-gray-200 focus:border-[#58CC02] focus:ring-[#58CC02]">
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

                  <div className="space-y-2">
                    <label htmlFor="description" className="text-xl font-bold text-gray-800">Description</label>
                    <Textarea
                      id="description"
                      value={hotelData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="p-6 text-xl rounded-2xl border-2 border-gray-200 focus:border-[#58CC02] focus:ring-[#58CC02] min-h-[200px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="managerSignature" className="text-xl font-bold text-gray-800">Manager Signature</label>
                    <Input
                      id="managerSignature"
                      value={hotelData.managerSignature}
                      onChange={(e) => handleInputChange('managerSignature', e.target.value)}
                      className="p-6 text-xl rounded-2xl border-2 border-gray-200 focus:border-[#58CC02] focus:ring-[#58CC02]"
                    />
                    <p className="text-sm text-gray-600 px-2">
                      This signature will appear at the end of your review responses
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleSave}
                  className={`relative bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all active:top-[2px] active:shadow-[0_0_0_0_#2563eb] disabled:opacity-50 disabled:hover:bg-primary disabled:active:top-0 disabled:active:shadow-[0_4px_0_0_#2563eb] w-full text-2xl py-8 rounded-2xl shadow-[0_4px_0_0_#1d6d05] flex items-center justify-center gap-2`}
                >
                  <Save className="w-6 h-6" />
                  Save Changes
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

