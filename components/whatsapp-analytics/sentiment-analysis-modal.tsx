"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Smile, Frown, Meh, AlertCircle } from "lucide-react"
import { getCookie } from "@/lib/utils"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface SentimentAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  hotelId: string
}

interface SentimentData {
  positive: number
  neutral: number
  negative: number
  summary: string
  createdAt?: string
  isCached?: boolean
}

export function SentimentAnalysisModal({ isOpen, onClose, hotelId }: SentimentAnalysisModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null)

  const generateSentimentAnalysis = async (forceRefresh = false) => {
    if (!hotelId) return
    
    setIsAnalyzing(true)
    setError(null)
    
    try {
      const token = getCookie('token')
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp-assistant/${hotelId}/sentiment-analysis${forceRefresh ? '?force=true' : ''}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) throw new Error('Failed to generate sentiment analysis')
      
      const data = await response.json()
      setSentimentData(data)
    } catch (error) {
      console.error('Error generating sentiment analysis:', error)
      setError('Unable to generate sentiment analysis. Please try again later.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const COLORS = ['#4ade80', '#a78bfa', '#f87171']
  
  const pieData = sentimentData ? [
    { name: 'Positive', value: sentimentData.positive },
    { name: 'Neutral', value: sentimentData.neutral },
    { name: 'Negative', value: sentimentData.negative }
  ] : []

  const totalMessages = sentimentData 
    ? sentimentData.positive + sentimentData.neutral + sentimentData.negative
    : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl bg-white rounded-2xl border border-gray-200/50 shadow-lg p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
          <DialogTitle className="text-xl font-semibold text-gray-800 bg-gradient-to-b from-purple-700 to-blue-600 bg-clip-text text-transparent">
            Sentiment Analysis
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 py-5">
          {error && (
            <div className="bg-red-50 p-4 rounded-xl flex items-center gap-3 text-red-700 text-sm mb-5">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          
          {!sentimentData ? (
            <div className="py-10 text-center">
              <div className="max-w-md mx-auto">
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Generate a sentiment analysis of WhatsApp conversations to better understand user experience and identify areas for improvement.
                </p>
                <Button 
                  onClick={() => generateSentimentAnalysis()}
                  disabled={isAnalyzing}
                  className="rounded-xl px-6 py-5 h-auto"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      Analyzing Conversations...
                    </>
                  ) : (
                    'Generate Sentiment Analysis'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-2">
              {/* Chart and Stats Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Legend 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right"
                        wrapperStyle={{ fontSize: '12px', paddingLeft: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-xl flex items-center">
                    <div className="bg-green-100 p-3 rounded-full mr-4">
                      <Smile className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-green-600">
                        {sentimentData.positive}
                      </div>
                      <div className="text-sm text-green-700">
                        {totalMessages ? ((sentimentData.positive / totalMessages) * 100).toFixed(0) : 0}% Positive Messages
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-xl flex items-center">
                    <div className="bg-purple-100 p-3 rounded-full mr-4">
                      <Meh className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-purple-600">
                        {sentimentData.neutral}
                      </div>
                      <div className="text-sm text-purple-700">
                        {totalMessages ? ((sentimentData.neutral / totalMessages) * 100).toFixed(0) : 0}% Neutral Messages
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-xl flex items-center">
                    <div className="bg-red-100 p-3 rounded-full mr-4">
                      <Frown className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-red-600">
                        {sentimentData.negative}
                      </div>
                      <div className="text-sm text-red-700">
                        {totalMessages ? ((sentimentData.negative / totalMessages) * 100).toFixed(0) : 0}% Negative Messages
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Summary Section */}
              {sentimentData.summary && (
                <div className="mt-8 bg-blue-50 p-5 rounded-xl">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-md font-medium text-blue-800 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                      </svg>
                      Analysis Summary
                    </h3>
                    {sentimentData.createdAt && (
                      <span className="text-xs text-blue-600 flex items-center">
                        {sentimentData.isCached && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        )}
                        Generated {new Date(sentimentData.createdAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    {sentimentData.summary}
                  </p>
                </div>
              )}
              
              <div className="mt-8 text-center">
                <Button 
                  onClick={() => generateSentimentAnalysis(true)}
                  variant="outline"
                  disabled={isAnalyzing}
                  className="rounded-xl border-gray-200 hover:bg-gray-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Refresh Analysis'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 