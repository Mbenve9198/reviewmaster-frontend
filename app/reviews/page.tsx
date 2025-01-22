"use client"

import { useState, useEffect } from "react"
import { ReviewsTable } from "@/components/reviews-table"
import { Input } from "@/components/ui/input"
import { ReviewTabs } from "@/components/ui/review-tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HeroHighlight } from "@/components/ui/hero-highlight"
import { Toaster } from "sonner"
import { getCookie } from "@/lib/utils"
import useReviews from "@/store/useReviews"

interface Hotel {
  _id: string
  name: string
}

export default function ReviewsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { setFilters } = useReviews()

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const token = getCookie('token')
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        })
        
        if (!response.ok) throw new Error('Failed to fetch hotels')
        
        const data = await response.json()
        setHotels(data)

        // If we have hotels, set the first one as selected
        if (data.length > 0) {
          setFilters({ hotelId: data[0]._id })
        }
      } catch (error) {
        console.error('Error fetching hotels:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHotels()
  }, [])

  const handleFilterChange = (type: string, value: string) => {
    switch (type) {
      case 'hotel':
        setFilters({ hotelId: value })
        break
      case 'platform':
        setFilters({ platform: value })
        break
      case 'responseStatus':
        setFilters({ responseStatus: value })
        break
      case 'rating':
        setFilters({ rating: value })
        break
      case 'search':
        setSearchQuery(value)
        setFilters({ searchQuery: value })
        break
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex flex-col h-full">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Reviews</h1>
      </div>

      <HeroHighlight containerClassName="flex-grow overflow-auto">
        <div className="mb-8 w-full overflow-x-auto">
          <ReviewTabs 
            value="all" 
            onValueChange={(value) => handleFilterChange('responseStatus', value)} 
          />
        </div>

        <div className="flex flex-wrap gap-4 mb-4">
          <Input
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-[200px]"
          />

          <Select 
            defaultValue={hotels[0]?._id} 
            onValueChange={(value) => handleFilterChange('hotel', value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent>
              {hotels.map((hotel) => (
                <SelectItem key={hotel._id} value={hotel._id}>
                  {hotel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            defaultValue="all" 
            onValueChange={(value) => handleFilterChange('platform', value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="booking">Booking.com</SelectItem>
              <SelectItem value="tripadvisor">TripAdvisor</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            defaultValue="all" 
            onValueChange={(value) => handleFilterChange('rating', value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars & Up</SelectItem>
              <SelectItem value="4">4 Stars & Up</SelectItem>
              <SelectItem value="3">3 Stars & Up</SelectItem>
              <SelectItem value="2">2 Stars & Up</SelectItem>
              <SelectItem value="1">1 Star & Up</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ReviewsTable />
      </HeroHighlight>
    </div>
  )
}