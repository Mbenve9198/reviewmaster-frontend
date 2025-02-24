"use client"

import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getCookie } from "@/lib/utils"
import { Loader2, TrendingUp, TrendingDown, Star, AlertTriangle, Zap, BarChart, Link } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"

interface Strength {
  _id: string
  title: string
  impact: string
  mentions: number
  quote: string
  details: string
  marketingTips: Array<{
    action: string
    cost: string
    roi: string
  }>
}

interface Issue {
  _id: string
  title: string
  priority: string
  impact: string
  mentions: number
  quote: string
  details: string
  solution: {
    title: string
    timeline: string
    cost: string
    roi: string
    steps: string[]
  }
}

interface Analysis {
  meta: {
    hotelName: string
    reviewCount: number
    avgRating: number
    platforms: string
  }
  sentiment: {
    excellent: string
    average: string
    needsImprovement: string
    distribution: {
      rating5: string
      rating4: string
      rating3: string
      rating2: string
      rating1: string
    }
  }
  strengths: Strength[]
  issues: Issue[]
  quickWins: Array<{
    action: string
    timeline: string
    cost: string
    impact: string
  }>
  trends: Array<{
    metric: string
    change: string
    period: string
  }>
}

interface AnalysisCardProps {
  analysisId: string
  onSourceClick: (category: string, itemId: string, title: string) => void
}

export default function AnalysisCard({ analysisId, onSourceClick }: AnalysisCardProps) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!analysisId) return
      setIsLoading(true)
      try {
        const token = getCookie('token')
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/${analysisId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        })
        
        if (!response.ok) throw new Error('Failed to fetch analysis')
        
        const data = await response.json()
        if (data && data.analysis) {
          setAnalysis(data.analysis)
        }
      } catch (error) {
        console.error('Error fetching analysis:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalysis()
  }, [analysisId])

  // Funzione helper per verificare la presenza dei dati necessari
  const hasSentimentData = (analysis: Analysis | null): boolean => {
    return !!(
      analysis?.sentiment?.distribution?.rating5 &&
      analysis?.sentiment?.excellent &&
      analysis?.sentiment?.needsImprovement
    )
  }

  if (isLoading) {
    return (
      <div className="h-full bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!analysis || !analysis.meta) {
    return (
      <div className="h-full bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg flex items-center justify-center">
        <p className="text-gray-500">No analysis data available</p>
      </div>
    )
  }

  // Modifica il rendering della Sentiment Distribution card
  const renderSentimentDistribution = () => {
    if (!analysis || !hasSentimentData(analysis)) {
      return (
        <div className="text-sm text-amber-700">
          Sentiment data not available
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-700 w-8">5★</span>
          <Progress 
            value={parseInt(analysis.sentiment.distribution.rating5)} 
            className="h-2" 
          />
          <span className="text-xs text-amber-700 w-12">
            {analysis.sentiment.distribution.rating5}
          </span>
        </div>
        {/* Ripeti per gli altri rating se necessario */}
      </div>
    )
  }

  // Modifica il rendering della Quick Stats card
  const renderQuickStats = () => {
    if (!analysis || !hasSentimentData(analysis)) {
      return (
        <div className="text-sm text-emerald-700">
          Stats not available
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-emerald-700">Excellent</span>
          <span className="text-lg font-medium text-emerald-900">
            {analysis.sentiment.excellent}
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-emerald-700">Needs Improvement</span>
          <span className="text-lg font-medium text-emerald-900">
            {analysis.sentiment.needsImprovement}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-[#f5f3f2] backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden relative">
      {/* Background pattern */}
      <div className="absolute inset-0" 
        style={{
          backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/time-TwOS9MlmcnNjFliDrzz3oYOiD1LvVk.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: "0.3"
        }}>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header fisso */}
        <div className="sticky top-0 p-4 border-b border-gray-100 bg-white">
          <h2 className="font-semibold text-gray-900">Analysis Overview</h2>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : !analysis ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select an analysis to view details
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-8">
              {/* Overview Cards */}
              <div className="grid grid-cols-3 gap-4">
                {/* Review Count & Rating */}
                <motion.div 
                  className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-200/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-blue-500" />
                    <h3 className="font-medium text-blue-900">Reviews Overview</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-blue-700">Total Reviews</span>
                      <span className="text-2xl font-semibold text-blue-900">
                        {analysis?.meta?.reviewCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-blue-700">Average Rating</span>
                      <div className="flex items-center gap-1">
                        <span className="text-2xl font-semibold text-blue-900">
                          {analysis?.meta?.avgRating?.toFixed(1) || "N/A"}
                        </span>
                        <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Sentiment Distribution */}
                <motion.div 
                  className="bg-gradient-to-br from-amber-50 to-white p-4 rounded-xl border border-amber-200/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart className="h-5 w-5 text-amber-500" />
                    <h3 className="font-medium text-amber-900">Sentiment</h3>
                  </div>
                  {renderSentimentDistribution()}
                </motion.div>

                {/* Quick Stats */}
                <motion.div 
                  className="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-xl border border-emerald-200/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    <h3 className="font-medium text-emerald-900">Quick Stats</h3>
                  </div>
                  {renderQuickStats()}
                </motion.div>
              </div>

              {/* Strengths Section */}
              <section className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Key Strengths</h3>
                <div className="grid grid-cols-2 gap-4">
                  {analysis.strengths.map((strength, index) => (
                    <motion.div 
                      key={index} 
                      className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-100"
                    >
                      <h4 className="font-medium text-emerald-900 mb-2">
                        {strength.title}
                      </h4>
                      
                      <p className="text-gray-600 text-sm mb-3">
                        {strength.details}
                      </p>

                      {/* Marketing Tips */}
                      <div className="space-y-2 mb-4">
                        {strength.marketingTips.map((tip, idx) => (
                          <div key={idx} className="...">
                            {/* ... existing marketing tips content ... */}
                          </div>
                        ))}
                      </div>

                      {/* Link alle recensioni spostato qui */}
                      <button 
                        onClick={() => onSourceClick('strengths', strength._id, strength.title)}
                        className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 mt-3 py-2 px-3 bg-emerald-50/50 rounded-lg hover:bg-emerald-50 transition-colors"
                      >
                        <Link className="h-3.5 w-3.5" />
                        <span>View {strength.mentions} related reviews</span>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Issues Section */}
              <section className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Areas for Improvement</h3>
                <div className="grid grid-cols-2 gap-4">
                  {analysis.issues.map((issue, index) => (
                    <motion.div 
                      key={index} 
                      className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-100"
                    >
                      <h4 className="font-medium text-rose-900 mb-2">
                        {issue.title}
                      </h4>
                      
                      <p className="text-gray-600 text-sm mb-3">
                        {issue.details}
                      </p>

                      {/* Solution section */}
                      <div className="bg-gray-50/80 rounded-lg p-3 mb-4">
                        {/* ... existing solution content ... */}
                      </div>

                      {/* Link alle recensioni spostato qui */}
                      <button 
                        onClick={() => onSourceClick('issues', issue._id, issue.title)}
                        className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 mt-3 py-2 px-3 bg-rose-50/50 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <Link className="h-3.5 w-3.5" />
                        <span>View {issue.mentions} related reviews</span>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Quick Wins Section */}
              <section className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Quick Wins</h3>
                <div className="grid grid-cols-3 gap-4">
                  {analysis.quickWins.map((win, index) => (
                    <motion.div
                      key={index}
                      className="bg-gradient-to-br from-violet-50 to-white p-4 rounded-xl border border-violet-200/50"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="h-5 w-5 text-violet-500" />
                        <h4 className="font-medium text-violet-900">{win.action}</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Timeline:</span>
                          <span className="text-violet-700">{win.timeline}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cost:</span>
                          <span className="text-violet-700">{win.cost}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Impact:</span>
                          <span className="text-violet-700">{win.impact}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
} 