"use client"

import { useState, useEffect } from "react"
import { ReviewsTable } from "@/components/reviews-table"
import { Input } from "@/components/ui/input"
import { ReviewTabs } from "@/components/ui/review-tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toaster } from "sonner"
import { getCookie } from "@/lib/utils"
import useReviews from "@/store/useReviews"

interface Hotel {
  _id: string
  name: string
}

export default function ReviewsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [hotel, setHotel] = useState("all")
  const [responseStatus, setResponseStatus] = useState("all")
  const [platform, setPlatform] = useState("all")
  const [resultsPerPage, setResultsPerPage] = useState("50")
  const [ratingFilter, setRatingFilter] = useState("all")
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
          setHotel(data[0]._id)
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
        setHotel(value)
        setFilters({ hotelId: value })
        break
      case 'platform':
        setPlatform(value)
        setFilters({ platform: value })
        break
      case 'responseStatus':
        setResponseStatus(value)
        setFilters({ responseStatus: value })
        break
      case 'rating':
        setRatingFilter(value)
        setFilters({ rating: value })
        break
      case 'search':
        setSearchQuery(value)
        setFilters({ searchQuery: value })
        break
    }
  }

  const handleResultsPerPageChange = (value: string) => {
    setResultsPerPage(value)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reviews</h1>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="bg-white p-4 rounded-xl shadow-sm border mb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-[300px]">
              <Input
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-4 pr-10 h-9 rounded-full border-gray-200 focus:border-primary focus:ring-primary"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>

            <Select 
              value={hotel}
              onValueChange={(value) => handleFilterChange('hotel', value)}
            >
              <SelectTrigger className="h-9 w-[160px] rounded-lg border-gray-200 focus:border-primary focus:ring-primary bg-white">
                <SelectValue placeholder="Property" />
              </SelectTrigger>
              <SelectContent>
                {hotels.map((h) => (
                  <SelectItem key={h._id} value={h._id}>
                    {h.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={platform}
              onValueChange={(value) => handleFilterChange('platform', value)}
            >
              <SelectTrigger className="h-9 w-[160px] rounded-lg border-gray-200 focus:border-primary focus:ring-primary bg-white">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="booking">Booking.com</SelectItem>
                <SelectItem value="tripadvisor">TripAdvisor</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={ratingFilter}
              onValueChange={(value) => handleFilterChange('rating', value)}
            >
              <SelectTrigger className="h-9 w-[160px] rounded-lg border-gray-200 focus:border-primary focus:ring-primary bg-white">
                <SelectValue placeholder="Rating" />
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

            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 rounded-lg border-gray-200 hover:bg-gray-50 ml-auto"
              onClick={() => {
                setSearchQuery("")
                setHotel("all")
                setPlatform("all")
                setRatingFilter("all")
                setFilters({
                  hotelId: "all",
                  platform: "all",
                  rating: "all",
                  searchQuery: ""
                })
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <ReviewsTable
            searchQuery={searchQuery}
            responseStatus={responseStatus}
            platform={platform}
            ratingFilter={ratingFilter}
            resultsPerPage={parseInt(resultsPerPage)}
            property={hotel}
            onRefresh={() => {/* refresh logic */}}
            onResultsPerPageChange={handleResultsPerPageChange}
          />
        </div>
      </div>
    </div>
  )
}