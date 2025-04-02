"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCookie } from "@/lib/utils"
import { Loader2, BarChart3, MessageSquare, Star, TrendingUp, AlertCircle, DollarSign, Coins, PieChart } from "lucide-react"
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
  PieChart as ReChartPieChart,
  Pie,
  Cell,
  Sector
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
  reviewsClicked: number
  messagesByDate: {
    date: string
    user: number
    assistant: number
    total: number
  }[]
  creditCost?: number
  reviewClicks?: {
    details: {
      phoneNumber: string
      profileName: string
      clickedAt: string
      sentAt: string
      clickCount: number
      timeTaken: number | null
    }[]
    timings: {
      lessThanHour: number
      sameDay: number
      laterDays: number
    }
    byDate: {
      date: string
      clicks: number
    }[]
  }
}

export default function WhatsAppAnalyticsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [selectedHotelId, setSelectedHotelId] = useState<string>("")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSentimentModalOpen, setIsSentimentModalOpen] = useState(false)
  const [timeRange, setTimeRange] = useState("30")
  const [activePieIndex, setActivePieIndex] = useState(0);

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
        
        // Calculate credit cost based on message counts
        // Each user message costs 0.5 credits, each AI message costs 0.5 credits
        const messageCost = (data.userMessages + data.assistantMessages) * 0.5
        
        // Each review request costs 1.0 credit
        const reviewCost = data.reviewsSent * 1.0
        
        // Set total credit cost
        data.creditCost = messageCost + reviewCost
        
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

  // Format currency function
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 2
    }).format(amount)
  }

  // Format percentage for pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {name} {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          className="drop-shadow-md"
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
          className="drop-shadow-sm"
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="text-xs">{`${payload.name}`}</text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#666" className="text-xs font-medium">
          {`${value.toFixed(1)} credits (${(percent * 100).toFixed(0)}%)`}
        </text>
      </g>
    );
  };

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
                Monitor performance and engagement metrics of your AI assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px] h-8 bg-white rounded-xl border-gray-200 hover:border-gray-300 text-xs">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7" className="text-xs py-1.5">Last 7 days</SelectItem>
                <SelectItem value="14" className="text-xs py-1.5">Last 14 days</SelectItem>
                <SelectItem value="30" className="text-xs py-1.5">Last 30 days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedHotelId} onValueChange={handleHotelChange}>
              <SelectTrigger className="w-[220px] h-8 bg-white rounded-xl border-gray-200 hover:border-gray-300 text-xs">
                <SelectValue placeholder="Select hotel" className="text-xs" />
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
          <p className="mt-4 text-sm text-gray-500">Loading analytics data...</p>
        </div>
      ) : (
        <div className="mt-4 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-white/50 backdrop-blur-sm border border-gray-200/50 shadow-lg rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  Total Conversations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalInteractions}</div>
                <p className="text-xs text-gray-500 mt-1">Unique phone numbers</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/50 backdrop-blur-sm border border-gray-200/50 shadow-lg rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-500" />
                  Total Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalMessages}</div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>User: {analyticsData.userMessages} ({getPercentage(analyticsData.userMessages, analyticsData.totalMessages)})</span>
                  <span>AI: {analyticsData.assistantMessages} ({getPercentage(analyticsData.assistantMessages, analyticsData.totalMessages)})</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/50 backdrop-blur-sm border border-gray-200/50 shadow-lg rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Review Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.reviewsSent}</div>
                <div className="flex flex-col gap-1 text-xs text-gray-500 mt-1">
                  <p>
                    Sent: {analyticsData.reviewsSent} ({getPercentage(analyticsData.reviewsSent, analyticsData.totalInteractions)} of conversations)
                  </p>
                  <p>
                    Clicked: {analyticsData.reviewsClicked} ({getPercentage(analyticsData.reviewsClicked, analyticsData.reviewsSent)} CTR)
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/50 backdrop-blur-sm border border-gray-200/50 shadow-lg rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Message Ratio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData.assistantMessages && analyticsData.userMessages
                    ? (analyticsData.assistantMessages / analyticsData.userMessages).toFixed(1)
                    : '0'}
                </div>
                <p className="text-xs text-gray-500 mt-1">AI messages per user message</p>
              </CardContent>
            </Card>
            
            {/* New Credit Cost Counter Card */}
            <Card className="bg-white/50 backdrop-blur-sm border border-gray-200/50 shadow-lg rounded-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-bl-full" />
              <CardHeader className="pb-2 relative">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Coins className="h-4 w-4 text-blue-600" />
                  Credits Spent
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-baseline gap-1">
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {analyticsData.creditCost?.toFixed(1) || '0'}
                  </div>
                  <div className="text-sm text-gray-500">credits</div>
                </div>
                
                <div className="flex flex-col gap-1 text-xs text-gray-500 mt-2">
                  <div className="mt-2 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-400 to-purple-500"
                      style={{ width: `${Math.min(100, (analyticsData.creditCost || 0) / 1000 * 100)}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center">
                      <MessageSquare className="h-3 w-3 text-gray-400 mr-1" />
                      <span>{((analyticsData.userMessages + analyticsData.assistantMessages) * 0.5).toFixed(1)} cr</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-3 w-3 text-gray-400 mr-1" />
                      <span>{(analyticsData.reviewsSent * 1.0).toFixed(1)} cr</span>
                    </div>
                  </div>
                  
                  <p className="mt-1 text-xs">
                    Est. value: {formatCurrency((analyticsData.creditCost || 0) * 0.15)}
                  </p>
                </div>
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
                    Message Volume
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSentimentModalOpen(true)}
                    className="rounded-xl border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-colors text-xs"
                  >
                    Sentiment Analysis
                  </Button>
                </div>
                <CardDescription className="text-xs text-gray-500">
                  Messages exchanged in the last {timeRange} days
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
                        name="User Messages"
                        dataKey="user"
                        fill="#8884d8"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        name="AI Messages"
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
                  Message Trends
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Total message volume over time
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
                        name="Total Messages"
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
            
            {/* New Credit Cost Distribution Chart */}
            <Card className="bg-white/50 backdrop-blur-sm border border-gray-200/50 shadow-lg rounded-2xl">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-blue-500" />
                    Credit Usage Breakdown
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-gray-500">
                  Distribution of credits spent by operation type
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReChartPieChart>
                      <defs>
                        <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0.4}/>
                        </linearGradient>
                        <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.4}/>
                        </linearGradient>
                        <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ffc658" stopOpacity={0.4}/>
                        </linearGradient>
                      </defs>
                      
                      <Pie
                        activeIndex={activePieIndex}
                        activeShape={renderActiveShape}
                        data={[
                          { name: 'Inbound Messages', value: analyticsData.userMessages * 0.5 },
                          { name: 'Outbound Messages', value: analyticsData.assistantMessages * 0.5 },
                          { name: 'Review Requests', value: analyticsData.reviewsSent * 1.0 },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={90}
                        dataKey="value"
                        onMouseEnter={(_, index) => setActivePieIndex(index)}
                      >
                        <Cell fill="url(#colorInbound)" />
                        <Cell fill="url(#colorOutbound)" />
                        <Cell fill="url(#colorReviews)" />
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value.toFixed(1)} credits`, 'Credits Used']}
                        contentStyle={{
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                    </ReChartPieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500 flex items-center">
                        <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                        Inbound
                      </span>
                      <span className="text-xs font-medium">{(analyticsData.userMessages * 0.5).toFixed(1)} credits</span>
                    </div>
                    <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500"
                        style={{ width: `${(analyticsData.userMessages * 0.5) / (analyticsData.creditCost || 1) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500 flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        Outbound
                      </span>
                      <span className="text-xs font-medium">{(analyticsData.assistantMessages * 0.5).toFixed(1)} credits</span>
                    </div>
                    <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500"
                        style={{ width: `${(analyticsData.assistantMessages * 0.5) / (analyticsData.creditCost || 1) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500 flex items-center">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                        Reviews
                      </span>
                      <span className="text-xs font-medium">{(analyticsData.reviewsSent * 1.0).toFixed(1)} credits</span>
                    </div>
                    <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500"
                        style={{ width: `${(analyticsData.reviewsSent * 1.0) / (analyticsData.creditCost || 1) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Recensioni Card - Migliorato con dati sui clic */}
            {analyticsData.reviewClicks && (
              <Card className="bg-white/50 backdrop-blur-sm border border-gray-200/50 shadow-lg rounded-2xl">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      Review Analysis
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-gray-500">
                    Detailed statistics on review request clicks
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {/* Distribuzione temporale dei clic */}
                  <div className="mb-6 pb-6 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">Review response times</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500 flex items-center">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                            Less than 1 hour
                          </span>
                          <span className="text-xs font-medium">{analyticsData.reviewClicks.timings.lessThanHour} clicks</span>
                        </div>
                        <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500"
                            style={{ width: `${analyticsData.reviewClicks.timings.lessThanHour / (analyticsData.reviewsClicked || 1) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500 flex items-center">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                            Same day
                          </span>
                          <span className="text-xs font-medium">{analyticsData.reviewClicks.timings.sameDay} clicks</span>
                        </div>
                        <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500"
                            style={{ width: `${analyticsData.reviewClicks.timings.sameDay / (analyticsData.reviewsClicked || 1) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500 flex items-center">
                            <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                            Later days
                          </span>
                          <span className="text-xs font-medium">{analyticsData.reviewClicks.timings.laterDays} clicks</span>
                        </div>
                        <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500"
                            style={{ width: `${analyticsData.reviewClicks.timings.laterDays / (analyticsData.reviewsClicked || 1) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Grafico dei clic nel tempo */}
                  <div className="h-60 mb-6 pb-6 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">Review clicks over time</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={analyticsData.reviewClicks.byDate
                          .filter(item => {
                            const itemDate = parseISO(item.date);
                            const cutoffDate = subDays(new Date(), parseInt(timeRange));
                            return itemDate >= cutoffDate;
                          })
                          .map(item => ({
                            ...item,
                            date: format(parseISO(item.date), 'dd/MM')
                          }))}
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
                          name="Review Clicks"
                          dataKey="clicks"
                          stroke="#ffc658"
                          fill="url(#colorClicks)"
                          strokeWidth={2}
                        />
                        <defs>
                          <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#ffc658" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Tabella dei dettagli dei clic */}
                  {analyticsData.reviewClicks.details.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 mb-3">Review click details</h3>
                      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Click Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Taken</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Click Count</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {analyticsData.reviewClicks.details.slice(0, 5).map((click, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{click.profileName}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {format(parseISO(click.clickedAt), 'dd MMM yyyy HH:mm', { locale: enUS })}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {click.timeTaken !== null
                                      ? click.timeTaken < 1
                                        ? 'Less than 1 hour'
                                        : click.timeTaken < 24
                                        ? `${click.timeTaken} hours`
                                        : `${Math.round(click.timeTaken / 24)} days`
                                      : 'N/A'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {click.clickCount} {click.clickCount === 1 ? 'time' : 'times'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {analyticsData.reviewClicks.details.length > 5 && (
                            <div className="px-6 py-3 bg-gray-50 text-xs text-gray-500 text-center">
                              Showing first 5 of {analyticsData.reviewClicks.details.length} total results
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
      
      {/* Modal for sentiment analysis */}
      <SentimentAnalysisModal
        isOpen={isSentimentModalOpen}
        onClose={() => setIsSentimentModalOpen(false)}
        hotelId={selectedHotelId}
      />
    </div>
  )
} 