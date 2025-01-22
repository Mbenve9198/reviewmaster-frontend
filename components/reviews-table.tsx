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
  setPlatform: (value: string) => void
  setProperty: (value: string) => void
  setRatingFilter: (value: string) => void
  setResultsPerPage: (value: string) => void
  setSearchQuery: (value: string) => void
  onRefresh?: () => void
}

export const ReviewsTable = ({
  searchQuery,
  responseStatus,
  platform,
  ratingFilter,
  resultsPerPage,
  setPlatform,
  setRatingFilter,
  setResultsPerPage,
  setSearchQuery,
  property,
  setProperty,
  onRefresh,
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
  const [isLoading, setIsLoading] = useState(false)
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
    },
    {
      id: "platform",
      accessorKey: "platform",
      header: "Platform",
      enableHiding: true,
      cell: ({ row }) => {
        const platform = row.original.platform as Platform
        return (
          <div className="flex items-center justify-center">
            <Image
              src={logoUrls[platform] || "/placeholder.svg"}
              alt={`${platform} logo`}
              width={logoSizes[platform]?.width || 24}
              height={logoSizes[platform]?.height || 24}
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
            className="hidden sm:flex"
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const dateStr = row.original.metadata?.originalCreatedAt
        if (!dateStr) return "No date"
        
        const date = new Date(dateStr)
        return <div className="hidden sm:block">
          {date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </div>
      },
      enableHiding: true,
    },
    {
      id: "rating",
      accessorFn: (row) => row.content?.rating,
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Rating
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const rating = row.original.content?.rating
        const platform = row.original.platform
        if (!rating) return "No rating"
        const displayRating = platform === "booking" ? `${rating}/10` : `${rating}/5`
        return <div className="text-center">{displayRating}</div>
      },
      enableHiding: true,
    },
    {
      id: "reviewer",
      accessorFn: (row) => row.content?.reviewerName,
      header: "Reviewer",
      cell: ({ row }) => {
        const reviewerName = row.original.content?.reviewerName
        return <div className="hidden sm:block">{reviewerName || "Anonymous"}</div>
      },
      enableHiding: true,
    },
    {
      id: "review",
      accessorFn: (row) => row.content?.text,
      header: "Review",
      enableHiding: true,
      cell: ({ row }) => {
        const content = row.original.content?.text
        const [isExpanded, setIsExpanded] = useState(false)
        return (
          <div className="max-w-[200px] sm:max-w-md cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            {!content ? "No content" : (isExpanded ? content : `${content.substring(0, 50)}...`)}
          </div>
        )
      },
    },
    {
      id: "response",
      accessorFn: (row) => row.response?.text,
      header: "Generated Response",
      enableHiding: true,
      cell: ({ row }) => {
        const response = row.original.response?.text
        const [isExpanded, setIsExpanded] = useState(false)
        return (
          <div className="max-w-[200px] sm:max-w-md cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            {!response ? "No response generated" : (isExpanded ? response : `${response.substring(0, 50)}...`)}
          </div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const review = row.original
        
        return (
          <ButtonGroup className="shadow-sm">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGenerateResponse(review)}
              className="px-3 bg-background text-foreground hover:bg-accent hover:text-accent-foreground border-r"
            >
              <MessageSquare className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Generate</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="px-2 bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleViewDetails(review)}>View Details</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(review._id)}>
                  Copy Review ID
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
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
    },
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
    setIsLoading(true)

    try {
      const response = await generateResponse(
        review.hotelId,
        review.content.text,
        {
          style: responseTone as 'professional' | 'friendly',
          length: responseLength as 'short' | 'medium' | 'long',
        }
      )
      setMessages([{ id: 1, content: response, sender: "ai" }])
      setIsLoading(false)
    } catch (error) {
      toast.error("Error generating response")
      setIsLoading(false)
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
    setIsLoading(true)

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
      setIsLoading(false)
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
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          className="bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
        >
          Refresh
        </Button>
      </div>
      <div className="rounded-md border bg-background flex-1 overflow-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] p-0 bg-background">
          <div className="h-full max-h-[90vh] flex flex-col">
            <DialogHeader className="px-4 py-2 border-b">
              <DialogTitle>Generated Response</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden p-4">
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
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(message.content)
                            toast.success("Response copied to clipboard")
                          }}
                          className="self-end mt-1"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      )}
                    </div>
                  </ChatBubble>
                ))}

                {isLoading && (
                  <ChatBubble variant="received">
                    <ChatBubbleAvatar className="h-8 w-8 shrink-0" src="https://github.com/vercel.png" fallback="AI" />
                    <ChatBubbleMessage isLoading />
                  </ChatBubble>
                )}
              </ChatMessageList>
            </div>
            <div className="border-t p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="responseLength">Response Length</Label>
                <Select value={responseLength} onValueChange={setResponseLength}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select length" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="long">Long</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="responseTone">Response Tone</Label>
                <Select value={responseTone} onValueChange={setResponseTone}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="border-t p-4">
              <form
                onSubmit={handleSubmit}
                className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring"
              >
                <ChatInput
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
                />
                <Button type="submit" size="sm" className="absolute bottom-2 right-2">
                  <CornerDownLeft className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Select value={resultsPerPage.toString()} onValueChange={setResultsPerPage}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Results per page" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="50">50 per page</SelectItem>
            <SelectItem value="100">100 per page</SelectItem>
          </SelectContent>
        </Select>
        <ButtonGroup>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Next
          </Button>
        </ButtonGroup>
      </div>
    </div>
  )
}