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
import Image from "next/image"
import { BulkActionsDropdown } from "@/components/bulk-actions-dropdown"
import { ColumnsDropdown } from "@/components/columns-dropdown"
import { type Table as TableType } from "@tanstack/react-table"
import { AddPropertyModal } from "@/components/add-property-modal"
import { AuroraBackground } from "@/components/ui/aurora-background"
import { HandWrittenTitle } from "@/components/ui/hand-writing-text"

interface Hotel {
  _id: string
  name: string
}

interface Review {
  _id: string;
  platform: 'google' | 'booking' | 'tripadvisor' | 'manual';
  hotelId: string;
  content: {
    text: string;
    rating: number;
    reviewerName: string;
    reviewerImage?: string;
    language?: string;
    images?: { url: string; caption: string; }[];
    likes?: number;
    originalUrl?: string;
  };
  metadata: {
    originalCreatedAt: Date;
    lastUpdated?: Date;
    syncedAt?: Date;
  };
  response?: {
    text: string;
    createdAt: Date;
    settings: {
      style: 'professional' | 'friendly';
      length: 'short' | 'medium' | 'long';
    };
  };
}

export default function ReviewsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [hotel, setHotel] = useState("all")
  const [responseStatus, setResponseStatus] = useState("all")
  const [platform, setPlatform] = useState("all")
  const [resultsPerPage, setResultsPerPage] = useState<number>(10)
  const [ratingFilter, setRatingFilter] = useState("all")
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { setFilters } = useReviews()
  const [selectedRows, setSelectedRows] = useState<Review[]>([])
  const [tableInstance, setTableInstance] = useState<TableType<any> | null>(null);
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false)

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

  const handleResultsPerPageChange = (value: number) => {
    setResultsPerPage(value)
  }

  const handleRefresh = () => {
    // Implement the refresh logic here
  }

  const handleTableReady = (table: TableType<any>) => {
    setTableInstance(table);
  };

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (hotels.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to ReviewMaster</h1>
            <p className="text-xl text-gray-600">
              Get started by adding your first property
            </p>
          </div>

          <Button 
            onClick={() => setIsAddPropertyModalOpen(true)}
            className="relative bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 px-8 text-xl rounded-2xl shadow-[0_4px_0_0_#1e40af] transition-all active:top-[2px] active:shadow-[0_0_0_0_#1e40af]"
          >
            Add Your First Property
          </Button>
        </div>

        <AddPropertyModal 
          isOpen={isAddPropertyModalOpen}
          onClose={() => setIsAddPropertyModalOpen(false)}
          onSuccess={async () => {
            // Refresh hotels list
            const token = getCookie('token')
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              }
            })
            
            if (response.ok) {
              const data = await response.json()
              setHotels(data)
              if (data.length > 0) {
                setHotel(data[0]._id)
                setFilters({ hotelId: data[0]._id })
              }
            }
          }}
        />
      </>
    )
  }

  return (
    <>
      <AuroraBackground className="fixed inset-0 -z-10" />
      <div className="flex flex-col px-10 md:pl-[96px]">
        <HandWrittenTitle 
          title="Reviews" 
          subtitle="Analyze and respond to your reviews"
        />
        <Toaster position="top-right" />
        
        <div className="flex flex-col">
          <div className="mb-8 w-fit">
            <div className="flex items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search reviews..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-[280px] rounded-full border-gray-200 focus:border-primary focus:ring-primary bg-white text-sm"
                  />
                </div>

                <Select
                  value={hotel}
                  onValueChange={(value) => handleFilterChange('hotel', value)}
                >
                  <SelectTrigger className="h-9 w-[160px] rounded-full border-gray-200 focus:border-primary focus:ring-primary bg-white text-sm">
                    <SelectValue placeholder="Property" className="text-sm" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels.map((h) => (
                      <SelectItem key={h._id} value={h._id} className="text-sm">
                        {h.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={responseStatus}
                  onValueChange={(value) => handleFilterChange('responseStatus', value)}
                >
                  <SelectTrigger className="h-9 w-[160px] rounded-full border-gray-200 focus:border-primary focus:ring-primary bg-white text-sm">
                    <SelectValue placeholder="Response Status" className="text-sm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-sm">All Reviews</SelectItem>
                    <SelectItem value="responded" className="text-sm">Responded</SelectItem>
                    <SelectItem value="not_responded" className="text-sm">Not Responded</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={platform}
                  onValueChange={(value) => handleFilterChange('platform', value)}
                >
                  <SelectTrigger className="h-9 w-[160px] rounded-full border-gray-200 focus:border-primary focus:ring-primary bg-white text-sm">
                    <SelectValue placeholder="Platform" className="text-sm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-sm">All Platforms</SelectItem>
                    <SelectItem value="google" className="text-sm">Google</SelectItem>
                    <SelectItem value="booking" className="text-sm">Booking.com</SelectItem>
                    <SelectItem value="tripadvisor" className="text-sm">TripAdvisor</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={ratingFilter}
                  onValueChange={(value) => handleFilterChange('rating', value)}
                >
                  <SelectTrigger className="h-9 w-[160px] rounded-full border-gray-200 focus:border-primary focus:ring-primary bg-white text-sm">
                    <SelectValue placeholder="Rating" className="text-sm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-sm">All Ratings</SelectItem>
                    <SelectItem value="5" className="text-sm">5 Stars & Up</SelectItem>
                    <SelectItem value="4" className="text-sm">4 Stars & Up</SelectItem>
                    <SelectItem value="3" className="text-sm">3 Stars & Up</SelectItem>
                    <SelectItem value="2" className="text-sm">2 Stars & Up</SelectItem>
                    <SelectItem value="1" className="text-sm">1 Star & Up</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <BulkActionsDropdown 
                  selectedRows={selectedRows} 
                  onRefresh={handleRefresh} 
                />
                {tableInstance && <ColumnsDropdown table={tableInstance} />}
              </div>
            </div>
          </div>

          <ReviewsTable
            searchQuery={searchQuery}
            property={hotel}
            responseStatus={responseStatus}
            platform={platform}
            ratingFilter={ratingFilter}
            resultsPerPage={resultsPerPage}
            onRefresh={handleRefresh}
            onResultsPerPageChange={handleResultsPerPageChange}
            onSelectionChange={setSelectedRows}
            onTableReady={handleTableReady}
          />
        </div>
      </div>
    </>
  )
}