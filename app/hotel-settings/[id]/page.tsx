"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { ChevronLeft, Save } from 'lucide-react'

interface HotelData {
  name: string
  type: string
  description: string
  managerName: string
  signature: string
}

export default function HotelSettingsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hotelData, setHotelData] = useState<HotelData | null>(null)

  const buttonClasses = "relative bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all active:top-[2px] active:shadow-[0_0_0_0_#2563eb] disabled:opacity-50 disabled:hover:bg-primary disabled:active:top-0 disabled:active:shadow-[0_4px_0_0_#2563eb]"

  useEffect(() => {
    const fetchHotelData = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3000/api/hotels/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('Failed to fetch hotel data')
        }

        const data = await response.json()
        setHotelData(data)
      } catch (err) {
        console.error('Error fetching hotel:', err)
        setError(err instanceof Error ? err.message : 'Failed to load hotel data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchHotelData()
  }, [params.id])

  const handleSave = async () => {
    if (!hotelData) return

    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/api/hotels/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(hotelData),
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to update hotel')
      }

      router.push('/')
    } catch (err) {
      console.error('Error updating hotel:', err)
      setError(err instanceof Error ? err.message : 'Failed to update hotel')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!hotelData) return <div>No hotel found</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button
          onClick={() => router.push('/')}
          className={buttonClasses}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-3xl font-bold text-primary">Hotel Settings</h1>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Hotel Name</label>
          <Input
            value={hotelData.name}
            onChange={(e) => setHotelData({ ...hotelData, name: e.target.value })}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <Textarea
            value={hotelData.description}
            onChange={(e) => setHotelData({ ...hotelData, description: e.target.value })}
            className="w-full min-h-[100px]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Manager Signature</label>
          <Input
            value={hotelData.signature}
            onChange={(e) => setHotelData({ ...hotelData, signature: e.target.value })}
            className="w-full"
          />
        </div>

        <Button
          onClick={handleSave}
          className={`${buttonClasses} w-full`}
          disabled={isLoading}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}

