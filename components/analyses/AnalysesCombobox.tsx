"use client"

import * as React from "react"
import { Check, ChevronsUpDown, CalendarIcon, Building } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DateRange } from "react-day-picker"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "react-hot-toast"
import { api } from "@/services/api"

interface Analysis {
  _id: string
  title: string
  hotelId: string
  hotelName: string
  createdAt: string
  reviewsAnalyzed: number
  metadata: {
    dateRange: {
      start: string
      end: string
    }
    platforms: string[]
    creditsUsed: number
  }
  analysis: {
    meta: {
      hotelName: string
      avgRating: string
    }
    sentiment: {
      excellent: string
      average: string
      needsImprovement: string
    }
    strengths: Array<{
      title: string
      impact: string
      quote: string
      details: string
      mentions: number
    }>
    issues: Array<{
      title: string
      priority: string
      quote: string
      details: string
      mentions: number
      solution: {
        title: string
        timeline: string
        cost: string
        roi: string
      }
    }>
    trends: Array<{
      metric: string
      change: string
      period: string
    }>
  }
  followUpSuggestions?: string[]
}

interface AnalysesComboboxProps {
  value: Analysis | null
  onChange: (analysis: Analysis) => void
}

export function AnalysesCombobox({ value, onChange }: AnalysesComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [analyses, setAnalyses] = React.useState<Analysis[]>([])
  const [filteredAnalyses, setFilteredAnalyses] = React.useState<Analysis[]>([])
  const [hotels, setHotels] = React.useState<{ id: string; name: string }[]>([])
  const [selectedHotel, setSelectedHotel] = React.useState<string>("")
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>()
  const [calendarOpen, setCalendarOpen] = React.useState(false)

  // Fetch analyses and hotels on mount
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [analysesData, hotelsData] = await Promise.all([
          api.analytics.getAnalyses(),
          api.hotels.getHotels()
        ]);

        setAnalyses(analysesData);
        setFilteredAnalyses(analysesData);
        setHotels(hotelsData);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast.error(error.message || 'Failed to load data');
      }
    }
    fetchData()
  }, [])

  // Filter analyses based on search, hotel, and date range
  const filterAnalyses = React.useCallback((searchTerm: string = "") => {
    let filtered = [...analyses]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(analysis =>
        analysis.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.hotelName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by selected hotel
    if (selectedHotel && selectedHotel !== "all") {
      filtered = filtered.filter(analysis => analysis.hotelId === selectedHotel)
    }

    // Filter by date range
    if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter(analysis => {
        const analysisDate = new Date(analysis.createdAt)
        return analysisDate >= dateRange.from! && analysisDate <= dateRange.to!
      })
    }

    setFilteredAnalyses(filtered)
  }, [analyses, selectedHotel, dateRange])

  // Handle search input change
  const handleSearch = (search: string) => {
    filterAnalyses(search)
  }

  return (
    <>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        onClick={() => setOpen(true)}
      >
        {value ? value.title : "Select analysis..."}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[800px]">
          <DialogTitle>Select Analysis</DialogTitle>
          <DialogDescription>
            Select an analysis to view details and insights
          </DialogDescription>
          
          <div className="flex items-center gap-4 p-6 border-b border-gray-100">
            <Select
              value={selectedHotel}
              onValueChange={(value) => {
                setSelectedHotel(value)
                filterAnalyses()
              }}
            >
              <SelectTrigger className="w-[200px] rounded-xl border-gray-200 focus:border-primary focus:ring-primary bg-white/50">
                <Building className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select hotel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All hotels</SelectItem>
                {hotels.map((hotel) => (
                  <SelectItem 
                    key={hotel.id} 
                    value={hotel.id}
                    className="text-sm py-2 px-4"
                  >
                    {hotel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal rounded-xl border-gray-200 focus:border-primary focus:ring-primary bg-white/50",
                    !dateRange?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange?.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xl border-gray-200" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    setDateRange(range)
                    setCalendarOpen(false)
                    filterAnalyses()
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Command className="rounded-lg border shadow-md">
            <CommandInput 
              placeholder="Search analyses..." 
              className="h-9 text-sm rounded-xl border-gray-200 focus:border-primary focus:ring-primary bg-white/50"
            />
            <CommandEmpty>No analyses found.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {filteredAnalyses.map((analysis) => (
                <CommandItem
                  key={analysis._id}
                  value={analysis.title}
                  onSelect={() => {
                    onChange(analysis)
                    setOpen(false)
                  }}
                  className="px-4 py-2 hover:bg-gray-50"
                >
                  <div className="flex flex-col w-full gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{analysis.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(analysis.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{analysis.hotelName}</span>
                      <Separator orientation="vertical" className="h-4" />
                      <Badge variant="secondary" className="rounded-full">
                        {analysis.reviewsAnalyzed} reviews
                      </Badge>
                      <Badge variant="secondary" className="rounded-full">
                        Avg. {analysis.analysis.meta.avgRating}★
                      </Badge>
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value?._id === analysis._id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
} 