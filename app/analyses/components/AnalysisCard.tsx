"use client"

import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getCookie } from "@/lib/utils"
import { Loader2, TrendingUp, TrendingDown, Star, AlertTriangle, Zap, BarChart } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"

interface AnalysisCardProps {
  analysisId: string
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
  strengths: Array<{
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
  }>
  issues: Array<{
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
  }>
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

export default function AnalysisCard({ analysisId }: AnalysisCardProps) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!analysisId) return
      setIsLoading(true)
      try {
        const token = getCookie('token')
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analyses/${analysisId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        })
        
        if (!response.ok) throw new Error('Failed to fetch analysis')
        
        const data = await response.json()
        setAnalysis(data.analysis)
      } catch (error) {
        console.error('Error fetching analysis:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalysis()
  }, [analysisId])

  if (isLoading) {
    return (
      <div className="h-full bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!analysis) return null

  return (
    <div className="h-full bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
      <ScrollArea className="h-full">
        <div className="p-6 space-y-8">
          {/* Overview Cards */}
          <div className="grid grid-cols-3 gap-4">
            <motion.div 
              className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-xl border border-blue-200/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-5 w-5 text-blue-500" />
                <h3 className="font-medium text-blue-900">Average Rating</h3>
              </div>
              <p className="text-3xl font-bold text-blue-700">{analysis.meta.avgRating}</p>
              <p className="text-sm text-blue-600 mt-1">from {analysis.meta.reviewCount} reviews</p>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 rounded-xl border border-emerald-200/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <h3 className="font-medium text-emerald-900">Positive Sentiment</h3>
              </div>
              <p className="text-3xl font-bold text-emerald-700">{analysis.sentiment.excellent}</p>
              <p className="text-sm text-emerald-600 mt-1">excellent reviews</p>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 rounded-xl border border-amber-200/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <BarChart className="h-5 w-5 text-amber-500" />
                <h3 className="font-medium text-amber-900">Review Distribution</h3>
              </div>
              <div className="space-y-2">
                {Object.entries(analysis.sentiment.distribution).map(([key, value], index) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs text-amber-700 w-8">{key.replace('rating', '')}</span>
                    <Progress value={parseInt(value)} className="h-2" />
                    <span className="text-xs text-amber-700 w-12">{value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Strengths Section */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Key Strengths</h2>
            <div className="grid grid-cols-2 gap-4">
              {analysis.strengths.map((strength, index) => (
                <motion.div
                  key={index}
                  className="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-xl border border-emerald-200/50"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-emerald-900">{strength.title}</h3>
                    <span className="text-emerald-600 text-sm font-medium">{strength.impact}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{strength.details}</p>
                  <blockquote className="text-sm italic text-emerald-600 bg-emerald-50 p-2 rounded-lg mb-3">
                    "{strength.quote}"
                  </blockquote>
                  <div className="text-sm text-emerald-700">
                    {strength.mentions} mentions
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Issues Section */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Areas for Improvement</h2>
            <div className="grid grid-cols-2 gap-4">
              {analysis.issues.map((issue, index) => (
                <motion.div
                  key={index}
                  className="bg-gradient-to-br from-rose-50 to-white p-4 rounded-xl border border-rose-200/50"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-rose-900">{issue.title}</h3>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                      issue.priority === 'HIGH' 
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {issue.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{issue.details}</p>
                  <blockquote className="text-sm italic text-rose-600 bg-rose-50 p-2 rounded-lg mb-3">
                    "{issue.quote}"
                  </blockquote>
                  <div className="text-sm text-rose-700">
                    {issue.mentions} mentions
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Quick Wins Section */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Quick Wins</h2>
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
                    <h3 className="font-medium text-violet-900">{win.action}</h3>
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
    </div>
  )
} 