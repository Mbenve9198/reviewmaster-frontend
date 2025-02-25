"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCookie } from "@/lib/utils"
import { Loader2, BarChart3, MessageSquare, Star, TrendingUp, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { format, parseISO, subDays } from "date-fns"
import { it, enUS } from "date-fns/locale"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { SentimentAnalysisModal } from "@/components/whatsapp-analytics/sentiment-analysis-modal"

interface Hotel {
  _id: string
  name: string
}

interface AnalyticsData {
  totalInteractions: number
  totalMessages: number
  userMessages: number
  assistantMessages: number
  reviewsSent: number
  messagesByDate: {
    date: string
    user: number
    assistant: number
    total: number
  }[]
}

export default function WhatsAppAnalyticsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [selectedHotelId, setSelectedHotelId] = useState<string>("")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSentimentModalOpen, setIsSentimentModalOpen] = useState(false)
  const [timeRange, setTimeRange] = useState("30")

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const token = getCookie('token')
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        })
        
        if (!response.ok) throw new Error('Failed to fetch hotels')
        
        const data = await response.json()
        setHotels(data)
        
        const savedHotelId = localStorage.getItem('selectedHotel')
        if (savedHotelId && data.find((h: Hotel) => h._id === savedHotelId)) {
          setSelectedHotelId(savedHotelId)
        } else if (data.length > 0) {
          setSelectedHotelId(data[0]._id)
          localStorage.setItem('selectedHotel', data[0]._id)
        }
      } catch (error) {
        console.error('Error fetching hotels:', error)
        setError('Failed to load hotels')
      } finally {
        setIsLoading(false)
      }
    }

    fetchHotels()
  }, [])

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!selectedHotelId) return
      
      setIsLoading(true)
      try {
        const token = getCookie('token')
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp-assistant/${selectedHotelId}/analytics`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          }
        )
        
        if (!response.ok) throw new Error('Failed to fetch analytics')
        
        const data = await response.json()
        setAnalyticsData(data)
      } catch (error) {
        console.error('Error fetching analytics:', error)
        setError('Failed to load analytics data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [selectedHotelId])

  const handleHotelChange = (hotelId: string) => {
    setSelectedHotelId(hotelId)
    localStorage.setItem('selectedHotel', hotelId)
  }

  const filteredChartData = analyticsData?.messagesByDate
    ?.filter(item => {
      const itemDate = parseISO(item.date)
      const cutoffDate = subDays(new Date(), parseInt(timeRange))
      return itemDate >= cutoffDate
    })
    ?.map(item => ({
      ...item,
      date: format(parseISO(item.date), 'dd/MM')
    })) || []

  const getPercentage = (part: number, total: number): string => {
    if (!total) return "0%"
    return `${Math.round((part / total) * 100)}%`
  }

  if (isLoading && !analyticsData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pl-24 pr-8 pb-12">
      {/* Modern gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#FAFAFB] via-[#F0F0F2] to-[#FAFAFB] backdrop-blur-sm" />

      {/* Header */}
      <div className="pt-4 pb-1">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 rounded-full bg-gradient-to-b from-purple-600 to-blue-400" />
            <div>
              <h1 className="text-xl font-semibold bg-gradient-to-b from-purple-700 to-blue-600 bg-clip-text text-transparent">
                WhatsApp Analytics
              </h1>
              <p className="text-xs text-gray-500">
                Monitora le performance e le metriche di engagement del tuo assistente AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px] h-8 bg-white rounded-xl border-gray-200 hover:border-gray-300 text-xs">
                <SelectValue placeholder="Intervallo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7" className="text-xs py-1.5">Ultimi 7 giorni</SelectItem>
                <SelectItem value="14" className="text-xs py-1.5">Ultimi 14 giorni</SelectItem>
                <SelectItem value="30" className="text-xs py-1.5">Ultimi 30 giorni</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedHotelId} onValueChange={handleHotelChange}>
              <SelectTrigger className="w-[220px] h-8 bg-white rounded-xl border-gray-200 hover:border-gray-300 text-xs">
                <SelectValue placeholder="Seleziona hotel" className="text-xs" />
              </SelectTrigger>
              <SelectContent>
                {hotels.map(hotel => (
                  <SelectItem key={hotel._id} value={hotel._id} className="text-xs py-1.5">
                    {hotel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {error ? (
        <div className="bg-red-50 p-4 rounded-lg mt-6 flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      ) : !analyticsData ? (
        <div className="h-[calc(100vh-4.5rem)] bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg flex flex-col items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-gray-500">Caricamento dati analytics...</p>
        </div>
      ) : (
        <div className="mt-4 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white/50 backdrop-blur-sm border border-gray-200/50 shadow-lg rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  Conversazioni Totali
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalInteractions}</div>
                <p className="text-xs text-gray-500 mt-1">Numeri di telefono unici</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/50 backdrop-blur-sm border border-gray-200/50 shadow-lg rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-500" />
                  Messaggi Totali
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalMessages}</div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Utente: {analyticsData.userMessages} ({getPercentage(analyticsData.userMessages, analyticsData.totalMessages)})</span>
                  <span>AI: {analyticsData.assistantMessages} ({getPercentage(analyticsData.assistantMessages, analyticsData.totalMessages)})</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/50 backdrop-blur-sm border border-gray-200/50 shadow-lg rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Richieste di Recensione
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.reviewsSent}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Conversione: {getPercentage(analyticsData.reviewsSent, analyticsData.totalInteractions)}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/50 backdrop-blur-sm border border-gray-200/50 shadow-lg rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Rapporto Messaggi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData.assistantMessages && analyticsData.userMessages
                    ? (analyticsData.assistantMessages / analyticsData.userMessages).toFixed(1)
                    : '0'}
                </div>
                <p className="text-xs text-gray-500 mt-1">Messaggi AI per messaggio utente</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 gap-6">
            <Card className="bg-white/50 backdrop-blur-sm border border-gray-200/50 shadow-lg rounded-2xl">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Volume Messaggi
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSentimentModalOpen(true)}
                    className="rounded-xl border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-colors text-xs"
                  >
                    Analisi del Sentiment
                  </Button>
                </div>
                <CardDescription className="text-xs text-gray-500">
                  Messaggi scambiati negli ultimi {timeRange} giorni
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={filteredChartData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar
                        name="Messaggi Utente"
                        dataKey="user"
                        fill="#8884d8"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        name="Messaggi AI"
                        dataKey="assistant"
                        fill="#82ca9d"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/50 backdrop-blur-sm border border-gray-200/50 shadow-lg rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  Trend dei Messaggi
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Volume totale dei messaggi nel tempo
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={filteredChartData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Area
                        type="monotone"
                        name="Messaggi Totali"
                        dataKey="total"
                        stroke="#8884d8"
                        fill="url(#colorTotal)"
                        strokeWidth={2}
                      />
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      
      {/* Modal per l'analisi del sentiment */}
      <SentimentAnalysisModal
        isOpen={isSentimentModalOpen}
        onClose={() => setIsSentimentModalOpen(false)}
        hotelId={selectedHotelId}
      />
    </div>
  )
} 