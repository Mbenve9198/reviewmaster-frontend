"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getCookie } from "@/lib/utils"
import { ChevronLeft, ChevronRight, FileText, Star, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface SourcesCardProps {
  analysisId: string
  isExpanded: boolean
  onToggleExpand: () => void
}

interface Source {
  id: string
  type: 'review-group' | 'all-reviews'
  title: string
  category: 'strengths' | 'issues'
  itemId?: string
  count: number
  reviews?: Array<{
    id: string
    text: string
    rating: number
    date: string
    platform: string
  }>
}

export interface SourcesCardRef {
  openDocument: (category: string, itemId: string, title: string) => void
}

const SourcesCard = forwardRef<SourcesCardRef, SourcesCardProps>(({ 
  analysisId, 
  isExpanded, 
  onToggleExpand 
}, ref) => {
  const [sources, setSources] = useState<Source[]>([])
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [selectedReviews, setSelectedReviews] = useState<any[]>([])
  const [selectedTitle, setSelectedTitle] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'document'>('list')

  useImperativeHandle(ref, () => ({
    openDocument: (category: string, itemId: string, title: string) => {
      const source = sources.find(s => s.category === category && s.itemId === itemId)
      if (source) {
        setSelectedTitle(title)
        setViewMode('document')
        handleSourceClick(source)
      }
    }
  }))

  const fetchGroupedReviews = async (source: Source) => {
    if (!source.itemId) return;
    
    try {
      const token = getCookie('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/${analysisId}/reviews/${source.category}/${source.itemId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch reviews');
      
      const data = await response.json();
      setSelectedReviews(data.reviews);
    } catch (error) {
      console.error('Error fetching grouped reviews:', error);
    }
  };

  useEffect(() => {
    const fetchSources = async () => {
      if (!analysisId) return;
      setIsLoading(true);
      try {
        const token = getCookie('token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/${analysisId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          }
        );
        
        if (!response.ok) throw new Error('Failed to fetch analysis');
        
        const data = await response.json();
        const analysis = data.analysis;
        
        // Creiamo le fonti dai dati dell'analisi
        const sourcesData: Source[] = [
          {
            id: 'all',
            type: 'all-reviews',
            title: 'All Reviews',
            category: 'all',
            count: analysis.meta.reviewCount
          },
          ...analysis.strengths.map((s: any) => ({
            id: s._id,
            type: 'review-group',
            title: s.title,
            category: 'strengths',
            itemId: s._id,
            count: s.mentions
          })),
          ...analysis.issues.map((i: any) => ({
            id: i._id,
            type: 'review-group',
            title: i.title,
            category: 'issues',
            itemId: i._id,
            count: i.mentions
          }))
        ];
        
        setSources(sourcesData);
      } catch (error) {
        console.error('Error fetching sources:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSources();
  }, [analysisId]);

  const handleSourceClick = async (source: Source) => {
    setSelectedSource(source.id)
    setSelectedTitle(source.title)
    setViewMode('document')
    await fetchGroupedReviews(source)
  }

  const handleBackToList = () => {
    setViewMode('list')
    setSelectedSource(null)
    setSelectedReviews([])
  }

  const handleUpload = () => {
    // Implementare la logica di upload
    console.log('Upload clicked')
  }

  return (
    <div className="h-full bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100/80 flex justify-between items-center bg-white/50">
        <h2 className="font-semibold text-gray-900 truncate flex-1">
          {isExpanded ? (viewMode === 'list' ? "Sources" : selectedTitle) : ""}
        </h2>
        <div className="flex items-center gap-2 flex-shrink-0">
          {viewMode === 'document' && (
            <button
              onClick={handleBackToList}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          )}
          <button
            onClick={onToggleExpand}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="h-[calc(100%-8rem)]">
        {viewMode === 'list' ? (
          <motion.div className={`p-2 space-y-2 ${!isExpanded ? 'flex flex-col items-center' : ''}`}>
            {sources.map(source => (
              <button
                key={source.id}
                onClick={() => handleSourceClick(source)}
                className={`
                  ${!isExpanded ? 'w-auto' : 'w-full'} 
                  p-3 rounded-xl text-left transition-all hover:scale-[0.98] 
                  ${selectedSource === source.id
                    ? 'bg-blue-50 border-blue-100 shadow-sm'
                    : 'hover:bg-gray-50/80 border-transparent'
                  } 
                  border
                `}
              >
                <div className={`flex items-start gap-3 ${!isExpanded ? 'justify-center' : ''}`}>
                  <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                    {source.type === 'all-reviews' ? (
                      <FileText className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Star className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  {isExpanded && (
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-medium text-sm text-gray-900 break-words line-clamp-2">
                          {source.title}
                        </p>
                        <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                          {source.count} reviews
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 space-y-4"
          >
            {selectedReviews.map((review, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
              >
                <p className="text-gray-800 mb-2 break-words">
                  {review.text}
                </p>
                <div className="flex justify-between items-center text-sm text-gray-500 flex-wrap gap-2">
                  <span className="break-words">{review.platform}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span>{new Date(review.date).toLocaleDateString()}</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span>{review.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
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
})

SourcesCard.displayName = 'SourcesCard'

export default SourcesCard 