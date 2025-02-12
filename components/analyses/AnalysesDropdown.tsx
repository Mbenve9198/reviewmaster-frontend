import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { api } from "@/services/api"
import { toast } from "sonner"

interface Analysis {
  _id: string
  title: string
  hotelName: string
  createdAt: string
  reviewsAnalyzed: number
  analysis: {
    meta: {
      avgRating: string
    }
  }
}

interface AnalysesDropdownProps {
  value: Analysis | null
  onChange: (analysis: Analysis) => void
}

export function AnalysesDropdown({ value, onChange }: AnalysesDropdownProps) {
  const [open, setOpen] = React.useState(false)
  const [analyses, setAnalyses] = React.useState<Analysis[]>([])

  // Fetch analyses on mount
  React.useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const data = await api.analytics.getAnalyses()
        setAnalyses(data)
      } catch (error) {
        console.error('Error fetching analyses:', error)
        toast.error('Failed to load analyses')
      }
    }
    fetchAnalyses()
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between rounded-xl border-gray-200"
        >
          {value ? value.title : "Select analysis..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search analyses..." 
            className="h-9"
          />
          <CommandEmpty>No analyses found.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-auto">
            {analyses.map((analysis) => (
              <CommandItem
                key={analysis._id}
                value={analysis.title}
                onSelect={() => {
                  onChange(analysis)
                  setOpen(false)
                }}
                className="flex flex-col gap-1 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{analysis.title}</span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(analysis.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{analysis.hotelName}</span>
                  <Badge variant="secondary" className="text-xs">
                    {analysis.reviewsAnalyzed} reviews
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Avg. {analysis.analysis.meta.avgRating}★
                  </Badge>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 