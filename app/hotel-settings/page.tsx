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
import { Save } from 'lucide-react'
import Image from "next/image"
import { useRouter } from 'next/navigation'
import { motion } from "framer-motion"
import { getCookie } from "@/lib/utils"
import { HandWrittenTitle } from "@/components/ui/hand-writing-text"
import { Tiles } from "@/components/ui/tiles"
import { toast } from "sonner"

// Aggiungiamo l'interfaccia per il tipo Hotel
interface Hotel {
  _id: string;
  name: string;
  type: string;
  description: string;
  signature: string;
  responseSettings: {
    style: 'professional' | 'friendly';
    length: 'short' | 'medium' | 'long';
  };
}

export default function HotelSettingsPage() {
  const router = useRouter()
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [selectedHotel, setSelectedHotel] = useState<string>("")
  const [hotelData, setHotelData] = useState({
    name: "",
    type: "",
    description: "",
    signature: "",
    responseSettings: {
      style: "professional",
      length: "medium"
    }
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const token = getCookie('token')
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        })
        const data = await response.json()
        setHotels(data)
        
        // Seleziona il primo hotel di default o l'ultimo selezionato
        const lastSelectedHotel = localStorage.getItem('lastSelectedHotel')
        if (lastSelectedHotel && data.some((hotel: Hotel) => hotel._id === lastSelectedHotel)) {
          setSelectedHotel(lastSelectedHotel)
          const hotel = data.find((h: Hotel) => h._id === lastSelectedHotel)
          setHotelData({
            name: hotel.name,
            type: hotel.type,
            description: hotel.description || "",
            signature: hotel.signature || "",
            responseSettings: hotel.responseSettings || {
              style: "professional",
              length: "medium"
            }
          })
        } else if (data.length > 0) {
          setSelectedHotel(data[0]._id)
          setHotelData({
            name: data[0].name,
            type: data[0].type,
            description: data[0].description || "",
            signature: data[0].signature || "",
            responseSettings: data[0].responseSettings || {
              style: "professional",
              length: "medium"
            }
          })
        }
      } catch (error) {
        console.error('Error fetching hotels:', error)
        toast.error('Failed to load hotels')
      } finally {
        setIsLoading(false)
      }
    }

    fetchHotels()
  }, [])

  const handleHotelChange = async (hotelId: string) => {
    setSelectedHotel(hotelId)
    localStorage.setItem('lastSelectedHotel', hotelId)
    const hotel = hotels.find(h => h._id === hotelId)
    if (hotel) {
      setHotelData({
        name: hotel.name,
        type: hotel.type,
        description: hotel.description || "",
        signature: hotel.signature || "",
        responseSettings: hotel.responseSettings || {
          style: "professional",
          length: "medium"
        }
      })
    }
  }

  const handleSave = async () => {
    if (!selectedHotel) {
      toast.error('Please select a hotel first')
      return
    }

    setIsLoading(true)
    try {
      const token = getCookie('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels/${selectedHotel}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(hotelData)
      })

      if (!response.ok) throw new Error('Failed to update hotel')
      
      toast.success('Hotel settings updated successfully')
    } catch (error) {
      console.error('Error updating hotel:', error)
      toast.error('Failed to update hotel settings')
    } finally {
      setIsLoading(false)
    }
  }

  const buttonClasses = "relative bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all active:top-[2px] active:shadow-[0_0_0_0_#2563eb] disabled:opacity-50 disabled:hover:bg-primary disabled:active:top-0 disabled:active:shadow-[0_4px_0_0_#2563eb]"

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <Tiles 
        className="fixed inset-0 -z-10" 
        rows={100}
        cols={20}
        tileSize="md"
      />
      
      <div className="min-h-screen py-12 md:pl-[100px]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <HandWrittenTitle 
            title="Settings"
            subtitle="Edit your property"
          />

          <div className="mt-8 mb-12">
            <Select value={selectedHotel} onValueChange={handleHotelChange}>
              <SelectTrigger className="w-full p-6 text-xl rounded-xl border-2">
                <SelectValue placeholder="Select a hotel" />
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

          {selectedHotel && (
            <div className="group relative overflow-hidden bg-white rounded-3xl p-8 border border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded-bl-full transform transition-transform duration-300 group-hover:scale-110" />
              
              <div className="relative space-y-6">
                <div>
                  <label className="text-xl font-bold text-gray-800 mb-2 block">Hotel Name</label>
                  <Input
                    value={hotelData.name}
                    onChange={(e) => setHotelData({ ...hotelData, name: e.target.value })}
                    className="w-full p-6 text-xl rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-primary bg-white"
                  />
                </div>

                <div>
                  <label className="text-xl font-bold text-gray-800 mb-2 block">Description</label>
                  <Textarea
                    value={hotelData.description}
                    onChange={(e) => setHotelData({ ...hotelData, description: e.target.value })}
                    className="w-full p-6 text-xl rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-primary min-h-[200px] bg-white"
                  />
                </div>

                <div>
                  <label className="text-xl font-bold text-gray-800 mb-2 block">Manager Signature</label>
                  <Input
                    value={hotelData.signature}
                    onChange={(e) => setHotelData({ ...hotelData, signature: e.target.value })}
                    className="w-full p-6 text-xl rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-primary bg-white"
                  />
                </div>

                <div>
                  <label className="text-xl font-bold text-gray-800 mb-2 block">Default Response Settings</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-1 block">Response Style</label>
                      <Select
                        value={hotelData.responseSettings.style}
                        onValueChange={(value) => setHotelData({
                          ...hotelData,
                          responseSettings: {
                            ...hotelData.responseSettings,
                            style: value as 'professional' | 'friendly'
                          }
                        })}
                      >
                        <SelectTrigger className="w-full p-6 text-xl rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-primary bg-white">
                          <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-1 block">Response Length</label>
                      <Select
                        value={hotelData.responseSettings.length}
                        onValueChange={(value) => setHotelData({
                          ...hotelData,
                          responseSettings: {
                            ...hotelData.responseSettings,
                            length: value as 'short' | 'medium' | 'long'
                          }
                        })}
                      >
                        <SelectTrigger className="w-full p-6 text-xl rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-primary bg-white">
                          <SelectValue placeholder="Select length" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Short</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="long">Long</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-xl py-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px]"
                >
                  <Save className="w-5 h-5" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

