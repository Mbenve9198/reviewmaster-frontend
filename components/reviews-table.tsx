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

import useReviews from "@/store/useReviews"
import { type Review } from "@/types/types"
import { toast } from "sonner"
import { getCookie } from "cookies-next"

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

// Definizione dei tipi
type MessageSender = "user" | "ai";

interface ChatMessage {
  id: number;
  content: string;
  sender: MessageSender;
}

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

export const ReviewsTable = ({
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
}: ReviewsTableProps) => {
  const { reviews, loading, error, fetchReviews, setFilters, generateResponse } = useReviews()

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [responseLength, setResponseLength] = useState("medium")
  const [responseTone, setResponseTone] = useState("professional")

  const chatContainerRef = useRef<HTMLDivElement>(null);

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
          className="rounded-lg border-gray-200 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
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
                className="rounded-xl flex items-center gap-2 bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all"
              >
                <MessageSquare className="h-4 w-4" />
                Generate
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="rounded-xl bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-[160px] bg-white rounded-xl border border-gray-200"
                >
                  <DropdownMenuItem
                    onClick={() => handleDeleteReview(row.original._id)}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-lg mx-1 my-1"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Review
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

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

  const handleCustomResponse = (review: Review) => {
    // Implement custom response logic
    console.log("Custom response for review:", review)
  }

  const handleViewDetails = (review: Review) => {
    // Implement view details logic
    console.log("Viewing details for review:", review)
  }

  const handleChatSubmit = async (input: string) => {
    if (!input.trim() || !selectedReview) return;
    
    setIsGenerating(true);
    setInput(''); // Clear input after sending
    
    try {
      const newUserMessage: ChatMessage = { 
        id: messages.length + 1, 
        content: input, 
        sender: "user" as MessageSender
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      
      const response = await generateResponse(
        selectedReview.hotelId,
        selectedReview.content.text,
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
    } finally {
      setIsGenerating(false);
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

  const handleResultsPerPageChange = (value: string) => {
    onResultsPerPageChange(parseInt(value));
  };

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
    <div className="w-full flex justify-center">
      <div className="w-fit">
        <div className="rounded-xl border border-gray-200 bg-white">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
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
                      <TableCell key={cell.id}>
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
      </div>
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