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
  }
  analysis: {
    meta: {
      avgRating: string
    }
  }
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
  const [dateRange, setDateRange] = React.useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })

  // Fetch analyses and hotels on mount
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [analysesData, hotelsData] = await Promise.all([
          fetch('/api/analyses').then(res => res.json()),
          fetch('/api/hotels').then(res => res.json())
        ])
        setAnalyses(analysesData)
        setFilteredAnalyses(analysesData)
        setHotels(hotelsData)
      } catch (error) {
        console.error('Error fetching data:', error)
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
    if (selectedHotel) {
      filtered = filtered.filter(analysis => analysis.hotelId === selectedHotel)
    }

    // Filter by date range
    if (dateRange.from && dateRange.to) {
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? value.title : "Select analysis..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0">
        {/* Filters */}
        <div className="flex items-center gap-2 p-2 border-b">
          <Select
            value={selectedHotel}
            onValueChange={(value) => {
              setSelectedHotel(value)
              filterAnalyses()
            }}
          >
            <SelectTrigger className="w-[200px]">
              <Building className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select hotel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All hotels</SelectItem>
              {hotels.map((hotel) => (
                <SelectItem key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !dateRange.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
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
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range || { from: undefined, to: undefined })
                  filterAnalyses()
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Command>
          <CommandInput 
            placeholder="Search analyses..." 
            onValueChange={handleSearch}
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
                    <Badge variant="secondary">
                      {analysis.reviewsAnalyzed} reviews
                    </Badge>
                    <Badge variant="secondary">
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
      </PopoverContent>
    </Popover>
  )
} 