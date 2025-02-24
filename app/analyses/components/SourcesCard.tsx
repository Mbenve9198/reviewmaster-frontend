"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getCookie } from "@/lib/utils"
import { ChevronLeft, ChevronRight, FileText, Star, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Image from "next/image"
import { MessageSquare } from "lucide-react"

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

interface Review {
  id: string;
  text: string;
  rating: number;
  date: string;
  platform: string;
  author?: string;
  response?: {
    createdAt: string;
    text: string;
  };
}

export interface SourcesCardRef {
  openDocument: (category: string, itemId: string, title: string) => void
}

// Aggiungiamo il tipo Platform
type Platform = 'google' | 'booking' | 'tripadvisor' | 'manual'

// Aggiungiamo gli stessi logoUrls che usiamo nella ReviewsTable
const logoUrls: Record<Platform, string> = {
  google: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/gmg-logo-300x300-1-YhBm2cRJdd8cFKdb5h4uv3cwYooXY7.webp",
  booking: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bookingcom-1-s1MP7yjsBCisV79VmZojIZ9Euh0Qn6.svg",
  tripadvisor: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Tripadvisor_logoset_solid_green-qRQkWYtDeBXNC1eNGeutQj1W40i036.svg",
  manual: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/manual%20response-O89S3zfgiDHVSo8aslEIqW3O8G9Q1n.png"
}

// Aggiungiamo una funzione helper per determinare il rating massimo per piattaforma
const getMaxRating = (platform: Platform): number => {
  switch (platform) {
    case 'booking':
      return 10;
    default:
      return 5;
  }
};

// Aggiungiamo una funzione helper per determinare il colore del rating
const getRatingColor = (rating: number, maxRating: number) => {
  const normalizedRating = (rating / maxRating) * 5; // Normalizziamo su scala 5
  if (normalizedRating >= 4) {
    return 'text-emerald-700 bg-emerald-50';
  } else if (normalizedRating >= 3) {
    return 'text-amber-700 bg-amber-50';
  } else {
    return 'text-rose-700 bg-rose-50';
  }
};

const SourcesCard = forwardRef<SourcesCardRef, SourcesCardProps>(({ 
  analysisId, 
  isExpanded, 
  onToggleExpand 
}, ref) => {
  const [sources, setSources] = useState<Source[]>([])
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [selectedReviews, setSelectedReviews] = useState<Review[]>([])
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
      console.log('Raw reviews data:', {
        count: data.reviews.length,
        reviews: data.reviews
      });
      
      // Rimuoviamo i duplicati usando un Set con gli ID
      const uniqueReviews = Array.from(
        new Map(data.reviews.map((review: Review) => [review.id, review])).values()
      ) as Review[];

      console.log('After deduplication:', {
        originalCount: data.reviews.length,
        uniqueCount: uniqueReviews.length,
        duplicatesRemoved: data.reviews.length - uniqueReviews.length
      });
      
      // Ordiniamo per data, più recenti prima
      const sortedReviews = uniqueReviews.sort((a: Review, b: Review) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setSelectedReviews(sortedReviews);
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
    <div className="h-full bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden relative flex flex-col">
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
      <ScrollArea className="flex-1 w-full overflow-hidden">
        {viewMode === 'list' ? (
          <div className="p-4">
            <div className={`
              ${isExpanded ? 'space-y-3 pr-4' : 'space-y-1'}
            `}>
              {sources.map(source => (
                <motion.button
                  key={source.id}
                  onClick={() => handleSourceClick(source)}
                  className={`
                    w-full
                    ${isExpanded ? 'py-4' : 'py-3'} 
                    rounded-xl text-left transition-all hover:scale-[0.98] 
                    ${selectedSource === source.id
                      ? 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 shadow-md'
                      : 'bg-gradient-to-br from-white to-gray-50/50 hover:from-gray-50 hover:to-gray-100/50 border-gray-200'
                    } 
                    border shadow-sm hover:shadow-md
                    max-w-full overflow-hidden
                  `}
                >
                  <div className={`
                    ${isExpanded 
                      ? 'flex items-center gap-2 px-2' 
                      : 'flex justify-center items-center'}
                  `}>
                    <div className={`
                      ${isExpanded ? 'p-2.5' : 'p-1'} 
                      rounded-lg flex-shrink-0 
                      ${selectedSource === source.id ? 'text-blue-700' : 'text-blue-600'}
                    `}>
                      {source.type === 'all-reviews' ? (
                        <FileText className="h-4 w-4" />
                      ) : (
                        <Star className="h-4 w-4" />
                      )}
                    </div>
                    {isExpanded && (
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start gap-1">
                          <h3 className="font-medium text-sm text-gray-900 break-words line-clamp-2 max-w-[70%]">
                            {source.title}
                          </h3>
                          <span className={`
                            px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0
                            ${selectedSource === source.id
                              ? 'bg-blue-100/50 text-blue-700'
                              : 'bg-gray-100/50 text-gray-600'
                            }
                          `}>
                            {source.count} reviews
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {source.type === 'all-reviews' 
                            ? 'Complete analysis dataset'
                            : `${source.category === 'strengths' ? 'Strength' : 'Issue'} analysis group`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          viewMode === 'document' ? (
            selectedReviews.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-4 ${isExpanded ? 'px-6' : 'px-4'} space-y-4`}
              >
                <div className="mb-4 text-sm text-gray-500">
                  Showing {selectedReviews.length} reviews
                </div>
                {selectedReviews.map((review, idx) => (
                  <motion.div 
                    key={review.id}
                    className={`
                      bg-gradient-to-br from-white to-gray-50/50 rounded-xl 
                      p-4 shadow-sm border border-gray-200
                    `}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    {/* Header con info recensore e rating */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 relative flex-shrink-0">
                          <Image
                            src={logoUrls[review.platform as Platform] || "/placeholder.svg"}
                            alt={`${review.platform} logo`}
                            width={24}
                            height={24}
                            className="object-contain"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {review.author || 'Guest'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(review.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg">
                        <div className={`
                          flex items-center gap-1.5 px-2.5 py-1 rounded-lg
                          ${getRatingColor(review.rating, getMaxRating(review.platform as Platform))}
                        `}>
                          <Star className={`h-3.5 w-3.5 ${
                            review.rating >= (getMaxRating(review.platform as Platform) * 0.8)
                              ? 'text-emerald-500 fill-emerald-500'
                              : review.rating >= (getMaxRating(review.platform as Platform) * 0.6)
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-rose-500 fill-rose-500'
                          }`} />
                          <span className="text-sm font-medium">
                            {review.rating}/{getMaxRating(review.platform as Platform)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contenuto recensione */}
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap break-words mt-3">
                      {review.text}
                    </p>

                    {/* Response status se presente */}
                    {review.response && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Response sent {new Date(review.response.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                No reviews available
              </div>
            )
          ) : (
            <div className="p-4 text-center text-gray-500">
              No reviews available
            </div>
          )
        )}
      </ScrollArea>

      {/* Footer with upload button */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-100 bg-white/50 backdrop-blur-sm">
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