"use client"

import { useState, useEffect } from "react"
import { ReviewsTable } from "@/components/reviews-table"
import { Input } from "@/components/ui/input"
import { ReviewTabs } from "@/components/ui/review-tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HeroHighlight } from "@/components/ui/hero-highlight"
import { hotelsApi } from "@/services/api"
import { Toaster } from "sonner"

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
  const [hotels, setHotels] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const data = await hotelsApi.getHotels()
        setHotels(data)
      } catch (error) {
        console.error('Error fetching hotels:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHotels()
  }, [])

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
          <ReviewTabs value={responseStatus} onValueChange={setResponseStatus} />
        </div>

        <div className="flex flex-wrap gap-4 mb-4">
          <Input
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[200px]"
          />

          <Select value={hotel} onValueChange={setHotel}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {hotels.map((hotel) => (
                <SelectItem key={hotel._id} value={hotel._id}>
                  {hotel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={platform} onValueChange={setPlatform}>
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

          <Select value={ratingFilter} onValueChange={setRatingFilter}>
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

        <ReviewsTable
          searchQuery={searchQuery}
          responseStatus={responseStatus}
          platform={platform}
          ratingFilter={ratingFilter}
          resultsPerPage={parseInt(resultsPerPage)}
          setPlatform={setPlatform}
          setRatingFilter={setRatingFilter}
          setResultsPerPage={setResultsPerPage}
          setSearchQuery={setSearchQuery}
          property={hotel}
          setProperty={setHotel}
        />
      </HeroHighlight>
    </div>
  )
}