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
import { toast } from "react-hot-toast"
import { AnalyticsDialog } from "@/components/analytics/AnalyticsDialog"
import { useRouter } from 'next/navigation'

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

interface FiltersAndTableProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  hotel: string;
  hotels: Hotel[];
  handleFilterChange: (type: string, value: string) => void;
  responseStatus: string;
  platform: string;
  ratingFilter: string;
  resultsPerPage: number;
  handleRefresh: () => void;
  handleResultsPerPageChange: (value: number) => void;
  setSelectedRows: (rows: Review[]) => void;
  handleTableReady: (table: TableType<any>) => void;
  tableInstance: TableType<any> | null;
  selectedRows: Review[];
  setIsAnalyticsDialogOpen: (value: boolean) => void;
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
}: FiltersAndTableProps) => {
  const router = useRouter()

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
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
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {tableInstance && <ColumnsDropdown table={tableInstance} />}

            <Button
              variant="default"
              size="sm"
              onClick={async () => {
                if (selectedRows.length === 0) {
                  toast.error("Please select at least one review");
                  return;
                }
                
                try {
                  const token = getCookie('token')
                  
                  if (!hotel || hotel === 'all') {
                    toast.error("Please select a hotel first")
                    return
                  }

                  const requestBody = {
                    hotelId: hotel,
                    reviews: selectedRows.map(review => review._id)
                  }

                  const tempId = Date.now().toString()
                  router.push(`/analyses?id=${tempId}&loading=true`)

                  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/analyze`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                  })

                  if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(`Failed to create analysis: ${errorData.message || 'Unknown error'}`)
                  }
                  
                  const data = await response.json()
                  if (!data._id) {
                    throw new Error('Invalid response format');
                  }

                  router.replace(`/analyses?id=${data._id}`)
                } catch (error: any) {
                  console.error('Full error details:', error)
                  toast.error(typeof error === 'object' && error?.message ? error.message : "Failed to create analysis")
                  router.push('/reviews')
                }
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

// Componente per l'onboarding
const OnboardingView = ({ onAddProperty }: { onAddProperty: () => void }) => (
  <div className="min-h-[80vh] flex items-center justify-center px-10">
    <div className="max-w-3xl w-full">
      <div className="text-center space-y-6 mb-12">
        <div className="flex justify-center">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/reviews-l1OpTAuGJuHcOblMRfwhcgfLCeAwcL.png"
            alt="Reviews Icon"
            width={120}
            height={120}
            className="animate-float"
          />
        </div>

        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          Welcome to Replai
        </h1>
        
        <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
          Start managing your hotel reviews efficiently. Connect your first property to begin responding to reviews with AI-powered assistance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          {
            icon: "🎯",
            title: "Centralize Reviews",
            description: "Manage all your reviews from different platforms in one place"
          },
          {
            icon: "⚡️",
            title: "Quick Responses",
            description: "Generate personalized responses in seconds with AI"
          },
          {
            icon: "🧠",
            title: "Smart Analytics",
            description: "AI analyzes reviews to uncover insights, suggests improvements, and answers your questions"
          }
        ].map((feature, i) => (
          <div 
            key={i}
            className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center space-y-4">
        <Button 
          onClick={onAddProperty}
          className="relative bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 px-12 text-xl rounded-2xl shadow-[0_4px_0_0_#1e40af] transition-all active:top-[2px] active:shadow-[0_0_0_0_#1e40af] hover:scale-105"
        >
          Add Your First Property
        </Button>
        <p className="text-sm text-gray-500">
          It only takes a few minutes to get started
        </p>
      </div>
    </div>
  </div>
)

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

        // Se ci sono hotel, imposta il primo come selezionato
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
    // Implementa la logica per il refresh qui
  }

  const handleTableReady = (table: TableType<any>) => {
    setTableInstance(table);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-600">Loading your properties...</p>
        </div>
      </div>
    )
  }

  if (hotels.length === 0) {
    return (
      <>
        {/* Sfondo aggiornato con gradiente */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#FAFAFB] via-[#F0F0F2] to-[#FAFAFB] backdrop-blur-sm" />
        
        <OnboardingView onAddProperty={() => setIsAddPropertyModalOpen(true)} />

        <AddPropertyModal 
          isOpen={isAddPropertyModalOpen}
          onClose={() => setIsAddPropertyModalOpen(false)}
          onSuccess={async () => {
            // Aggiorna la lista degli hotel
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

      {/* Sfondo aggiornato con gradiente */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#FAFAFB] via-[#F0F0F2] to-[#FAFAFB] backdrop-blur-sm" />
      
      <div className="flex flex-col px-10 md:pl-[96px] py-12 min-h-screen">
        <div className="max-w-[1400px] mx-auto w-full space-y-12">
          {/* Header modernizzato e allineato a sinistra */}
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue-600 to-blue-400" />
              <h1 className="text-3xl sm:text-4xl font-semibold bg-gradient-to-b from-blue-800 to-blue-600 bg-clip-text text-transparent">
                Review Management
              </h1>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <p className="text-base">
                Manage, analyze and respond to all your reviews in one place
              </p>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                {hotels.length} Properties
              </span>
            </div>
          </div>

          <Toaster position="top-right" />
          
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
      </div>
    </>
  )
}

// Aggiungiamo l'animazione float (utilizzata in OnboardingView)
const styles = `
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
    100% { transform: translateY(0px); }
  }
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
`

// Aggiungiamo lo style al documento
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style")
  styleSheet.innerText = styles
  document.head.appendChild(styleSheet)
}