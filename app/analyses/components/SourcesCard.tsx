"use client"

import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getCookie } from "@/lib/utils"
import { ChevronLeft, ChevronRight, FileText, Star, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface SourcesCardProps {
  analysisId: string
  isExpanded: boolean
  onToggleExpand: () => void
}

interface Source {
  id: string
  type: 'review' | 'pdf'
  title: string
  date: string
}

export default function SourcesCard({ analysisId, isExpanded, onToggleExpand }: SourcesCardProps) {
  const [sources, setSources] = useState<Source[]>([])
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSources = async () => {
      if (!analysisId) return
      setIsLoading(true)
      try {
        const token = getCookie('token')
        // Simulated API call - replace with actual endpoint
        const mockSources: Source[] = [
          { id: '1', type: 'review', title: 'Review Analysis', date: '2024-03-15' },
          { id: '2', type: 'pdf', title: 'Hotel Guidelines.pdf', date: '2024-03-14' },
          { id: '3', type: 'pdf', title: 'Customer Feedback.pdf', date: '2024-03-13' }
        ]
        setSources(mockSources)
      } catch (error) {
        console.error('Error fetching sources:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSources()
  }, [analysisId])

  const handleUpload = () => {
    // Implementare la logica di upload
    console.log('Upload clicked')
  }

  return (
    <div className="h-full bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden relative">
      {/* Header con bordo inferiore */}
      <div className="p-4 border-b border-gray-100/80 flex justify-between items-center bg-white/50">
        <h2 className="font-semibold text-gray-900">
          {isExpanded ? "Sources" : ""}
        </h2>
        <button
          onClick={onToggleExpand}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isExpanded ? (
            <ChevronLeft className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
        </button>
      </div>

      {/* Content */}
      <ScrollArea className="h-[calc(100%-8rem)]">
        <motion.div 
          className={`p-2 space-y-2 ${!isExpanded ? 'flex flex-col items-center' : ''}`}
          animate={{ opacity: isExpanded ? 1 : 0.5 }}
        >
          {sources.map(source => (
            <button
              key={source.id}
              onClick={() => setSelectedSource(source.id)}
              className={`${!isExpanded ? 'w-auto' : 'w-full'} p-3 rounded-xl text-left transition-all hover:scale-[0.98] ${
                selectedSource === source.id
                  ? 'bg-blue-50 border-blue-100 shadow-sm'
                  : 'hover:bg-gray-50/80 border-transparent'
              } border`}
            >
              <div className={`flex items-start gap-3 ${!isExpanded ? 'justify-center' : ''}`}>
                <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                  {source.type === 'review' ? (
                    <Star className="h-4 w-4 text-blue-500" />
                  ) : (
                    <FileText className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                {isExpanded && (
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {source.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(source.date).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                )}
              </div>
            </button>
          ))}
        </motion.div>
      </ScrollArea>

      {/* Footer with upload button */}
      {isExpanded && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white/50 backdrop-blur-sm">
          <Button
            onClick={handleUpload}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 text-sm bg-gray-50 border-gray-200 rounded-xl py-3 hover:bg-gray-100 hover:border-gray-300 transition-colors"
          >
            <Upload className="h-4 w-4 text-gray-500" />
            <span className="text-gray-700">Upload PDF</span>
          </Button>
        </div>
      )}
    </div>
  )
} 