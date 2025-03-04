"use client"

import { useState, useEffect, useRef } from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Table as TableType,
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  ChevronDown,
  Copy,
  CornerDownLeft,
  MessageSquare,
  Settings,
  Search,
  X,
  PenSquare,
  Trash2,
  Loader2,
  ExternalLink,
  Check,
  ListFilter,
  PlusCircle,
  CalendarDays,
  Ban,
  AlertCircle,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Image from "next/image"
import { ButtonGroup } from "@/components/ui/button-group"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { ChatMessageList } from "@/components/ui/chat-message-list"
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from "@/components/ui/chat-bubble"
import { ChatInput } from "@/components/ui/chat-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

import useReviews from "@/store/useReviews"
import { type Review } from "@/types/types"
import { toast } from "sonner"
import { getCookie } from "cookies-next"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { AddPropertyModal } from "@/components/add-property-modal"
import { SlidePanel } from "@/components/ui/slide-panel"

type Platform = 'google' | 'booking' | 'tripadvisor' | 'manual'

const logoUrls: Record<Platform, string> = {
  google: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/gmg-logo-300x300-1-YhBm2cRJdd8cFKdb5h4uv3cwYooXY7.webp",
  booking: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bookingcom-1-s1MP7yjsBCisV79VmZojIZ9Euh0Qn6.svg",
  tripadvisor: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Tripadvisor_logoset_solid_green-qRQkWYtDeBXNC1eNGeutQj1W40i036.svg",
  manual: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/manual%20response-O89S3zfgiDHVSo8aslEIqW3O8G9Q1n.png"
}

const logoSizes: Record<Platform, { width: number; height: number }> = {
  google: { width: 24, height: 24 },
  booking: { width: 24, height: 24 },
  tripadvisor: { width: 24, height: 24 },
  manual: { width: 24, height: 24 }
}

// All'inizio del file, definiamo l'interfaccia una sola volta
type MessageSender = "user" | "ai";

interface ChatMessage {
  id: number;  // Manteniamo number come tipo per id
  content: string;
  sender: MessageSender;
}

// All'inizio del file, aggiungi questi tipi
type ResponseTone = 'professional' | 'friendly'
type ResponseLength = 'short' | 'medium' | 'long'

interface ReviewsTableProps {
  searchQuery: string
  property: string
  responseStatus: string
  platform: string
  ratingFilter: string
  resultsPerPage: number
  onRefresh?: () => void
  onResultsPerPageChange: (value: number) => void
  onSelectionChange: (rows: any[]) => void
  onTableReady: (table: TableType<any>) => void
}

export function ReviewsTable({
  searchQuery,
  responseStatus,
  platform,
  ratingFilter,
  resultsPerPage,
  property,
  onRefresh,
  onResultsPerPageChange,
  onSelectionChange,
  onTableReady
}: ReviewsTableProps) {
  const { reviews, loading, error, fetchReviews, setFilters, generateResponse, updateReviewResponse } = useReviews()
  const router = useRouter()

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "date",
      desc: true
    }
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [responseTone, setResponseTone] = useState<ResponseTone>('professional')
  const [responseLength, setResponseLength] = useState<ResponseLength>('medium')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(resultsPerPage)
  const [isSaving, setIsSaving] = useState(false)
  const [hotelResponseSettings, setHotelResponseSettings] = useState<{
    style: ResponseTone;
    length: ResponseLength;
  }>({
    style: 'professional',
    length: 'medium'
  });
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false)
  const [isReviewExpanded, setIsReviewExpanded] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const columns: ColumnDef<Review>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
            >
              <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                indeterminate={table.getIsSomePageRowsSelected()}
                className="rounded-md"
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              />
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="w-48 bg-white rounded-xl border border-gray-200"
          >
            <DropdownMenuItem 
              onClick={() => table.toggleAllRowsSelected(true)}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              <span>Select all ({table.getFilteredRowModel().rows.length})</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => table.toggleAllPageRowsSelected(true)}
              className="flex items-center gap-2"
            >
              <ListFilter className="h-4 w-4" />
              <span>Select page ({table.getRowModel().rows.length})</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => table.toggleAllRowsSelected(false)}
              className="flex items-center gap-2 text-red-600"
            >
              <X className="h-4 w-4" />
              <span>Deselect all</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          className="rounded-md"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "platform",
      accessorKey: "platform",
      header: "Platform",
      enableHiding: false,
      size: 0.2,
      cell: ({ row }) => {
        const platform = row.original.platform as Platform
        return (
          <div className="w-8 h-8">
            <Image
              src={logoUrls[platform] || "/placeholder.svg"}
              alt={`${platform} logo`}
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
        )
      },
    },
    {
      id: "date",
      accessorKey: "metadata.originalCreatedAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      size: 0.3,
      cell: ({ row }) => {
        const dateStr = row.original.metadata?.originalCreatedAt
        if (!dateStr) return "No date"
        const date = new Date(dateStr)
        const formattedDate = date.toLocaleString('en-US', { 
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }).replace(',', '').replace(/(\d+)\s+(\w+)\s+(\d+)/, '$1 $2, $3')
        
        return (
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-500" />
            <span>{formattedDate}</span>
          </div>
        )
      },
    },
    {
      id: "rating",
      accessorFn: (row) => row.content?.rating,
      size: 0.2,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="w-full flex items-center justify-center"
          >
            Rating
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const rating = row.original.content?.rating
        const platform = row.original.platform
        const isBooking = platform === "booking"
        
        // Determina se il rating è positivo o negativo
        const isPositive = isBooking ? rating >= 8 : rating >= 4
        const isNegative = isBooking ? rating < 6 : rating < 3
        
        const colorClass = isPositive ? 'text-green-600 bg-green-50' : 
                          isNegative ? 'text-red-600 bg-red-50' : 
                          'text-yellow-600 bg-yellow-50'
        
        return (
          <div className="flex justify-center">
            <span className={`px-2 py-1 rounded-full text-sm font-medium ${colorClass}`}>
              {isBooking ? `${rating}/10` : `${rating}/5`}
            </span>
          </div>
        )
      },
    },
    {
      id: "reviewer",
      accessorFn: (row) => row.content?.reviewerName,
      header: "Reviewer",
      size: 0.4,
      cell: ({ row }) => row.original.content?.reviewerName || "Anonymous",
    },
    {
      id: "review",
      accessorFn: (row) => row.content?.text,
      header: "Review",
      size: 1,
      cell: ({ row }) => {
        const content = row.original.content?.text
        const platform = row.original.platform
        
        // Gestione specifica per Booking.com
        if (platform === 'booking' && content?.toLowerCase().includes('liked: no comments')) {
          return (
            <div className="flex items-center gap-2 text-gray-400">
              <Ban className="h-4 w-4" />
              <span className="text-xs font-medium">No review text</span>
            </div>
          )
        }
        
        if (!content) {
          return (
            <div className="flex items-center gap-2 text-gray-400">
              <Ban className="h-4 w-4" />
              <span className="text-xs font-medium">No review text</span>
            </div>
          )
        }

        return (
          <div className="w-[250px] group relative cursor-pointer">
            <div className="truncate">
              {content}
            </div>
            <div className="invisible group-hover:visible absolute left-0 top-full mt-2 p-4 bg-white rounded-xl shadow-lg border z-10 max-w-[500px] min-w-[300px] break-words">
              {content}
            </div>
          </div>
        )
      },
    },
    {
      id: "response",
      accessorFn: (row) => row.response?.text,
      header: "Generated Response",
      size: 1,
      cell: ({ row }) => {
        const response = row.original.response?.text
        
        if (!response) {
          return (
            <div className="flex items-center gap-2 text-gray-400">
              <div className="flex items-center gap-1.5 text-xs">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                <span className="font-medium text-gray-500">Awaiting response</span>
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              </div>
            </div>
          )
        }

        return (
          <div className="w-[250px] group relative cursor-pointer">
            <div className="truncate">
              {response}
            </div>
            <div 
              onClick={async () => {
                await navigator.clipboard.writeText(response);
                toast.success("Response copied to clipboard");
              }}
              className="invisible group-hover:visible absolute left-0 top-full mt-2 p-4 bg-white rounded-xl shadow-lg border z-10 max-w-[500px] min-w-[300px] break-words cursor-pointer hover:bg-gray-50 transition-colors after:content-['Click_to_copy'] after:absolute after:top-2 after:right-2 after:text-xs after:text-gray-400"
            >
              {response}
            </div>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "",
      size: 0.3,
      cell: ({ row }) => {
        const review = row.original;
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex justify-center items-center">
              {review.content?.originalUrl ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open(review.content.originalUrl, '_blank')}
                  className="h-8 w-8 rounded-full hover:bg-gray-100"
                  title="View original review"
                >
                  <ExternalLink className="h-4 w-4 text-gray-500" />
                </Button>
              ) : null}
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleGenerateResponse(row.original)}
              className="rounded-xl flex items-center gap-2 bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all"
            >
              <Sparkles className="h-4 w-4" />
              Generate
            </Button>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: reviews,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    enableRowSelection: true,
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater({
          pageIndex,
          pageSize,
        })
        setPageIndex(newState.pageIndex)
        setPageSize(newState.pageSize)
      }
    },
  })

  console.log('Debug info:', {
    totalRows: reviews?.length,
    resultsPerPage,
    currentPageRows: table.getRowModel().rows.length,
    paginationState: table.getState().pagination,
    pageCount: table.getPageCount(),
    filteredRows: table.getFilteredRowModel().rows.length
  })

  // Initial fetch when component mounts
  useEffect(() => {
    if (property !== 'all') {
      fetchReviews()
    }
  }, []) // Solo al mount

  // Fetch reviews when filters change
  useEffect(() => {
    if (property === 'all') return;
    
    console.log('Current filters:', {
      searchQuery,
      responseStatus,  // Aggiungiamo un log per vedere il valore
      platform,
      ratingFilter,
      property
    });
    
    setFilters({
      hotelId: property,
      platform,
      responseStatus: responseStatus === 'all' ? undefined : responseStatus,
      rating: ratingFilter,
      searchQuery
    });
  }, [searchQuery, responseStatus, platform, ratingFilter, property]);

  useEffect(() => {
    console.log('Reviews state:', { reviews, loading, error })
  }, [reviews, loading, error])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Aggiungiamo una funzione per recuperare le impostazioni dell'hotel
  const fetchHotelSettings = async (hotelId: string) => {
    try {
      const token = getCookie('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels/${hotelId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const hotel = await response.json();
        if (hotel.responseSettings) {
          // Aggiorna le impostazioni predefinite con quelle dell'hotel
          setHotelResponseSettings({
            style: hotel.responseSettings.style as ResponseTone,
            length: hotel.responseSettings.length as ResponseLength
          });
          
          // Imposta anche i valori correnti
          setResponseTone(hotel.responseSettings.style as ResponseTone);
          setResponseLength(hotel.responseSettings.length as ResponseLength);
        }
      }
    } catch (error) {
      console.error('Error fetching hotel settings:', error);
    }
  };
  
  // Modifichiamo useEffect per caricare le impostazioni dell'hotel quando cambia la proprietà
  useEffect(() => {
    if (property) {
      fetchHotelSettings(property);
    }
    
    // ... resto del codice esistente per il caricamento delle recensioni ...
    
  }, [property]);

  const handleGenerateResponse = async (review: Review) => {
    // Aggiungiamo un controllo per evitare richieste multiple
    if (isGenerating) return;
    
    setMessages([]);
    setInput('');
    setIsGenerating(true); // Impostiamo subito a true per bloccare richieste multiple
    setSelectedReview(review);
    setIsModalOpen(true);
    setSuggestions([]);
    
    try {
      const token = getCookie('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hotelId: review.hotelId,
          review: {
            text: review.content.text,
            rating: review.content.rating,
            reviewerName: review.content.reviewerName
          },
          responseSettings: {
            style: responseTone,
            length: responseLength
          },
          previousMessages: messages,
          generateSuggestions: true,
          isNewManualReview: false
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate response');
      }
      
      if (data.response) {
        setMessages([{ id: 1, content: data.response, sender: "ai" }]);
      }
      
      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (error: any) {
      console.error('Generate response error:', error);
      toast.error(error.message || "Error generating response");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomResponse = (review: Review) => {
    // Implement custom response logic
    console.log("Custom response for review:", review)
  }

  const handleViewDetails = (review: Review) => {
    // Implement view details logic
    console.log("Viewing details for review:", review)
  }

  const handleChatSubmit = async (input: string) => {
    if (!input.trim() || isGenerating) return;
    
    const newUserMessage: ChatMessage = {
      id: messages.length + 1,
      content: input,
      sender: 'user'
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    
    try {
      const response = await generateResponse(
        selectedReview!.hotelId,
        selectedReview!.content.text,
        {
          style: responseTone as 'professional' | 'friendly',
          length: responseLength as 'short' | 'medium' | 'long',
        },
        [...messages, newUserMessage]
      );
      
      const aiMessage: ChatMessage = { 
        id: messages.length + 2, 
        content: response, 
        sender: "ai" as MessageSender
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast.error("Error generating response");
    }
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh()
    }
    fetchReviews()
  }

  const handleDeleteReview = async (reviewId: string) => {
    try {
      const token = getCookie('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete review');
      }

      toast.success('Review deleted successfully');
      handleRefresh(); // Ricarica la tabella dopo l'eliminazione
    } catch (error) {
      console.error('Delete review error:', error);
      toast.error('Failed to delete review');
    }
  };

  useEffect(() => {
    const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
    onSelectionChange(selectedRows);
  }, [table.getSelectedRowModel().rows]);

  // Notifica il parent component quando la tabella è pronta
  useEffect(() => {
    onTableReady(table);
  }, [table, onTableReady]);

  // Aggiorna pageSize quando cambia resultsPerPage
  useEffect(() => {
    setPageSize(resultsPerPage)
  }, [resultsPerPage])

  const handleResultsPerPageChange = (value: string) => {
    const newPageSize = parseInt(value)
    setPageSize(newPageSize)
    setPageIndex(0) // Reset alla prima pagina
    onResultsPerPageChange(newPageSize)
  }

  const handleSaveResponse = async () => {
    if (!selectedReview || !messages.length) return
    
    setIsSaving(true)
    try {
      const lastAiMessage = [...messages].reverse().find(m => m.sender === "ai")
      if (!lastAiMessage) throw new Error("No AI response to save")

      const token = getCookie('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${selectedReview._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          response: {
            text: lastAiMessage.content,
            createdAt: new Date(),
            settings: {
              style: responseTone,
              length: responseLength
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save response')
      }

      updateReviewResponse(selectedReview._id, lastAiMessage.content)
      
      toast.success('Response saved successfully')
      setIsModalOpen(false)
      
      if (onRefresh) {
        onRefresh()
      }

    } catch (error) {
      console.error('Save response error:', error)
      toast.error('Failed to save response')
    } finally {
      setIsSaving(false)
    }
  }

  // Quando si apre il modale, resettiamo le impostazioni a quelle dell'hotel
  useEffect(() => {
    if (isModalOpen) {
      setResponseTone(hotelResponseSettings.style);
      setResponseLength(hotelResponseSettings.length);
    }
  }, [isModalOpen, hotelResponseSettings]);

  if (loading) {
    console.log('Loading reviews...')
    return <div>Loading...</div>
  }

  if (error) {
    console.error('Error loading reviews:', error)
    return <div>Error: {error}</div>
  }

  if (!reviews.length) {
    return (
      <>
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-64 h-64 mb-6 relative">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/reviews-l1OpTAuGJuHcOblMRfwhcgfLCeAwcL.png"
              alt="No reviews"
              layout="fill"
              objectFit="contain"
              className="opacity-50"
            />
          </div>
          
          <h3 className="text-2xl font-semibold text-gray-800 mb-3">
            No Reviews Yet
          </h3>
          
          <p className="text-gray-600 max-w-md mb-6">
            {!property 
              ? "Add your first property to start managing your reviews" 
              : "Connect your review platforms to start managing your reviews in one place"}
          </p>
          
          <Button
            onClick={() => setIsAddPropertyModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-xl shadow-[0_4px_0_0_#1e40af] hover:shadow-[0_2px_0_0_#1e40af] hover:translate-y-[2px] transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Add Property
          </Button>
        </div>

        <AddPropertyModal 
          isOpen={isAddPropertyModalOpen}
          onClose={() => setIsAddPropertyModalOpen(false)}
          onSuccess={async () => {
            setIsAddPropertyModalOpen(false)
            if (onRefresh) await onRefresh()
          }}
        />
      </>
    )
  }

  console.log('Rendering reviews:', reviews?.length || 0)

  const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);

  return (
    <div className="relative">
      <div className="space-y-4">
        <div className="rounded-xl border bg-white">
          <Table className="overflow-hidden">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow 
                  key={headerGroup.id} 
                  className="bg-gray-50 hover:bg-gray-50 border-gray-200"
                >
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead 
                        key={header.id}
                        className={cn(
                          "text-gray-600 font-medium h-11 bg-gray-50",
                          header.id === "select" && "[&_input[type='checkbox']]:rounded-lg [&_input[type='checkbox']]:border-gray-300"
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell 
                        key={cell.id}
                        className={cn(
                          cell.column.id === "select" && "[&_input[type='checkbox']]:rounded-lg [&_input[type='checkbox']]:border-gray-300"
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-6 mb-4 px-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Select
              value={pageSize.toString()}
              onValueChange={handleResultsPerPageChange}
            >
              <SelectTrigger className="h-9 w-[160px] rounded-full border-gray-200 focus:border-primary focus:ring-primary bg-white text-sm">
                <SelectValue placeholder="Results per page" />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 40, 50].map((value) => (
                  <SelectItem 
                    key={value} 
                    value={value.toString()}
                    className="text-sm"
                  >
                    {value} results
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Page {pageIndex + 1} of {table.getPageCount()}
            </span>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="rounded-full border-gray-200 hover:bg-gray-50 hover:text-gray-900 text-gray-600"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="rounded-full border-gray-200 hover:bg-gray-50 hover:text-gray-900 text-gray-600"
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        <SlidePanel 
          open={isModalOpen} 
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) {
              setMessages([]);
              setInput('');
              setIsGenerating(false);
              setSelectedReview(null);
            }
          }}
          className="!fixed !inset-0 !right-0 !left-auto"
        >
          <div className="h-screen flex flex-col">
            <div className="px-6 py-4 border-b bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold">Generated Response</h2>
                    {isGenerating && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Generating...
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedReview && (
                  <div className="mt-2 p-3 bg-white rounded-xl border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0">
                        <Image
                          src={logoUrls[selectedReview.platform as Platform]}
                          alt={selectedReview.platform}
                          width={20}
                          height={20}
                          className="rounded-sm"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-medium text-sm truncate">
                            {selectedReview.content.reviewerName || "Anonymous"}
                          </span>
                          <div className="flex items-center gap-1 text-sm">
                            <span className="font-medium">
                              {selectedReview.platform === "booking" 
                                ? `${selectedReview.content.rating}/10` 
                                : `${selectedReview.content.rating}/5`}
                            </span>
                            {selectedReview.content.originalUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(selectedReview.content.originalUrl, '_blank')}
                                className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div 
                          className="relative cursor-pointer" 
                          onClick={() => setIsReviewExpanded(!isReviewExpanded)}
                        >
                          <p className={cn(
                            "text-sm text-gray-600 transition-all duration-200",
                            isReviewExpanded ? "" : "line-clamp-2"
                          )}>
                            {selectedReview.content.text}
                          </p>
                          <div className={cn(
                            "absolute bottom-0 left-0 right-0 h-6",
                            isReviewExpanded ? "hidden" : "bg-gradient-to-t from-white to-transparent"
                          )} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 mt-2">
                  <Select 
                    value={responseTone} 
                    onValueChange={(value: ResponseTone) => setResponseTone(value)}
                  >
                    <SelectTrigger className="h-8 w-[130px] text-sm rounded-full">
                      <SelectValue placeholder="Style" />
                    </SelectTrigger>
                    <SelectContent className="z-[200]">
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select 
                    value={responseLength} 
                    onValueChange={(value: ResponseLength) => setResponseLength(value)}
                  >
                    <SelectTrigger className="h-8 w-[130px] text-sm rounded-full">
                      <SelectValue placeholder="Length" />
                    </SelectTrigger>
                    <SelectContent className="z-[200]">
                      <SelectItem value="short">Short</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="long">Long</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMessages([]);
                      handleGenerateResponse(selectedReview!);
                    }}
                    disabled={isGenerating}
                    className="h-8 rounded-full text-sm"
                  >
                    Regenerate
                  </Button>
                </div>
              </div>
            </div>
            
            <div 
              className="flex-1 overflow-y-auto bg-gray-50/50 px-6" 
              ref={chatContainerRef}
              style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: '#E5E7EB transparent'
              }}
            >
              <div className="py-6 max-w-3xl mx-auto">
                <ChatMessageList>
                  {messages.map((message) => (
                    <ChatBubble 
                      key={message.id} 
                      variant={message.sender === "user" ? "sent" : "received"}
                      className="rounded-2xl group"
                    >
                      <ChatBubbleAvatar
                        className="h-8 w-8 shrink-0 rounded-full border-2 border-white shadow-sm"
                        src={message.sender === "user" ? "https://github.com/shadcn.png" : "https://github.com/vercel.png"}
                        fallback={message.sender === "user" ? "US" : "AI"}
                      />
                      <div className="flex flex-col flex-1">
                        <ChatBubbleMessage 
                          variant={message.sender === "user" ? "sent" : "received"}
                          className="rounded-2xl relative pr-10 shadow-sm group"
                        >
                          <div 
                            onClick={async () => {
                              if (message.sender === "ai") {
                                await navigator.clipboard.writeText(message.content);
                                toast.success("Response copied to clipboard");
                              }
                            }}
                            className={cn(
                              "w-full",
                              message.sender === "ai" && "cursor-pointer hover:opacity-80 transition-opacity",
                              message.sender === "ai" && "after:content-['Click_to_copy'] after:absolute after:top-2 after:right-2 after:text-xs after:text-gray-400 after:opacity-0 after:transition-opacity group-hover:after:opacity-100"
                            )}
                          >
                            {message.content}
                          </div>
                          {message.sender === "ai" && selectedReview && (
                            <div className="absolute right-2 bottom-2 flex items-center gap-2">
                              {selectedReview.content?.originalUrl ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                      if (!selectedReview) return;
                                      try {
                                        // Salva la risposta
                                        const token = getCookie('token');
                                        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${selectedReview._id}`, {
                                          method: 'PATCH',
                                          headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json'
                                          },
                                          body: JSON.stringify({
                                            response: {
                                              text: message.content,
                                              createdAt: new Date(),
                                              settings: {
                                                style: responseTone,
                                                length: responseLength
                                              }
                                            }
                                          })
                                        });

                                        // Copia e apri l'URL
                                        navigator.clipboard.writeText(message.content);
                                        window.open(selectedReview.content.originalUrl, '_blank');
                                        
                                        // Aggiorna lo stato locale
                                        updateReviewResponse(selectedReview._id, message.content);
                                        
                                        toast.success("Response copied, saved and original review opened");
                                        
                                        if (onRefresh) {
                                          onRefresh();
                                        }
                                      } catch (error) {
                                        console.error('Error saving response:', error);
                                        toast.error("Failed to save response");
                                      }
                                    }}
                                    className="h-8 px-3 rounded-full bg-white shadow-sm border border-gray-100 hover:bg-gray-50 
                                      text-gray-600 hover:text-gray-900 transition-colors
                                      flex items-center gap-1.5"
                                    title="Copy and go to original review"
                                  >
                                    <span className="text-xs font-medium">Copy & Go</span>
                                    <ExternalLink className="h-3 w-3 ml-0.5" />
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={async () => {
                                      if (!selectedReview) return;
                                      try {
                                        // Salva la risposta
                                        const token = getCookie('token');
                                        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${selectedReview._id}`, {
                                          method: 'PATCH',
                                          headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json'
                                          },
                                          body: JSON.stringify({
                                            response: {
                                              text: message.content,
                                              createdAt: new Date(),
                                              settings: {
                                                style: responseTone,
                                                length: responseLength
                                              }
                                            }
                                          })
                                        });

                                        // Copia negli appunti
                                        navigator.clipboard.writeText(message.content);
                                        
                                        // Aggiorna lo stato locale
                                        updateReviewResponse(selectedReview._id, message.content);
                                        
                                        toast.success("Response copied and saved");
                                        
                                        if (onRefresh) {
                                          onRefresh();
                                        }
                                      } catch (error) {
                                        console.error('Error saving response:', error);
                                        toast.error("Failed to save response");
                                      }
                                    }}
                                    className="h-8 w-8 rounded-full hover:bg-gray-50 text-gray-500"
                                    title="Copy response"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    if (!selectedReview) return;
                                    try {
                                      // Salva la risposta
                                      const token = getCookie('token');
                                      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${selectedReview._id}`, {
                                        method: 'PATCH',
                                        headers: {
                                          'Authorization': `Bearer ${token}`,
                                          'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                          response: {
                                            text: message.content,
                                            createdAt: new Date(),
                                            settings: {
                                              style: responseTone,
                                              length: responseLength
                                            }
                                          }
                                        })
                                      });

                                      // Copia negli appunti
                                      navigator.clipboard.writeText(message.content);
                                      
                                      // Aggiorna lo stato locale
                                      updateReviewResponse(selectedReview._id, message.content);
                                      
                                      toast.success("Response copied and saved");
                                      
                                      if (onRefresh) {
                                        onRefresh();
                                      }
                                    } catch (error) {
                                      console.error('Error saving response:', error);
                                      toast.error("Failed to save response");
                                    }
                                  }}
                                  className="h-8 px-3 rounded-full bg-white shadow-sm border border-gray-100 hover:bg-gray-50 
                                    text-gray-600 hover:text-gray-900 transition-colors
                                    flex items-center gap-1.5"
                                  title="Copy response"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                  <span className="text-xs font-medium">Copy</span>
                                </Button>
                              )}
                            </div>
                          )}
                        </ChatBubbleMessage>
                      </div>
                    </ChatBubble>
                  ))}

                  {isGenerating && (
                    <ChatBubble variant="received" className="rounded-2xl">
                      <ChatBubbleAvatar 
                        className="h-8 w-8 shrink-0 rounded-full border-2 border-white shadow-sm" 
                        src="https://github.com/vercel.png" 
                        fallback="AI" 
                      />
                      <ChatBubbleMessage isLoading className="rounded-2xl shadow-sm" />
                    </ChatBubble>
                  )}
                </ChatMessageList>
              </div>
            </div>

            <div className="border-t bg-white px-6">
              <div className="max-w-3xl mx-auto">
                <div className="py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
                  {isGenerating ? (
                    Array(3).fill(0).map((_, i) => (
                      <div 
                        key={i}
                        className="h-9 w-32 rounded-full bg-gray-100 animate-pulse"
                      />
                    ))
                  ) : suggestions.length > 0 ? (
                    suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleChatSubmit(suggestion)}
                        className="rounded-full text-sm whitespace-nowrap hover:bg-primary hover:text-white border-gray-200"
                      >
                        {suggestion}
                      </Button>
                    ))
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChatSubmit("Could you make it more personal?")}
                        className="rounded-full text-sm whitespace-nowrap hover:bg-primary hover:text-white border-gray-200"
                      >
                        Make it more personal
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChatSubmit("Can you address specific points from the review?")}
                        className="rounded-full text-sm whitespace-nowrap hover:bg-primary hover:text-white border-gray-200"
                      >
                        Address specific points
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChatSubmit("Could you make it shorter?")}
                        className="rounded-full text-sm whitespace-nowrap hover:bg-primary hover:text-white border-gray-200"
                      >
                        Make it shorter
                      </Button>
                    </>
                  )}
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleChatSubmit(input);
                  }}
                  className="relative py-4 pb-6"
                >
                  <div className="relative">
                    <textarea
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        e.target.style.height = 'inherit';
                        const height = Math.min(e.target.scrollHeight, 120);
                        e.target.style.height = `${height}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleChatSubmit(input);
                        }
                      }}
                      placeholder="Ask for changes..."
                      className="w-full min-h-[52px] max-h-[120px] pe-[90px] ps-4 py-3
                        bg-gray-50 rounded-xl resize-none
                        border border-gray-200 hover:border-gray-300
                        focus:border-primary focus:ring-1 focus:ring-primary
                        transition-colors text-base leading-relaxed
                        scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
                      style={{ 
                        overflow: 'auto',
                      }}
                    />
                    {input.trim() && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <kbd className="inline-flex h-6 select-none items-center gap-1 rounded border border-gray-200 bg-gray-50 px-1.5 font-mono text-[10px] font-medium text-gray-400">
                          <span className="text-xs">⏎</span>
                          Enter
                        </kbd>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </SlidePanel>
      </div>
      
      {/* Banner per le azioni bulk */}
      {selectedRows.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t shadow-lg z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                {selectedRows.length} {selectedRows.length === 1 ? 'review selected' : 'reviews selected'}
              </span>
            </div>
            <Button
              onClick={async () => {
                try {
                  const token = getCookie('token');
                  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/bulk-delete`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      reviewIds: selectedRows.map(row => row._id)
                    })
                  });

                  toast.success(`${selectedRows.length} reviews successfully deleted`);
                  handleRefresh();
                  
                  // Deseleziona tutte le righe
                  table.toggleAllRowsSelected(false);
                } catch (error) {
                  console.error('Error deleting reviews:', error);
                  toast.error("Error deleting reviews");
                }
              }}
              variant="destructive"
              className="rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-[0_4px_0_0_#dc2626] hover:shadow-[0_2px_0_0_#dc2626] hover:translate-y-[2px] transition-all"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Reviews
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Aggiungi questi stili globali nel tuo CSS
const styles = `
  .last-row .first-cell {
    border-bottom-left-radius: 0.75rem;
  }
  
  .last-row .last-cell {
    border-bottom-right-radius: 0.75rem;
  }
`;