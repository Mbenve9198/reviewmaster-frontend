"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Send, Star, Search, X, RotateCw, Filter, Settings } from "lucide-react"
import { getCookie } from "@/lib/utils"
import { ResponseModal } from "@/components/response-modal"

interface Hotel {
  _id: string
  name: string
}

interface Review {
  _id: string
  platform: 'google' | 'booking' | 'tripadvisor' | 'manual'
  content: {
    text: string
    rating: number
    reviewerName: string
    language: string
    originalUrl?: string
  }
  response?: {
    text: string
    createdAt: Date
  }
  metadata: {
    originalCreatedAt: Date
  }
}

const PLATFORMS: {
  [key in Review['platform']]: {
    name: string;
    logo: string;
  }
} = {
  google: {
    name: "Google",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/google-my-bussines-logo-png_seeklogo-329002-OvZ3IZAlUXbrND3lwaiejZMlWivOUq.png"
  },
  booking: {
    name: "Booking.com",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bookingcom-1-84iWRXFhKw2uhSLPIc1eL4eZPSKnUv.svg"
  },
  tripadvisor: {
    name: "TripAdvisor",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Tripadvisor_logoset_solid_green-KkpUOomr3cNSTrXGcYHehXnIDlKdbg.svg"
  },
  manual: {
    name: "Manual",
    logo: "/manual-icon.png"
  }
}

export default function ReviewsPage() {
  const router = useRouter()
  const [selectedHotel, setSelectedHotel] = useState("")
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [platformFilter, setPlatformFilter] = useState<string>("all")
  const [ratingFilter, setRatingFilter] = useState<string>("all")
  const [responseFilter, setResponseFilter] = useState<string>("all")
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false)
  const [currentReviewId, setCurrentReviewId] = useState<string | null>(null)
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false)
  const [aiResponse, setAiResponse] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [responseStyle, setResponseStyle] = useState<'professional' | 'friendly'>('professional')
  const [responseLength, setResponseLength] = useState<'short' | 'medium' | 'long'>('medium')

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
        
        const data: Hotel[] = await response.json()
        setHotels(data)
        
        const lastSelected = localStorage.getItem('lastSelectedHotel')
        if (lastSelected && data.some((hotel: Hotel) => hotel._id === lastSelected)) {
          setSelectedHotel(lastSelected)
        } else if (data.length > 0) {
          setSelectedHotel(data[0]._id)
        }
      } catch (error) {
        console.error('Error:', error)
      }
    }

    fetchHotels()
  }, [])

  useEffect(() => {
    const fetchReviews = async () => {
      if (!selectedHotel) return
      
      try {
        const token = getCookie('token')
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/hotel/${selectedHotel}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          }
        )
        
        if (!response.ok) throw new Error('Failed to fetch reviews')
        
        const data = await response.json()
        setReviews(data)
        setFilteredReviews(data)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReviews()
  }, [selectedHotel])

  useEffect(() => {
    let filtered = [...reviews]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(review => 
        review.content.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.content.reviewerName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Platform filter
    if (platformFilter !== 'all') {
      filtered = filtered.filter(review => review.platform === platformFilter)
    }

    // Rating filter
    if (ratingFilter !== 'all') {
      filtered = filtered.filter(review => review.content.rating === parseInt(ratingFilter))
    }

    // Response filter
    if (responseFilter === 'responded') {
      filtered = filtered.filter(review => review.response)
    } else if (responseFilter === 'not_responded') {
      filtered = filtered.filter(review => !review.response)
    }

    setFilteredReviews(filtered)
  }, [reviews, searchTerm, platformFilter, ratingFilter, responseFilter])

  const handleGenerateResponse = async (reviewId: string) => {
    setCurrentReviewId(reviewId)
    setIsGeneratingResponse(true)
    setError(null)
    
    const review = reviews.find(r => r._id === reviewId)
    if (!review) return

    try {
      const token = getCookie('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hotelId: selectedHotel,
          review: review.content.text,
          responseSettings: {
            style: responseStyle,
            length: responseLength
          }
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate response')
      }
      
      setAiResponse(data.response)
      setIsResponseModalOpen(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate response')
    } finally {
      setIsGeneratingResponse(false)
    }
  }

  const handleSettingsClick = () => {
    if (selectedHotel) {
      localStorage.setItem('selectedHotel', selectedHotel)
      router.push('/hotel-settings')
    }
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Review Management</h1>
          <p className="text-xl text-gray-600">
            Monitor and respond to your reviews across all platforms
          </p>
        </div>

        {/* Controls Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Select value={selectedHotel} onValueChange={setSelectedHotel}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select hotel" />
              </SelectTrigger>
              <SelectContent>
                {hotels.map((hotel: Hotel) => (
                  <SelectItem key={hotel._id} value={hotel._id}>
                    {hotel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={handleSettingsClick}
              disabled={!selectedHotel}
              className="p-4 rounded-full"
              aria-label="Hotel Settings"
            >
              <Settings className="w-6 h-6" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                placeholder="Search reviews..."
              />
            </div>

            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="booking">Booking.com</SelectItem>
                <SelectItem value="tripadvisor">TripAdvisor</SelectItem>
              </SelectContent>
            </Select>

            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                {[5, 4, 3, 2, 1].map(rating => (
                  <SelectItem key={rating} value={rating.toString()}>
                    {rating} Stars
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={responseFilter} onValueChange={setResponseFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Response Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="responded">Responded</SelectItem>
                <SelectItem value="not_responded">Not Responded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          {filteredReviews.map((review) => (
            <Card key={review._id} className="w-full overflow-hidden">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {PLATFORMS[review.platform] && (
                      <div className="w-8 h-8 relative">
                        <img 
                          src={PLATFORMS[review.platform].logo}
                          alt={PLATFORMS[review.platform].name}
                          className="object-contain"
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{review.content.reviewerName}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.content.rating
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.metadata.originalCreatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 mb-6">{review.content.text}</p>
                
                {review.response ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium mb-2">Your Response:</p>
                    <p className="text-gray-600">{review.response.text}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <Button
                        onClick={() => handleGenerateResponse(review._id)}
                        disabled={isGeneratingResponse && currentReviewId === review._id}
                        className="gap-2"
                      >
                        {isGeneratingResponse && currentReviewId === review._id ? (
                          <RotateCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Generate AI Response
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <ResponseModal
          isOpen={isResponseModalOpen}
          onClose={() => {
            setIsResponseModalOpen(false)
            setAiResponse("")
            setError(null)
          }}
          response={error || aiResponse}
          isError={!!error}
        />
      </div>
    </div>
  )
}