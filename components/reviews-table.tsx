"use client"

import { useState, useEffect } from "react"
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
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  ChevronDown,
  Copy,
  CornerDownLeft,
  MessageSquare,
  Settings,
  Search,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ChatMessageList } from "@/components/ui/chat-message-list"
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from "@/components/ui/chat-bubble"
import { ChatInput } from "@/components/ui/chat-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

import useReviews from "@/store/useReviews"
import { type Review } from "@/types/types"
import { toast } from "sonner"

type Platform = 'google' | 'booking' | 'tripadvisor'

const logoUrls: Record<Platform, string> = {
  google: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/gmg-logo-300x300-1-YhBm2cRJdd8cFKdb5h4uv3cwYooXY7.webp",
  booking: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bookingcom-1-s1MP7yjsBCisV79VmZojIZ9Euh0Qn6.svg",
  tripadvisor: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Tripadvisor_logoset_solid_green-qRQkWYtDeBXNC1eNGeutQj1W40i036.svg"
}

const logoSizes: Record<Platform, { width: number; height: number }> = {
  google: { width: 24, height: 24 },
  booking: { width: 24, height: 24 },
  tripadvisor: { width: 24, height: 24 }
}

interface ReviewsTableProps {
  searchQuery: string
  property: string
  responseStatus: string
  platform: string
  ratingFilter: string
  resultsPerPage: number
  onRefresh?: () => void
  onResultsPerPageChange?: (value: string) => void
}

export const ReviewsTable = ({
  searchQuery,
  responseStatus,
  platform,
  ratingFilter,
  resultsPerPage,
  property,
  onRefresh,
  onResultsPerPageChange
}: ReviewsTableProps) => {
  const { reviews, loading, error, fetchReviews, setFilters, generateResponse } = useReviews()

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [messages, setMessages] = useState<Array<{ id: number; content: string; sender: "ai" | "user" }>>([])
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [responseLength, setResponseLength] = useState("medium")
  const [responseTone, setResponseTone] = useState("professional")

  const columns: ColumnDef<Review>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 0.1,
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
        return new Date(dateStr).toISOString().split('T')[0]
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
        return (
          <div className="text-center">
            {platform === "booking" ? `${rating}/10` : `${rating}/5`}
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
        return (
          <div className="w-[250px] group relative cursor-pointer">
            <div className="truncate">
              {content || "No content"}
            </div>
            <div className="invisible group-hover:visible absolute left-0 top-full mt-2 p-4 bg-white rounded-xl shadow-lg border z-10 max-w-[500px] min-w-[300px] break-words">
              {content || "No content"}
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
        return (
          <div className="w-[250px] group relative cursor-pointer">
            <div className="truncate">
              {response || "No response generated"}
            </div>
            <div className="invisible group-hover:visible absolute left-0 top-full mt-2 p-4 bg-white rounded-xl shadow-lg border z-10 max-w-[500px] min-w-[300px] break-words">
              {response || "No response generated"}
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
        return (
          <div className="flex justify-start -ml-4">
            <ButtonGroup>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleGenerateResponse(row.original)}
                className="rounded-xl flex items-center gap-2 shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all whitespace-nowrap"
              >
                <MessageSquare className="h-4 w-4" />
                Generate
              </Button>
              <Button
                variant="default"
                size="sm"
                className="rounded-xl px-2 shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </ButtonGroup>
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
        pageSize: resultsPerPage,
        pageIndex: 0
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
      responseStatus,
      platform,
      ratingFilter,
      property
    });
    
    setFilters({
      hotelId: property,
      platform,
      responseStatus,
      rating: ratingFilter,
      searchQuery
    });
  }, [searchQuery, responseStatus, platform, ratingFilter, property]);

  useEffect(() => {
    console.log('Reviews state:', { reviews, loading, error })
  }, [reviews, loading, error])

  const handleGenerateResponse = async (review: Review) => {
    setSelectedReview(review)
    setIsModalOpen(true)
    setIsGenerating(true)

    try {
      const response = await generateResponse(
        review.hotelId,
        review.content.text,
        {
          style: responseTone as 'professional' | 'friendly',
          length: responseLength as 'short' | 'medium' | 'long',
        }
      )
      
      // Aggiorniamo i messaggi senza chiudere la modal
      setMessages([{ id: 1, content: response, sender: "ai" }])
    } catch (error) {
      toast.error("Error generating response")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleViewDetails = (review: Review) => {
    // Implement view details logic
    console.log("Viewing details for review:", review)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !selectedReview) return

    setMessages((prev) => [...prev, { id: prev.length + 1, content: input, sender: "user" }])
    setInput("")
    setIsGenerating(true)

    try {
      const response = await generateResponse(
        selectedReview.hotelId,
        selectedReview.content.text,
        {
          style: responseTone as 'professional' | 'friendly',
          length: responseLength as 'short' | 'medium' | 'long',
        }
      )
      setMessages((prev) => [...prev, { id: prev.length + 1, content: response, sender: "ai" }])
    } catch (error) {
      toast.error("Error generating response")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh()
    }
    fetchReviews()
  }

  if (loading) {
    console.log('Loading reviews...')
    return <div>Loading...</div>
  }

  if (error) {
    console.error('Error loading reviews:', error)
    return <div>Error: {error}</div>
  }

  console.log('Rendering reviews:', reviews?.length || 0)

  return (
    <div className="w-full flex flex-col">
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id} 
                    className="bg-gray-50 first:rounded-tl-xl last:rounded-tr-xl"
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow 
                  key={row.id} 
                  data-state={row.getIsSelected() && "selected"}
                  className={index === table.getRowModel().rows.length - 1 ? "last-row" : ""}
                >
                  {row.getVisibleCells().map((cell, cellIndex) => (
                    <TableCell 
                      key={cell.id}
                      className={`
                        ${index === table.getRowModel().rows.length - 1 ? "last-row" : ""}
                        ${cellIndex === 0 ? "first-cell" : ""}
                        ${cellIndex === row.getVisibleCells().length - 1 ? "last-cell" : ""}
                      `}
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
                  className="h-24 text-center rounded-b-xl"
                >
                  Nessun risultato.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()} ({table.getFilteredRowModel().rows.length} results total)
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-9 px-4 rounded-full"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-9 px-4 rounded-full"
            >
              Next
            </Button>
          </div>
          
          <Select 
            value={resultsPerPage.toString()} 
            onValueChange={onResultsPerPageChange}
          >
            <SelectTrigger className="h-9 w-[160px] rounded-full border-gray-200 focus:border-primary focus:ring-primary bg-white text-sm">
              <SelectValue placeholder="Results per page" className="text-sm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10" className="text-sm">10 per page</SelectItem>
              <SelectItem value="20" className="text-sm">20 per page</SelectItem>
              <SelectItem value="50" className="text-sm">50 per page</SelectItem>
              <SelectItem value="100" className="text-sm">100 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] p-0 bg-white">
          <div className="h-full max-h-[90vh] flex flex-col">
            <DialogHeader className="px-4 py-2 border-b bg-white">
              <DialogTitle>Generated Response</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden p-4 bg-white">
              <ChatMessageList>
                {messages.map((message) => (
                  <ChatBubble key={message.id} variant={message.sender === "user" ? "sent" : "received"}>
                    <ChatBubbleAvatar
                      className="h-8 w-8 shrink-0"
                      src={
                        message.sender === "user" ? "https://github.com/shadcn.png" : "https://github.com/vercel.png"
                      }
                      fallback={message.sender === "user" ? "US" : "AI"}
                    />
                    <div className="flex flex-col">
                      <ChatBubbleMessage variant={message.sender === "user" ? "sent" : "received"}>
                        {message.content}
                      </ChatBubbleMessage>
                      {message.sender === "ai" && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(message.content)
                            toast.success("Response copied to clipboard")
                          }}
                          className="self-end mt-1 shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      )}
                    </div>
                  </ChatBubble>
                ))}

                {isGenerating && (
                  <ChatBubble variant="received">
                    <ChatBubbleAvatar className="h-8 w-8 shrink-0" src="https://github.com/vercel.png" fallback="AI" />
                    <ChatBubbleMessage isLoading />
                  </ChatBubble>
                )}
              </ChatMessageList>
            </div>
            <div className="border-t p-4 space-y-4 bg-white">
              <div className="flex items-center justify-between">
                <Label htmlFor="responseLength" className="text-sm font-medium">Response Length</Label>
                <Select value={responseLength} onValueChange={setResponseLength}>
                  <SelectTrigger className="w-[180px] h-9 rounded-full border-gray-200 focus:border-primary focus:ring-primary bg-white text-sm">
                    <SelectValue placeholder="Select length" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short" className="text-sm">Short</SelectItem>
                    <SelectItem value="medium" className="text-sm">Medium</SelectItem>
                    <SelectItem value="long" className="text-sm">Long</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="responseTone" className="text-sm font-medium">Response Tone</Label>
                <Select value={responseTone} onValueChange={setResponseTone}>
                  <SelectTrigger className="w-[180px] h-9 rounded-full border-gray-200 focus:border-primary focus:ring-primary bg-white text-sm">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly" className="text-sm">Friendly</SelectItem>
                    <SelectItem value="professional" className="text-sm">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="border-t p-4 bg-white">
              <form
                onSubmit={handleSubmit}
                className="relative rounded-full border bg-white focus-within:ring-1 focus-within:ring-primary"
              >
                <ChatInput
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="min-h-12 resize-none rounded-full bg-white border-0 p-3 pr-12 shadow-none focus-visible:ring-0"
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  className="absolute bottom-1.5 right-1.5 rounded-full shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all"
                >
                  <CornerDownLeft className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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