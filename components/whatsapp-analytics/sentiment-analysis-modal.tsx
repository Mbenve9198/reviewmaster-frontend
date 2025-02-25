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
}

export function SentimentAnalysisModal({ isOpen, onClose, hotelId }: SentimentAnalysisModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null)

  const generateSentimentAnalysis = async () => {
    if (!hotelId) return
    
    setIsAnalyzing(true)
    setError(null)
    
    try {
      const token = getCookie('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp-assistant/${hotelId}/sentiment-analysis`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
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
      <DialogContent className="sm:max-w-md bg-white rounded-2xl border border-gray-200/50 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            Sentiment Analysis
          </DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-50 p-4 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        
        {!sentimentData ? (
          <div className="py-8 text-center">
            <p className="text-gray-600 mb-6">
              Generate a sentiment analysis of WhatsApp conversations to better understand user experience.
            </p>
            <Button 
              onClick={generateSentimentAnalysis}
              disabled={isAnalyzing}
              className="rounded-xl"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Generate Sentiment Analysis'
              )}
            </Button>
          </div>
        ) : (
          <div className="py-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-green-50 p-3 rounded-xl text-center">
                <Smile className="h-5 w-5 text-green-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-green-600">
                  {sentimentData.positive}
                </div>
                <div className="text-xs text-green-700">
                  {totalMessages ? ((sentimentData.positive / totalMessages) * 100).toFixed(0) : 0}% Positive
                </div>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-xl text-center">
                <Meh className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-purple-600">
                  {sentimentData.neutral}
                </div>
                <div className="text-xs text-purple-700">
                  {totalMessages ? ((sentimentData.neutral / totalMessages) * 100).toFixed(0) : 0}% Neutral
                </div>
              </div>
              
              <div className="bg-red-50 p-3 rounded-xl text-center">
                <Frown className="h-5 w-5 text-red-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-red-600">
                  {sentimentData.negative}
                </div>
                <div className="text-xs text-red-700">
                  {totalMessages ? ((sentimentData.negative / totalMessages) * 100).toFixed(0) : 0}% Negative
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <Button 
                onClick={generateSentimentAnalysis}
                variant="outline"
                disabled={isAnalyzing}
                className="rounded-xl"
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
      </DialogContent>
    </Dialog>
  )
} 