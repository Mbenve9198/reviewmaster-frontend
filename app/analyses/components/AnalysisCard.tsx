"use client"

import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getCookie } from "@/lib/utils"
import { Loader2, TrendingUp, TrendingDown, Star, AlertTriangle, Zap, BarChart, Link, Info } from "lucide-react"
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
    summary: string
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
  const [showSentimentTooltip, setShowSentimentTooltip] = useState(false)
  const [showStatsTooltip, setShowStatsTooltip] = useState(false)

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
      <div className="space-y-3">
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
        
        {/* Sintesi argomentativa del sentiment */}
        {analysis.sentiment.summary && (
          <div className="mt-3 p-2 bg-amber-50/50 rounded-lg border border-amber-100/50">
            <p className="text-xs text-amber-800 leading-relaxed">
              {analysis.sentiment.summary}
            </p>
          </div>
        )}
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
    <div className="h-full bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden relative flex flex-col">
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header fisso */}
        <div className="sticky top-0 p-4 border-b border-gray-100/80 bg-white/50">
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
              <div className="grid grid-cols-3 gap-6">
                {/* Review Count & Rating */}
                <motion.div 
                  className="bg-gradient-to-br from-sky-50 to-white p-4 rounded-xl border border-sky-200/50 hover:shadow-md transition-shadow duration-200"
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
                  className="bg-gradient-to-br from-amber-50 to-white p-4 rounded-xl border border-amber-200/50 hover:shadow-md transition-shadow duration-200 relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BarChart className="h-5 w-5 text-amber-500" />
                      <h3 className="font-medium text-amber-900">Sentiment</h3>
                    </div>
                    <div 
                      className="relative"
                      onMouseEnter={() => setShowSentimentTooltip(true)}
                      onMouseLeave={() => setShowSentimentTooltip(false)}
                    >
                      <Info className="h-4 w-4 text-amber-500 cursor-help" />
                      {showSentimentTooltip && (
                        <div className="absolute right-0 top-6 w-64 p-3 bg-white shadow-lg rounded-lg border border-amber-100 text-xs text-gray-700 z-20">
                          <p className="font-medium text-amber-800 mb-1">Sentiment Distribution</p>
                          <p className="mb-2">This shows how guests rated your hotel on a 5-star scale. The distribution helps identify whether ratings are consistent or polarized.</p>
                          <p>Percentages indicate the proportion of reviews at each rating level, calculated from all analyzed reviews.</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {renderSentimentDistribution()}
                </motion.div>

                {/* Quick Stats */}
                <motion.div 
                  className="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-xl border border-emerald-200/50 hover:shadow-md transition-shadow duration-200 relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                      <h3 className="font-medium text-emerald-900">Quick Stats</h3>
                    </div>
                    <div 
                      className="relative"
                      onMouseEnter={() => setShowStatsTooltip(true)}
                      onMouseLeave={() => setShowStatsTooltip(false)}
                    >
                      <Info className="h-4 w-4 text-emerald-500 cursor-help" />
                      {showStatsTooltip && (
                        <div className="absolute right-0 top-6 w-64 p-3 bg-white shadow-lg rounded-lg border border-emerald-100 text-xs text-gray-700 z-20">
                          <p className="font-medium text-emerald-800 mb-1">Quick Stats Summary</p>
                          <p className="mb-2">This provides a quick overview of your positive and negative review percentages.</p>
                          <p><span className="font-medium">Excellent:</span> Percentage of highly positive reviews (typically 4-5 stars).</p>
                          <p><span className="font-medium">Needs Improvement:</span> Percentage of negative reviews that highlight issues (typically 1-2 stars).</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {renderQuickStats()}
                </motion.div>
              </div>

              {/* Strengths Section */}
              <section className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  Key Strengths
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  {analysis.strengths.map((strength, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group bg-gradient-to-br from-emerald-50 to-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-emerald-100 hover:shadow-md transition-all duration-200"
                    >
                      <h4 className="font-medium text-emerald-900 text-lg mb-3">
                        {strength.title}
                      </h4>
                      
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {strength.details}
                      </p>

                      {/* Marketing Tips con stile migliorato */}
                      <div className="space-y-3 mb-4">
                        {strength.marketingTips.map((tip, idx) => (
                          <div key={idx} className="bg-white/50 rounded-lg p-4 border border-emerald-100/50">
                            <div className="text-sm text-emerald-800 font-medium mb-2">{tip.action}</div>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">Cost:</span>
                                <span className="text-emerald-700">{tip.cost}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">ROI:</span>
                                <span className="text-emerald-700">{tip.roi}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={() => onSourceClick('strengths', strength._id, strength.title)}
                        className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 mt-4 py-2 px-3 bg-emerald-50/50 rounded-lg hover:bg-emerald-50 transition-colors w-full justify-center group-hover:bg-emerald-100/50"
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
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                  Areas for Improvement
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  {analysis.issues.map((issue, index) => (
                    <motion.div 
                      key={index} 
                      className="bg-gradient-to-br from-rose-50 to-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-rose-100"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-rose-900 text-lg">{issue.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium
                          ${issue.priority === 'HIGH' 
                            ? 'bg-rose-100 text-rose-700' 
                            : issue.priority === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {issue.priority}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {issue.details}
                      </p>

                      {/* Solution Section - Aggiunto */}
                      <div className="bg-white/50 rounded-lg p-4 border border-rose-100/50 mb-4">
                        <div className="text-sm font-medium text-rose-900 mb-3">
                          {issue.solution.title}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div className="bg-rose-50/50 rounded-lg p-2">
                            <span className="text-xs text-gray-500 block">Timeline</span>
                            <span className="text-sm text-rose-700">{issue.solution.timeline}</span>
                          </div>
                          <div className="bg-rose-50/50 rounded-lg p-2">
                            <span className="text-xs text-gray-500 block">Cost</span>
                            <span className="text-sm text-rose-700">{issue.solution.cost}</span>
                          </div>
                          <div className="bg-rose-50/50 rounded-lg p-2">
                            <span className="text-xs text-gray-500 block">ROI</span>
                            <span className="text-sm text-rose-700">{issue.solution.roi}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-xs text-gray-500 block">Implementation Steps</span>
                          {issue.solution.steps.map((step, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                              {step}
                            </div>
                          ))}
                        </div>
                      </div>

                      <button 
                        onClick={() => onSourceClick('issues', issue._id, issue.title)}
                        className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 mt-4 py-2 px-3 bg-rose-50/50 rounded-lg hover:bg-rose-50 transition-colors w-full justify-center"
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
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-violet-500" />
                  Quick Wins
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  {analysis.quickWins.map((win, index) => (
                    <motion.div
                      key={index}
                      className="bg-gradient-to-br from-violet-50 to-white p-5 rounded-xl border border-violet-200/50 hover:shadow-md transition-all duration-200"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <Zap className="h-5 w-5 text-violet-500" />
                        <h4 className="font-medium text-violet-900">{win.action}</h4>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
                          <span className="text-gray-600">Timeline</span>
                          <span className="text-violet-700 font-medium">{win.timeline}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
                          <span className="text-gray-600">Cost</span>
                          <span className="text-violet-700 font-medium">{win.cost}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
                          <span className="text-gray-600">Impact</span>
                          <span className="text-violet-700 font-medium">{win.impact}</span>
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