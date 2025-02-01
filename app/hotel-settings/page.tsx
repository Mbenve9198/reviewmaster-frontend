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
import { HandWrittenTitle } from "@/components/ui/hand-writing-text"
import { Tiles } from "@/components/ui/tiles"

// Aggiungiamo l'interfaccia per il tipo Hotel
interface Hotel {
  _id: string;
  name: string;
  type: string;
  description: string;
  signature: string;
}

export default function HotelSettingsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [selectedHotel, setSelectedHotel] = useState("")
  const [hotelData, setHotelData] = useState({
    name: "",
    type: "",
    description: "",
    managerSignature: ""
  })
  const [hotels, setHotels] = useState<Hotel[]>([])

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels`, {
          headers: {
            'Authorization': `Bearer ${getCookie('token')}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('Failed to fetch hotels')
        }

        const data: Hotel[] = await response.json()
        setHotels(data)
        
        // Se c'è un hotel selezionato nella home page, selezionalo qui
        const selectedHotelFromHome = localStorage.getItem('selectedHotel')
        if (selectedHotelFromHome) {
          setSelectedHotel(selectedHotelFromHome)
          const hotel = data.find((h: Hotel) => h._id === selectedHotelFromHome)
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels/${selectedHotel}`, {
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
      const updatedHotelsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels`, {
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
    <>
      <Tiles 
        className="fixed inset-0 -z-10" 
        rows={100}
        cols={20}
        tileSize="md"
      />
      
      <div className="min-h-screen py-12 md:pl-[100px]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-8">
            <Button
              onClick={() => router.push('/')}
              className={buttonClasses}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </div>

          <HandWrittenTitle 
            title="Settings"
            subtitle="Edit your property"
          />

          <div className="mt-12 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Hotel Name</label>
                <Input
                  value={hotelData.name}
                  onChange={(e) => setHotelData({ ...hotelData, name: e.target.value })}
                  className="w-full bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={hotelData.description}
                  onChange={(e) => setHotelData({ ...hotelData, description: e.target.value })}
                  className="w-full min-h-[100px] bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Manager Signature</label>
                <Input
                  value={hotelData.managerSignature}
                  onChange={(e) => setHotelData({ ...hotelData, managerSignature: e.target.value })}
                  className="w-full bg-white"
                />
              </div>

              <Button
                onClick={handleSave}
                className="w-full bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-xl shadow-[0_4px_0_0_#1e40af] transition-all active:top-[2px] active:shadow-[0_0_0_0_#1e40af] relative"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

