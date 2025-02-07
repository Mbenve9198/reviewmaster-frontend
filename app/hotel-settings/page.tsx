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
import { Save, Building2, MessageSquare } from 'lucide-react'
import Image from "next/image"
import { useRouter } from 'next/navigation'
import { motion } from "framer-motion"
import { getCookie } from "@/lib/utils"
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
  const [activeTab, setActiveTab] = useState("basic")

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
        toast.error('Errore nel caricamento degli hotel')
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
      toast.error('Seleziona prima un hotel')
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

      if (!response.ok) throw new Error('Errore durante l\'aggiornamento')
      
      toast.success('Impostazioni hotel aggiornate con successo')
    } catch (error) {
      console.error('Error updating hotel:', error)
      toast.error('Errore nell\'aggiornamento delle impostazioni')
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
      {/* Sfondo gradient moderno */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#FAFAFB] via-[#F0F0F2] to-[#FAFAFB] backdrop-blur-sm" />
      
      <div className="flex flex-col px-10 md:pl-[96px] py-12 min-h-screen">
        <div className="max-w-[1400px] mx-auto w-full space-y-12">
          {/* Header allineato a sinistra */}
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue-600 to-blue-400" />
              <h1 className="text-3xl sm:text-4xl font-semibold bg-gradient-to-b from-blue-800 to-blue-600 bg-clip-text text-transparent">
                Impostazioni
              </h1>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <p className="text-base">
                Gestisci le impostazioni e le preferenze della tua proprietà
              </p>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                {hotels.length} Proprietà
              </span>
            </div>
          </div>

          {/* Card contenitore */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
            {/* Sezione di selezione dell'hotel (consolidata) */}
            <div className="p-6 border-b border-gray-100">
              <Select value={selectedHotel} onValueChange={handleHotelChange}>
                <SelectTrigger className="w-full p-4 text-lg rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-primary bg-white" aria-label="Seleziona un hotel">
                  <SelectValue placeholder="Seleziona un hotel" />
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
              <div className="p-8 space-y-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col sm:flex-row gap-8">
                  {/* Navigazione delle Tabs */}
                  <div className="sm:w-64 pt-6">
                    <TabsList className="flex flex-col w-full bg-transparent space-y-2">
                      <TabsTrigger 
                        value="basic"
                        className="w-full flex items-center gap-3 p-4 bg-white hover:bg-gray-50 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-xl border-2 border-transparent data-[state=active]:border-blue-200 transition-all text-left"
                      >
                        <Building2 className="w-5 h-5 text-gray-500 data-[state=active]:text-blue-600" />
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Informazioni di Base</span>
                          <span className="text-xs text-gray-500">Dettagli e contatti</span>
                        </div>
                      </TabsTrigger>
                      
                      <TabsTrigger 
                        value="response"
                        className="w-full flex items-center gap-3 p-4 bg-white hover:bg-gray-50 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-xl border-2 border-transparent data-[state=active]:border-blue-200 transition-all text-left"
                      >
                        <MessageSquare className="w-5 h-5 text-gray-500 data-[state=active]:text-blue-600" />
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Impostazioni Risposta</span>
                          <span className="text-xs text-gray-500">Preferenze risposta AI</span>
                        </div>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Contenuto delle Tabs */}
                  <div className="flex-1">
                    <TabsContent value="basic" className="mt-0 space-y-6 bg-white rounded-xl border-2 border-gray-100 p-6">
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">Nome Hotel</label>
                          <Input
                            value={hotelData.name}
                            onChange={(e) => setHotelData({ ...hotelData, name: e.target.value })}
                            className="w-full p-4 text-lg rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-primary bg-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">Descrizione</label>
                          <Textarea
                            value={hotelData.description}
                            onChange={(e) => setHotelData({ ...hotelData, description: e.target.value })}
                            className="w-full p-4 text-lg rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-primary min-h-[150px] bg-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">Firma del Manager</label>
                          <Input
                            value={hotelData.signature}
                            onChange={(e) => setHotelData({ ...hotelData, signature: e.target.value })}
                            className="w-full p-4 text-lg rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-primary bg-white"
                          />
                        </div>
                      </motion.div>
                    </TabsContent>

                    <TabsContent value="response" className="mt-0 space-y-6 bg-white rounded-xl border-2 border-gray-100 p-6">
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">Stile Risposta</label>
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
                            <SelectTrigger className="w-full p-4 text-lg rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-primary bg-white" aria-label="Seleziona stile risposta">
                              <SelectValue placeholder="Seleziona stile" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="professional">Professional</SelectItem>
                              <SelectItem value="friendly">Friendly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">Lunghezza Risposta</label>
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
                            <SelectTrigger className="w-full p-4 text-lg rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-primary bg-white" aria-label="Seleziona lunghezza risposta">
                              <SelectValue placeholder="Seleziona lunghezza" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="short">Corta</SelectItem>
                              <SelectItem value="medium">Media</SelectItem>
                              <SelectItem value="long">Lunga</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </motion.div>
                    </TabsContent>

                    {/* Bottone di salvataggio */}
                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-8 py-4 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-xl transition-all duration-300 flex items-center gap-2 shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px]"
                      >
                        {isLoading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-2 border-white"></div>
                        ) : (
                          <Save className="w-5 h-5" />
                        )}
                        Salva modifiche
                      </Button>
                    </div>
                  </div>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

