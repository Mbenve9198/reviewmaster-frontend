"use client"

import { useState, useEffect } from "react"
import { ReviewsTable } from "@/components/reviews-table"
import { Input } from "@/components/ui/input"
import { ReviewTabs } from "@/components/ui/review-tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, BarChart2, X } from "lucide-react"
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
import { Tiles } from "@/components/ui/tiles"
import { toast } from "react-hot-toast"
import { AnalyticsDialog } from "@/components/analytics/AnalyticsDialog"

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

const FiltersAndTable = ({ 
  searchQuery, 
  setSearchQuery, 
  hotel, 
  hotels,
  handleFilterChange,
  responseStatus,
  platform,
  ratingFilter,
  resultsPerPage,
  handleRefresh,
  handleResultsPerPageChange,
  setSelectedRows,
  handleTableReady,
  tableInstance,
  selectedRows,
  setIsAnalyticsDialogOpen
}) => {
  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-[200px] rounded-xl border-gray-200 focus:border-primary focus:ring-primary bg-white/50 text-sm"
            />
          </div>

          <Select
            value={hotel}
            onValueChange={(value) => handleFilterChange('hotel', value)}
          >
            <SelectTrigger className="h-9 w-[180px] rounded-xl border-gray-200 focus:border-primary focus:ring-primary bg-white/50 text-sm">
              <SelectValue placeholder="Select property" className="text-sm" />
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
            <SelectTrigger className="h-9 w-[180px] rounded-xl border-gray-200 focus:border-primary focus:ring-primary bg-white/50 text-sm">
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
            <SelectTrigger className="h-9 w-[180px] rounded-xl border-gray-200 focus:border-primary focus:ring-primary bg-white/50 text-sm">
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
            <SelectTrigger className="h-9 w-[180px] rounded-xl border-gray-200 focus:border-primary focus:ring-primary bg-white/50 text-sm">
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

          <div className="ml-auto flex items-center gap-3">
            {tableInstance && <ColumnsDropdown table={tableInstance} />}

            <Button
              variant="default"
              size="sm"
              onClick={() => {
                if (selectedRows.length === 0) {
                  toast.error("Please select at least one review");
                  return;
                }
                setIsAnalyticsDialogOpen(true);
              }}
              className="rounded-xl flex items-center gap-2 bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all"
              disabled={selectedRows.length === 0}
            >
              <BarChart2 className="h-4 w-4" />
              Analyze Reviews
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
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
  );
};

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
  const [isAnalyticsDialogOpen, setIsAnalyticsDialogOpen] = useState(false)
  const [showBanner, setShowBanner] = useState(true)

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
      {showBanner && (
        <div className="fixed top-0 left-0 right-0 z-20">
          <div className="bg-gradient-to-r from-blue-600/85 via-blue-500/85 via-blue-400/85 to-blue-500/85 backdrop-blur-sm text-white shadow-lg">
            <div className="relative max-w-7xl mx-auto md:pl-[100px]">
              <div className="px-4 py-3 text-center pr-12">
                <p className="text-sm">
                  Want to auto-respond to reviews directly on TripAdvisor and Booking.com? 
                  <a 
                    href="https://chromewebstore.google.com/detail/replai/dgdhioopdabddaifmlbjpabdlegpkepn?authuser=0&hl=it"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline ml-1 hover:text-blue-100"
                  >
                    Get our Chrome extension here
                  </a>
                </p>
              </div>
              <button 
                onClick={() => setShowBanner(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <Tiles 
        className="fixed inset-0 -z-10" 
        rows={100}
        cols={20}
        tileSize="md"
      />
      <div className="flex flex-col px-10 md:pl-[96px]">
        <HandWrittenTitle 
          title="Reviews" 
          subtitle="Analyze and respond to your reviews"
        />
        <Toaster position="top-right" />
        
        <div className="flex flex-col max-w-[1400px] mx-auto w-full">
          <FiltersAndTable 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            hotel={hotel}
            hotels={hotels}
            handleFilterChange={handleFilterChange}
            responseStatus={responseStatus}
            platform={platform}
            ratingFilter={ratingFilter}
            resultsPerPage={resultsPerPage}
            handleRefresh={handleRefresh}
            handleResultsPerPageChange={handleResultsPerPageChange}
            setSelectedRows={setSelectedRows}
            handleTableReady={handleTableReady}
            tableInstance={tableInstance}
            selectedRows={selectedRows}
            setIsAnalyticsDialogOpen={setIsAnalyticsDialogOpen}
          />
        </div>

        <AnalyticsDialog 
          isOpen={isAnalyticsDialogOpen}
          onClose={() => setIsAnalyticsDialogOpen(false)}
          selectedReviews={selectedRows}
        />
      </div>
    </>
  )
}