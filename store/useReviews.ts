import { create } from 'zustand'
import { getCookie } from '@/lib/utils'
import { type Review } from '@/types/types'

type MessageSender = "user" | "ai";

interface ChatMessage {
  id: number;
  content: string;
  sender: MessageSender;
}

interface ResponseSettings {
  style: 'professional' | 'friendly';
  length: 'short' | 'medium' | 'long';
}

interface ReviewsState {
  reviews: Review[]
  loading: boolean
  error: string | null
  filters: {
    hotelId: string
    platform: string
    responseStatus: string
    rating: string
    searchQuery: string
  }
  setFilters: (filters: Partial<ReviewsState['filters']>) => void
  fetchReviews: () => Promise<void>
  updateReviewResponse: (reviewId: string, response: string) => void
  generateResponse: (
    hotelId: string, 
    reviewText: string, 
    settings: ResponseSettings,
    previousMessages?: ChatMessage[],
    reviewId?: string
  ) => Promise<string>
}

const useReviews = create<ReviewsState>((set, get) => ({
  reviews: [],
  loading: false,
  error: null,
  filters: {
    hotelId: 'all',
    platform: 'all',
    responseStatus: 'all',
    rating: 'all',
    searchQuery: ''
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }))
    // Fetch reviews whenever filters change
    get().fetchReviews()
  },

  fetchReviews: async () => {
    const { filters } = get()
    if (filters.hotelId === 'all') return // Don't fetch if no hotel is selected

    set({ loading: true, error: null })
    console.log('Fetching reviews with filters:', filters)
    
    try {
      const token = getCookie('token')
      const queryParams = new URLSearchParams()
      
      if (filters.platform !== 'all') queryParams.append('platform', filters.platform)
      if (filters.responseStatus !== 'all') queryParams.append('responseStatus', filters.responseStatus)
      if (filters.rating !== 'all') queryParams.append('rating', filters.rating)
      if (filters.searchQuery) queryParams.append('search', filters.searchQuery)

      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/hotel/${filters.hotelId}?${queryParams}`
      console.log('Fetching URL:', url)

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch reviews')
      }
      
      const data = await response.json()
      console.log('Fetched reviews:', data)
      set({ reviews: data, loading: false })
    } catch (error) {
      console.error('Error fetching reviews:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch reviews', 
        loading: false 
      })
    }
  },

  updateReviewResponse: (reviewId: string, response: string) => {
    set((state) => ({
      reviews: state.reviews.map(review => 
        review._id === reviewId
          ? { 
              ...review, 
              response: { 
                text: response,
                createdAt: new Date(),
                synced: false
              } 
            }
          : review
      )
    }))
  },

  generateResponse: async (
    hotelId: string, 
    reviewText: string, 
    settings: ResponseSettings,
    previousMessages?: ChatMessage[],
    reviewId?: string
  ) => {
    const token = getCookie('token')
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        hotelId,
        review: reviewText,
        responseSettings: settings,
        previousMessages
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      // Gestione più specifica per errore 429
      if (response.status === 429) {
        throw new Error(data.message || 'Too many similar requests. Please wait a moment before trying again.');
      }
      throw new Error(data.message || 'Failed to generate response')
    }

    // Gestione più robusta della risposta
    if (data.content) {
      return data.content;
    } else if (data.response) {
      return data.response;
    } else if (typeof data === 'string') {
      return data;
    } else {
      console.warn('Response format not recognized:', data);
      return 'Response generated but format not recognized';
    }
  }
}))

export default useReviews