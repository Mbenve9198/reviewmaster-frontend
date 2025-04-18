"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Save, Building2, MessageSquare, HelpCircle } from 'lucide-react'
import Image from "next/image"
import { useRouter } from 'next/navigation'
import { motion } from "framer-motion"
import { getCookie } from "@/lib/utils"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Define the Hotel interface
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
  const [activeTab, setActiveTab] = useState("basic")
  const [isSaving, setIsSaving] = useState(false)

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
        
        // Select first hotel by default or restore last selected hotel
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
        toast.error('Error loading hotels')
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

    setIsSaving(true)
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

      if (!response.ok) throw new Error('Error updating hotel settings')
      
      toast.success('Hotel settings updated successfully', {
        duration: 2000,
      })
    } catch (error) {
      console.error('Error updating hotel:', error)
      toast.error('Error updating settings')
    } finally {
      setIsLoading(false)
      setIsSaving(false)
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
    <TooltipProvider>
      {/* Modern gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#FAFAFB] via-[#F0F0F2] to-[#FAFAFB] backdrop-blur-sm" />
      
      <div className="flex flex-col px-10 md:pl-[96px] py-12 min-h-screen">
        <div className="max-w-[1400px] mx-auto w-full space-y-12">
          {/* Header aligned to the left */}
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue-600 to-blue-400" />
              <h1 className="text-3xl sm:text-4xl font-semibold bg-gradient-to-b from-blue-800 to-blue-600 bg-clip-text text-transparent">
                Settings
              </h1>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <p className="text-base">
                Manage your property settings and preferences
              </p>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                {hotels.length} Properties
              </span>
            </div>
          </div>

          {/* Card container */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
            {/* Consolidated hotel selection */}
            <div className="p-6 border-b border-gray-100">
              <Select value={selectedHotel} onValueChange={handleHotelChange}>
                <SelectTrigger className="w-full p-4 text-lg rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-primary bg-white" aria-label="Select a hotel">
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
              <div className="p-8">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="flex">
                    <TabsTrigger
                      value="basic"
                      className="px-4 py-2 text-lg font-medium text-gray-600 hover:text-blue-600 transition-colors data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 flex items-center"
                    >
                      <Building2 className="mr-2 w-5 h-5" />
                      Basic Information
                    </TabsTrigger>
                    
                    <TabsTrigger
                      value="response"
                      className="px-4 py-2 text-lg font-medium text-gray-600 hover:text-blue-600 transition-colors data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 flex items-center"
                    >
                      <MessageSquare className="mr-2 w-5 h-5" />
                      Response Settings
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="mt-6">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Hotel Name</label>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="w-4 h-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>The name of your property as it will appear to guests</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          value={hotelData.name}
                          onChange={(e) => setHotelData({ ...hotelData, name: e.target.value })}
                          className="w-full p-4 text-lg rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-primary bg-white transition-all duration-200 hover:border-primary/50"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <Textarea
                          value={hotelData.description}
                          onChange={(e) => setHotelData({ ...hotelData, description: e.target.value })}
                          className="w-full p-4 text-lg rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-primary min-h-[150px] bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Manager Signature</label>
                        <Input
                          value={hotelData.signature}
                          onChange={(e) => setHotelData({ ...hotelData, signature: e.target.value })}
                          className="w-full p-4 text-lg rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-primary bg-white"
                        />
                      </div>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="response" className="mt-6">
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ duration: 0.5 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Response Style</label>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="w-4 h-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Choose how formal or casual your responses should be</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
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
                          <SelectTrigger className="w-full p-4 text-lg rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-primary bg-white transition-all duration-200 hover:border-primary/50" aria-label="Select response style">
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="friendly">Friendly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Response Length</label>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="w-4 h-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Define how detailed your responses should be</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
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
                          <SelectTrigger className="w-full p-4 text-lg rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-primary bg-white transition-all duration-200 hover:border-primary/50" aria-label="Select response length">
                            <SelectValue placeholder="Select length" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="short">Short</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="long">Long</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </motion.div>
                  </TabsContent>
                </Tabs>

                <motion.div 
                  className="flex justify-end pt-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Button
                    onClick={handleSave}
                    disabled={isLoading || isSaving}
                    className={`
                      px-8 py-4 bg-primary text-white font-bold text-lg rounded-xl
                      transition-all duration-300 flex items-center gap-2
                      ${isSaving ? 'bg-green-500' : 'bg-primary'}
                      hover:bg-primary/90 hover:translate-y-[2px]
                      disabled:opacity-50 disabled:hover:translate-y-0
                      focus:ring-2 focus:ring-primary focus:ring-offset-2
                    `}
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-2 border-white"></div>
                    ) : isSaving ? (
                      <>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-white"
                        >
                          ✓
                        </motion.div>
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

