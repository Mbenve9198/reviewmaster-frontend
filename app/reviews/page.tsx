"use client"

import { useState, useEffect } from "react"
import { ReviewsTable } from "@/components/reviews-table"
import { Input } from "@/components/ui/input"
import { ReviewTabs } from "@/components/ui/review-tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, BarChart2, X, RefreshCw, Check, AlertCircle, Loader2, Clock, BrainCircuit, ListFilter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toaster } from "sonner"
import { getCookie } from "@/lib/utils"
import useReviews from "@/store/useReviews"
import Image from "next/image"
import { BulkActionsDropdown } from "@/components/bulk-actions-dropdown"
import { type Table as TableType } from "@tanstack/react-table"
import { AddPropertyModal } from "@/components/add-property-modal"
import { AuroraBackground } from "@/components/ui/aurora-background"
import { toast } from "react-hot-toast"
import { AnalyticsDialog } from "@/components/analytics/AnalyticsDialog"
import { useRouter } from 'next/navigation'
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Hotel {
  _id: string
  name: string
}

interface Review {
  _id: string;
  platform: 'google' | 'booking' | 'tripadvisor' | 'manual';
  hotelId: string;
  content: {
    text: string;
    rating: number;
    reviewerName: string;
    reviewerImage?: string;
    language?: string;
    images?: { url: string; caption: string; }[];
    likes?: number;
    originalUrl?: string;
  };
  metadata: {
    originalCreatedAt: Date;
    lastUpdated?: Date;
    syncedAt?: Date;
  };
  response?: {
    text: string;
    createdAt: Date;
    settings: {
      style: 'professional' | 'friendly';
      length: 'short' | 'medium' | 'long';
    };
  };
}

interface FiltersAndTableProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  hotel: string;
  hotels: Hotel[];
  handleFilterChange: (type: string, value: string) => void;
  responseStatus: string;
  platform: string;
  ratingFilter: string;
  resultsPerPage: number;
  handleRefresh: () => void;
  handleResultsPerPageChange: (value: number) => void;
  setSelectedRows: (rows: Review[]) => void;
  handleTableReady: (table: TableType<any>) => void;
  tableInstance: TableType<any> | null;
  selectedRows: Review[];
  setIsAnalyticsDialogOpen: (value: boolean) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (value: boolean) => void;
  setAnalysisProgress: (value: number) => void;
}

const FiltersAndTable = ({ 
  searchQuery, 
  setSearchQuery, 
  hotel, 
  hotels,
  handleFilterChange,
  responseStatus,
  platform,
  ratingFilter,
  resultsPerPage,
  handleRefresh,
  handleResultsPerPageChange,
  setSelectedRows,
  handleTableReady,
  tableInstance,
  selectedRows,
  setIsAnalyticsDialogOpen,
  isAnalyzing,
  setIsAnalyzing,
  setAnalysisProgress
}: FiltersAndTableProps) => {
  const router = useRouter()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<{
    status: 'idle' | 'syncing' | 'success' | 'error';
    message: string;
    count: number;
  }>({
    status: 'idle',
    message: '',
    count: 0
  });
  
  interface Integration {
    _id: string;
    platform: string;
    hotelId: string;
    status: string;
    syncConfig?: {
      type: string;
      frequency: string;
      lastSync?: string;
    };
  }
  
  const syncAllPlatforms = async () => {
    if (isSyncing || !hotel || hotel === 'all') return;
    
    setIsSyncing(true);
    setSyncStatus({
      status: 'syncing',
      message: 'Syncing platforms...',
      count: 0
    });
    
    try {
      const token = getCookie('token');
      
      // First, get all integrations for this property
      const integrationsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/integrations/hotel/${hotel}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!integrationsResponse.ok) {
        throw new Error('Failed to fetch integrations');
      }
      
      const integrations = await integrationsResponse.json() as Integration[];
      
      if (integrations.length === 0) {
        setSyncStatus({
          status: 'error',
          message: 'No platforms connected to this property',
          count: 0
        });
        toast.error('No platforms connected to this property');
        return;
      }
      
      setSyncStatus({
        status: 'syncing',
        message: `Syncing ${integrations.length} platforms...`,
        count: 0
      });
      
      // Sync all integrations one by one
      const syncPromises = integrations.map(async (integration: Integration) => {
        const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/integrations/${integration._id}/sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!syncResponse.ok) {
          const errorData = await syncResponse.json();
          throw new Error(errorData.message || `Failed to sync ${integration.platform}`);
        }
        
        return syncResponse.json();
      });
      
      const results = await Promise.all(syncPromises);
      
      // Count total new reviews
      const totalNewReviews = results.reduce((total, result) => {
        return total + (result.newReviews || 0);
      }, 0);
      
      setSyncStatus({
        status: 'success',
        message: `Sync completed: ${totalNewReviews} new reviews`,
        count: totalNewReviews
      });
      
      toast.success(`Sync completed: ${totalNewReviews} new reviews imported`);
      
      // Refresh the reviews list
      handleRefresh();
      
      // Reset the sync status after 5 seconds
      setTimeout(() => {
        setSyncStatus({
          status: 'idle',
          message: '',
          count: 0
        });
      }, 5000);
      
    } catch (error: any) {
      console.error('Sync error:', error);
      setSyncStatus({
        status: 'error',
        message: error.message || 'Failed to sync platforms',
        count: 0
      });
      toast.error(error.message || 'Failed to sync platforms');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-[200px] rounded-xl border-gray-200 focus:border-primary focus:ring-primary bg-white/50 text-sm"
              />
            </div>

            <Select
              value={hotel}
              onValueChange={(value) => handleFilterChange('hotel', value)}
            >
              <SelectTrigger className="h-9 w-[180px] rounded-xl border-gray-200 focus:border-primary focus:ring-primary bg-white/50 text-sm">
                <SelectValue placeholder="Select property" className="text-sm" />
              </SelectTrigger>
              <SelectContent>
                {hotels.map((h) => (
                  <SelectItem key={h._id} value={h._id} className="text-sm">
                    {h.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={responseStatus}
              onValueChange={(value) => handleFilterChange('responseStatus', value)}
            >
              <SelectTrigger className="h-9 w-[180px] rounded-xl border-gray-200 focus:border-primary focus:ring-primary bg-white/50 text-sm">
                <SelectValue placeholder="Response Status" className="text-sm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-sm">All Reviews</SelectItem>
                <SelectItem value="responded" className="text-sm">Responded</SelectItem>
                <SelectItem value="not_responded" className="text-sm">Not Responded</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={platform}
              onValueChange={(value) => handleFilterChange('platform', value)}
            >
              <SelectTrigger className="h-9 w-[180px] rounded-xl border-gray-200 focus:border-primary focus:ring-primary bg-white/50 text-sm">
                <SelectValue placeholder="Platform" className="text-sm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-sm">All Platforms</SelectItem>
                <SelectItem value="google" className="text-sm">Google</SelectItem>
                <SelectItem value="booking" className="text-sm">Booking.com</SelectItem>
                <SelectItem value="tripadvisor" className="text-sm">TripAdvisor</SelectItem>
                <SelectItem value="manual" className="text-sm">Manual</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={ratingFilter}
              onValueChange={(value) => handleFilterChange('rating', value)}
            >
              <SelectTrigger className="h-9 w-[180px] rounded-xl border-gray-200 focus:border-primary focus:ring-primary bg-white/50 text-sm">
                <SelectValue placeholder="Rating" className="text-sm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-sm">All Ratings</SelectItem>
                <SelectItem value="5" className="text-sm">5 Stars & Up</SelectItem>
                <SelectItem value="4" className="text-sm">4 Stars & Up</SelectItem>
                <SelectItem value="3" className="text-sm">3 Stars & Up</SelectItem>
                <SelectItem value="2" className="text-sm">2 Stars & Up</SelectItem>
                <SelectItem value="1" className="text-sm">1 Star & Up</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={syncAllPlatforms}
                    disabled={isSyncing || !hotel || hotel === 'all'}
                    className={cn(
                      "h-9 w-9 p-0 rounded-full border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center",
                      syncStatus.status === 'syncing' && "border-blue-200 bg-blue-50 text-blue-700",
                      syncStatus.status === 'success' && "border-green-200 bg-green-50 text-green-700",
                      syncStatus.status === 'error' && "border-red-200 bg-red-50 text-red-700"
                    )}
                  >
                    {syncStatus.status === 'syncing' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : syncStatus.status === 'success' ? (
                      <Check className="h-4 w-4" />
                    ) : syncStatus.status === 'error' ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    {syncStatus.status === 'success' && syncStatus.count > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-[10px] text-white">
                        {syncStatus.count}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-white border border-gray-200 shadow-md">
                  <p>Sync reviews from all connected platforms</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={async () => {
                      if (selectedRows.length === 0) {
                        toast.error("Please select at least one review");
                        return;
                      }
                      
                      if (!hotel || hotel === 'all') {
                        toast.error("Please select a hotel first")
                        return
                      }

                      // Imposta lo stato di analisi in corso
                      setIsAnalyzing(true);
                      
                      try {
                        const token = getCookie('token')
                        
                        // Limitiamo a 1000 recensioni, ordinandole per data più recente
                        const reviewsToAnalyze = selectedRows
                          .sort((a, b) => {
                            const dateA = new Date(a.metadata?.originalCreatedAt || 0).getTime();
                            const dateB = new Date(b.metadata?.originalCreatedAt || 0).getTime();
                            return dateB - dateA; // Ordine decrescente (più recenti prima)
                          })
                          .slice(0, 1000)
                          .map(review => review._id);
                        
                        const requestBody = {
                          hotelId: hotel,
                          reviews: reviewsToAnalyze
                        }

                        // Mostra un toast di caricamento invece di reindirizzare con un ID temporaneo
                        const toastId = toast.loading("Analyzing reviews, please wait...");

                        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/analyze`, {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify(requestBody)
                        })

                        // Rimuovi il toast di caricamento
                        toast.dismiss(toastId);

                        if (!response.ok) {
                          const errorData = await response.json()
                          throw new Error(`Failed to create analysis: ${errorData.message || 'Unknown error'}`)
                        }
                        
                        const data = await response.json()
                        
                        // Stampa la struttura della risposta per debug
                        console.log('Analysis response structure:', 
                          Object.keys(data), 
                          data.analysis ? Object.keys(data.analysis) : 'No analysis field'
                        );
                        
                        // Estrai l'ID nel modo corretto in base alla struttura della risposta
                        let analysisId;
                        
                        if (data._id) {
                          // Formato diretto
                          analysisId = data._id;
                        } else if (data.analysis && data.analysis._id) {
                          // Formato annidato in analysis
                          analysisId = data.analysis._id;
                        } else if (data.id) {
                          // Formato alternativo (senza underscore)
                          analysisId = data.id;
                        } else if (data.analysis && data.analysis.id) {
                          // Formato alternativo annidato
                          analysisId = data.analysis.id;
                        } else {
                          // Nessun formato riconosciuto
                          console.error('Response data structure:', data);
                          throw new Error('Invalid response format: missing ID field');
                        }

                        // Reindirizza solo dopo aver ricevuto l'ID valido
                        toast.success("Analysis completed successfully!");
                        // Set progress to 100% before redirecting
                        setAnalysisProgress(100);
                        // Add a small delay before redirecting to see the completed progress
                        setTimeout(() => {
                          router.push(`/analyses?id=${analysisId}`)
                        }, 800);
                      } catch (error: any) {
                        console.error('Full error details:', error)
                        toast.error(typeof error === 'object' && error?.message ? error.message : "Failed to create analysis")
                      } finally {
                        setIsAnalyzing(false);
                      }
                    }}
                    className="rounded-xl flex items-center gap-2 bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all"
                    disabled={selectedRows.length === 0 || isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <BarChart2 className="h-4 w-4" />
                    )}
                    {isAnalyzing ? "Analyzing..." : "Analyze Reviews"}
                    {selectedRows.length > 1000 && (
                      <span className="ml-1 inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                        1,000 limit
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[300px] p-3 text-sm bg-white border border-gray-200 shadow-md">
                  {selectedRows.length > 1000 ? (
                    <p>For optimal analysis, we'll process your 1,000 most recent reviews out of {selectedRows.length} selected. This ensures high-quality insights while maintaining performance.</p>
                  ) : (
                    <p>Generate insights by analyzing selected reviews.</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <div className="p-6">
        <ReviewsTable
          searchQuery={searchQuery}
          property={hotel}
          responseStatus={responseStatus}
          platform={platform}
          ratingFilter={ratingFilter}
          resultsPerPage={resultsPerPage}
          onRefresh={handleRefresh}
          onResultsPerPageChange={handleResultsPerPageChange}
          onSelectionChange={setSelectedRows}
          onTableReady={handleTableReady}
          tableInstance={tableInstance}
        />
      </div>
    </div>
  );
};

// Componente per l'onboarding
const OnboardingView = ({ onAddProperty }: { onAddProperty: () => void }) => (
  <div className="min-h-[80vh] flex items-center justify-center px-10">
    <div className="max-w-3xl w-full">
      <div className="text-center space-y-6 mb-12">
        <div className="flex justify-center">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/reviews-l1OpTAuGJuHcOblMRfwhcgfLCeAwcL.png"
            alt="Reviews Icon"
            width={120}
            height={120}
            className="animate-float"
          />
        </div>

        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          Welcome to Replai
        </h1>
        
        <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
          Start managing your hotel reviews efficiently. Connect your first property to begin responding to reviews with AI-powered assistance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          {
            icon: "🎯",
            title: "Centralize Reviews",
            description: "Manage all your reviews from different platforms in one place"
          },
          {
            icon: "⚡️",
            title: "Quick Responses",
            description: "Generate personalized responses in seconds with AI"
          },
          {
            icon: "🧠",
            title: "Smart Analytics",
            description: "AI analyzes reviews to uncover insights, suggests improvements, and answers your questions"
          }
        ].map((feature, i) => (
          <div 
            key={i}
            className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center space-y-4">
        <Button 
          onClick={onAddProperty}
          className="relative bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 px-12 text-xl rounded-2xl shadow-[0_4px_0_0_#1e40af] transition-all active:top-[2px] active:shadow-[0_0_0_0_#1e40af] hover:scale-105"
        >
          Add Your First Property
        </Button>
        <p className="text-sm text-gray-500">
          It only takes a few minutes to get started
        </p>
      </div>
    </div>
  </div>
)

const AnalysisProgressDialog = ({ 
  isOpen, 
  progress, 
  selectedReviewsCount 
}: { 
  isOpen: boolean, 
  progress: number, 
  selectedReviewsCount: number 
}) => {
  const actualReviewCount = Math.min(selectedReviewsCount, 1000);
  const isLimited = selectedReviewsCount > 1000;
  
  // Determina la fase corrente in base al progresso
  const getCurrentPhase = () => {
    if (progress < 25) return 1;
    if (progress < 50) return 2;
    if (progress < 75) return 3;
    return 4;
  };
  
  const currentPhase = getCurrentPhase();

  // Descrizioni delle fasi
  const phases = [
    {
      id: 1,
      title: "Base Analysis",
      description: "Processing metadata and sentiment distribution",
      detail: "Analyzing review ratings, calculating sentiment percentages, and identifying temporal trends"
    },
    {
      id: 2,
      title: "Strengths Analysis",
      description: "Identifying key strengths from reviews",
      detail: "Using hospitality industry knowledge to detect patterns and generate actionable marketing tips"
    },
    {
      id: 3, 
      title: "Issues Analysis",
      description: "Discovering areas for improvement",
      detail: "Prioritizing issues and creating comprehensive, industry-informed solutions"
    },
    {
      id: 4,
      title: "Quick Wins & Recommendations",
      description: "Finalizing insights and suggestions",
      detail: "Identifying immediate action items and generating follow-up questions"
    }
  ];
  
  return (
    <Dialog open={isOpen} onOpenChange={() => {
      // Prevent closing during analysis
      toast.error("Please wait until the analysis process completes")
    }}>
      <DialogContent className="sm:min-w-[600px] md:min-w-[700px] max-w-[90vw] max-h-[90vh] overflow-y-auto p-0 bg-white">
        <div className="p-8 flex flex-col items-center justify-center min-h-[500px]">
          <div className="w-full max-w-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Analyzing Reviews</h2>
              <div className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-sm font-medium flex items-center">
                <Clock className="w-4 h-4 mr-1" /> 5-6 minutes
              </div>
            </div>
            
            {/* Phase indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-blue-800">
                  Phase {currentPhase} of 4: {phases[currentPhase - 1].title}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {Math.round(progress)}%
                </span>
              </div>
              
              {/* Overall progress */}
              <Progress 
                value={progress} 
                className="h-3 w-full [&>div]:bg-primary rounded-full mb-3"
              />
              
              <p className="text-sm text-gray-600 mt-2">
                {phases[currentPhase - 1].description}
              </p>
            </div>
            
            {isLimited && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-xl mb-6">
                <div className="flex gap-3">
                  <div>
                    <p className="text-blue-700">
                      For optimal analysis quality, we're processing your <strong>1,000 most recent reviews</strong> out of {selectedReviewsCount} selected.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-xl mb-6">
              <div className="flex gap-3">
                <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-amber-800 mb-2">Please Don't Close This Window</h3>
                  <p className="text-amber-700">
                    We're currently analyzing your selected reviews in multiple phases to generate comprehensive insights.
                    This process includes necessary pauses between phases and will take about 5-6 minutes for a full analysis of 1,000 reviews.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-medium text-gray-800 mb-3">Analysis Phases:</h3>
              <div className="space-y-4">
                {phases.map((phase) => (
                  <div key={phase.id} className="flex items-start gap-3">
                    <div className={`rounded-full w-6 h-6 flex items-center justify-center text-xs ${
                      currentPhase > phase.id 
                        ? 'bg-green-500 text-white' 
                        : currentPhase === phase.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200'
                    }`}>
                      {currentPhase > phase.id ? '✓' : phase.id}
                    </div>
                    <div>
                      <p className={`font-medium ${
                        currentPhase === phase.id 
                          ? 'text-blue-700'
                          : currentPhase > phase.id
                          ? 'text-green-700'
                          : 'text-gray-700'
                      }`}>{phase.title}</p>
                      <p className="text-sm text-gray-500">{phase.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ReviewsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [hotel, setHotel] = useState("all")
  const [responseStatus, setResponseStatus] = useState("all")
  const [platform, setPlatform] = useState("all")
  const [resultsPerPage, setResultsPerPage] = useState<number>(10)
  const [ratingFilter, setRatingFilter] = useState("all")
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { setFilters } = useReviews()
  const [selectedRows, setSelectedRows] = useState<Review[]>([])
  const [tableInstance, setTableInstance] = useState<TableType<any> | null>(null);
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false)
  const [isAnalyticsDialogOpen, setIsAnalyticsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

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

        // Se ci sono hotel, imposta il primo come selezionato
        if (data.length > 0) {
          setHotel(data[0]._id)
          setFilters({ hotelId: data[0]._id })
        }
      } catch (error) {
        console.error('Error fetching hotels:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHotels()
  }, [])

  const handleFilterChange = (type: string, value: string) => {
    switch (type) {
      case 'hotel':
        setHotel(value)
        setFilters({ hotelId: value })
        break
      case 'platform':
        setPlatform(value)
        setFilters({ platform: value })
        break
      case 'responseStatus':
        setResponseStatus(value)
        setFilters({ responseStatus: value })
        break
      case 'rating':
        setRatingFilter(value)
        setFilters({ rating: value })
        break
      case 'search':
        setSearchQuery(value)
        setFilters({ searchQuery: value })
        break
    }
  }

  const handleResultsPerPageChange = (value: number) => {
    setResultsPerPage(value)
  }

  const handleRefresh = () => {
    // Implementa la logica per il refresh qui
  }

  const handleTableReady = (table: TableType<any>) => {
    setTableInstance(table);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Codice per inviare la richiesta
      // ...
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
      }, 1000);
    }
  };

  // Add progress animation effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let pauseTimeout: NodeJS.Timeout;
    let isPaused = false;
    
    if (isAnalyzing) {
      setIsAnalysisDialogOpen(true)
      // Reset progress
      setAnalysisProgress(0)
      
      // Simulate progress with pauses between phases to better match backend
      interval = setInterval(() => {
        if (isPaused) return;
        
        setAnalysisProgress(prev => {
          // If we reached specific pause points (end of each phase)
          if ((prev >= 24.8 && prev < 25) || 
              (prev >= 49.8 && prev < 50) || 
              (prev >= 74.8 && prev < 75)) {
            
            // Trigger pause
            isPaused = true;
            const pauseDuration = prev < 25 ? 70000 : // 70 seconds after phase 1
                                 prev < 50 ? 90000 : // 90 seconds after phase 2 
                                 70000;             // 70 seconds after phase 3
            
            // Show exact phase boundary
            const exactProgress = prev < 25 ? 25 : prev < 50 ? 50 : 75;
            setAnalysisProgress(exactProgress);
            
            // Resume after pause
            pauseTimeout = setTimeout(() => {
              isPaused = false;
            }, pauseDuration);
            
            return exactProgress;
          }
          
          // Regular progress speed - much slower to match the backend timing
          // Phase 1: 0-25% (Base Analysis)
          if (prev < 25) {
            return Math.min(25, prev + 0.3);
          }
          // Phase 2: 25-50% (Strengths Analysis)
          else if (prev < 50) {
            return Math.min(50, prev + 0.2);
          }
          // Phase 3: 50-75% (Issues Analysis)
          else if (prev < 75) {
            return Math.min(75, prev + 0.2);
          }
          // Phase 4: 75-95% (Quick Wins & Recommendations)
          else if (prev < 95) {
            return Math.min(95, prev + 0.15);
          }
          // Stop at 95% (the remaining 5% happens when redirecting to results)
          return 95;
        });
      }, 300); // Update approximately every 300ms (slower updates)
    } else {
      setAnalysisProgress(0)
      setIsAnalysisDialogOpen(false)
    }
    
    return () => {
      if (interval) clearInterval(interval);
      if (pauseTimeout) clearTimeout(pauseTimeout);
    };
  }, [isAnalyzing]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-600">Loading your properties...</p>
        </div>
      </div>
    )
  }

  if (hotels.length === 0) {
    return (
      <>
        {/* Sfondo aggiornato con gradiente */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#FAFAFB] via-[#F0F0F2] to-[#FAFAFB] backdrop-blur-sm" />
        
        <OnboardingView onAddProperty={() => setIsAddPropertyModalOpen(true)} />

        <AnalysisProgressDialog 
          isOpen={isAnalysisDialogOpen} 
          progress={analysisProgress}
          selectedReviewsCount={selectedRows.length}
        />

        <AddPropertyModal 
          isOpen={isAddPropertyModalOpen}
          onClose={() => setIsAddPropertyModalOpen(false)}
          onSuccess={async () => {
            // Aggiorna la lista degli hotel
            const token = getCookie('token')
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              }
            })
            
            if (response.ok) {
              const data = await response.json()
              setHotels(data)
              if (data.length > 0) {
                setHotel(data[0]._id)
                setFilters({ hotelId: data[0]._id })
              }
            }
          }}
        />
      </>
    )
  }

  return (
    <>
      {/* Rimosso il blocco intero del banner promozionale della Chrome extension */}
      
      {/* Sfondo aggiornato con gradiente */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#FAFAFB] via-[#F0F0F2] to-[#FAFAFB] backdrop-blur-sm" />
      
      <AnalysisProgressDialog 
        isOpen={isAnalysisDialogOpen} 
        progress={analysisProgress}
        selectedReviewsCount={selectedRows.length}
      />

      <div className="flex flex-col px-10 md:pl-[96px] py-12 min-h-screen">
        <div className="max-w-[1400px] mx-auto w-full space-y-12">
          {/* Header modernizzato e allineato a sinistra */}
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue-600 to-blue-400" />
              <h1 className="text-3xl sm:text-4xl font-semibold bg-gradient-to-b from-blue-800 to-blue-600 bg-clip-text text-transparent">
                Review Management
              </h1>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <p className="text-base">
                Manage, analyze and respond to all your reviews in one place
              </p>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                {hotels.length} Properties
              </span>
            </div>
          </div>

          <Toaster position="top-right" />
          
          <FiltersAndTable 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            hotel={hotel}
            hotels={hotels}
            handleFilterChange={handleFilterChange}
            responseStatus={responseStatus}
            platform={platform}
            ratingFilter={ratingFilter}
            resultsPerPage={resultsPerPage}
            handleRefresh={handleRefresh}
            handleResultsPerPageChange={handleResultsPerPageChange}
            setSelectedRows={setSelectedRows}
            handleTableReady={handleTableReady}
            tableInstance={tableInstance}
            selectedRows={selectedRows}
            setIsAnalyticsDialogOpen={setIsAnalyticsDialogOpen}
            isAnalyzing={isAnalyzing}
            setIsAnalyzing={setIsAnalyzing}
            setAnalysisProgress={setAnalysisProgress}
          />
        </div>
      </div>
    </>
  )
}

// Aggiungiamo l'animazione float (utilizzata in OnboardingView)
const styles = `
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
    100% { transform: translateY(0px); }
  }
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
`

// Aggiungiamo lo style al documento
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style")
  styleSheet.innerText = styles
  document.head.appendChild(styleSheet)
}