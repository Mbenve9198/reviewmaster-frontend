"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getCookie } from "@/lib/utils"
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import SourcesCard from "./components/SourcesCard"
import AnalysisCard from "./components/AnalysisCard"
import ChatCard from "./components/ChatCard"

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
  analysis: any
  createdAt: string
}

export default function AnalysesPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [sourcesExpanded, setSourcesExpanded] = useState(true)
  const [chatExpanded, setChatExpanded] = useState(true)

  // Calcolo delle larghezze delle card in base allo stato
  const getWidths = () => {
    const sourcesWidth = sourcesExpanded ? "20%" : "10%"
    const chatWidth = chatExpanded ? "30%" : "10%"
    const analysisWidth = `${100 - (sourcesExpanded ? 20 : 10) - (chatExpanded ? 30 : 10)}%`
    return { sourcesWidth, analysisWidth, chatWidth }
  }

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const token = getCookie('token')
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analyses`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        })
        
        if (!response.ok) throw new Error('Failed to fetch analyses')
        
        const data = await response.json()
        setAnalyses(data)
        
        if (data.length > 0) {
          setSelectedAnalysis(data[0]._id)
        }
      } catch (error) {
        console.error('Error fetching analyses:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalyses()
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const { sourcesWidth, analysisWidth, chatWidth } = getWidths()

  return (
    <div className="py-6 pl-20 pr-6 space-y-6">
      {/* Modern gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#FAFAFB] via-[#F0F0F2] to-[#FAFAFB] backdrop-blur-sm" />

      {/* Header */}
      <div className="flex flex-col items-start px-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue-600 to-blue-400" />
          <h1 className="text-2xl sm:text-3xl font-semibold bg-gradient-to-b from-blue-800 to-blue-600 bg-clip-text text-transparent">
            Review Analysis
          </h1>
        </div>
        <p className="text-sm text-gray-500">
          View and analyze your review insights
        </p>
      </div>

      {/* Analysis Selector */}
      <div className="px-2">
        <Select value={selectedAnalysis} onValueChange={setSelectedAnalysis}>
          <SelectTrigger className="h-8 w-[250px] bg-white rounded-xl border-gray-200 hover:border-gray-300 text-sm">
            <SelectValue placeholder="Select analysis" />
          </SelectTrigger>
          <SelectContent>
            {analyses.map(analysis => (
              <SelectItem key={analysis._id} value={analysis._id} className="text-sm">
                {analysis.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <div className="flex gap-3 h-[calc(100vh-8.5rem)]">
        <motion.div 
          className="relative"
          animate={{ width: sourcesWidth }}
          transition={{ duration: 0.3 }}
        >
          <SourcesCard 
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
          <AnalysisCard analysisId={selectedAnalysis} />
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
  )
}