"use client"

import { useState, useEffect, useRef } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getCookie } from "@/lib/utils"
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import SourcesCard from "./components/SourcesCard"
import AnalysisCard from "./components/AnalysisCard"
import ChatCard from "./components/ChatCard"
import { useSearchParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface Analysis {
  _id: string
  title: string
  metadata: {
    platforms: string[]
    dateRange: {
      start: string
      end: string
    }
  }
  analysis: {
    meta: {
      hotelName: string
    }
  }
  createdAt: string
}

export default function AnalysesPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>("")
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [sourcesExpanded, setSourcesExpanded] = useState(true)
  const [chatExpanded, setChatExpanded] = useState(true)
  const searchParams = useSearchParams()
  const analysisId = searchParams.get('id')
  const isGenerating = searchParams.get('loading') === 'true'
  const [isAnalysisReady, setIsAnalysisReady] = useState(false)
  const router = useRouter()
  const sourcesRef = useRef<{ openDocument: (category: string, itemId: string, title: string) => void } | null>(null)

  // Calcolo delle larghezze delle card in base allo stato
  const getWidths = () => {
    const sourcesWidth = sourcesExpanded ? "20%" : "60px"
    const chatWidth = chatExpanded ? "30%" : "10%"
    const analysisWidth = `calc(100% - ${sourcesExpanded ? "20%" : "60px"} - ${chatExpanded ? "30%" : "10%"})`
    return { sourcesWidth, analysisWidth, chatWidth }
  }

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const token = getCookie('token')
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        })
        
        if (!response.ok) throw new Error('Failed to fetch analyses')
        
        const data = await response.json()
        console.log('Analyses fetched:', data) // Debug log
        
        if (Array.isArray(data)) {
          setAnalyses(data)
          // Se c'è un analysisId nell'URL, usalo, altrimenti usa il primo dell'array
          if (data.length > 0) {
            setSelectedAnalysis(analysisId || data[0]._id)
          }
        } else {
          console.error('Expected array of analyses but got:', data)
          setAnalyses([])
        }
      } catch (error) {
        console.error('Error fetching analyses:', error)
        setAnalyses([])
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchAnalyses()
  }, [analysisId]) // Aggiunto analysisId come dipendenza

  useEffect(() => {
    if (analysisId) {
      // Se c'è un ID nell'URL, selezionalo automaticamente
      setSelectedAnalysis(analysisId)
    }
  }, [analysisId])

  useEffect(() => {
    if (!analysisId) return

    const checkAnalysis = async () => {
      try {
        const token = getCookie('token')
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/${analysisId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        })
        
        if (response.ok) {
          setIsAnalysisReady(true)
          if (searchParams.get('loading')) {
            router.replace(`/analyses?id=${analysisId}`)
          }
        }
      } catch (error) {
        console.error('Error checking analysis:', error)
      }
    }

    const interval = setInterval(checkAnalysis, 2000) // Controlla ogni 2 secondi
    return () => clearInterval(interval)
  }, [analysisId])

  const handleSourceClick = (category: string, itemId: string, title: string) => {
    // Espandi la SourcesCard se è contratta
    if (!sourcesExpanded) {
      setSourcesExpanded(true)
    }
    
    // Aspetta che l'espansione sia completata prima di aprire il documento
    setTimeout(() => {
      if (sourcesRef.current) {
        sourcesRef.current.openDocument(category, itemId, title)
      }
    }, 300) // Corrisponde alla durata dell'animazione di espansione
  }

  if (isLoadingData || isGenerating) {
    return (
      <div className="h-full bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {isGenerating ? "Analyzing Reviews..." : "Loading..."}
          </h3>
          <p className="text-sm text-gray-500">
            {isGenerating 
              ? "We're processing your selected reviews to generate insights. This may take a few moments."
              : "Loading your analysis..."}
          </p>
        </div>
      </div>
    )
  }

  const { sourcesWidth, analysisWidth, chatWidth } = getWidths()

  return (
    <div className="min-h-screen pl-24 pr-8">
      {/* Modern gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#FAFAFB] via-[#F0F0F2] to-[#FAFAFB] backdrop-blur-sm" />

      {/* Header normale (non fixed) */}
      <div className="pt-8 pb-4">
        <div className="flex justify-between items-center">
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue-600 to-blue-400" />
              <h1 className="text-3xl sm:text-4xl font-semibold bg-gradient-to-b from-blue-800 to-blue-600 bg-clip-text text-transparent">
                Analysis
              </h1>
            </div>
            <p className="text-base text-gray-500">
              View and analyze your hotel reviews
            </p>
          </div>

          <Select value={selectedAnalysis} onValueChange={setSelectedAnalysis}>
            <SelectTrigger className="w-[300px] h-10 bg-white border-gray-200 hover:border-gray-300 rounded-xl">
              <SelectValue placeholder="Select analysis" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              <ScrollArea className="h-full max-h-[200px]">
                {analyses.map(analysis => (
                  <SelectItem 
                    key={analysis._id} 
                    value={analysis._id}
                    className="text-gray-900"
                  >
                    {analysis.analysis?.meta?.hotelName 
                      ? `${analysis.analysis.meta.hotelName} - ${format(new Date(analysis.createdAt), 'dd MMM yyyy')}`
                      : format(new Date(analysis.createdAt), 'PPP')
                    }
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="mt-4">
        {!isAnalysisReady && analysisId && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
              <p className="text-lg font-medium text-gray-900">Creating your analysis...</p>
              <p className="text-sm text-gray-500">This may take a few moments</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 h-[calc(100vh-8.5rem)]">
          <motion.div 
            className="relative"
            style={{ minWidth: sourcesExpanded ? "300px" : "60px" }}
            animate={{ width: sourcesWidth }}
            transition={{ duration: 0.3 }}
          >
            <SourcesCard 
              ref={sourcesRef}
              analysisId={selectedAnalysis}
              isExpanded={sourcesExpanded}
              onToggleExpand={() => setSourcesExpanded(!sourcesExpanded)}
            />
          </motion.div>

          <motion.div
            className="relative"
            animate={{ width: analysisWidth }}
            transition={{ duration: 0.3 }}
          >
            <AnalysisCard 
              analysisId={selectedAnalysis}
              onSourceClick={handleSourceClick}
            />
          </motion.div>

          <motion.div
            className="relative"
            animate={{ width: chatWidth }}
            transition={{ duration: 0.3 }}
          >
            <ChatCard 
              analysisId={selectedAnalysis}
              isExpanded={chatExpanded}
              onToggleExpand={() => setChatExpanded(!chatExpanded)}
            />
          </motion.div>
        </div>
      </div>
    </div>
  )
}