import { create } from 'zustand'
import { getCookie } from '@/lib/utils'
import { type Review } from '@/types/types'

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
  generateResponse: (hotelId: string, reviewText: string, settings: ResponseSettings) => Promise<string>
}

interface ResponseSettings {
  style: 'professional' | 'friendly'
  length: 'short' | 'medium' | 'long'
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
    
    try {
      const token = getCookie('token')
      const queryParams = new URLSearchParams()
      
      if (filters.platform !== 'all') queryParams.append('platform', filters.platform)
      if (filters.responseStatus !== 'all') queryParams.append('responseStatus', filters.responseStatus)
      if (filters.rating !== 'all') queryParams.append('rating', filters.rating)
      if (filters.searchQuery) queryParams.append('search', filters.searchQuery)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/hotel/${filters.hotelId}?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      )

      if (!response.ok) throw new Error('Failed to fetch reviews')
      
      const data = await response.json()
      set({ reviews: data, loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch reviews', loading: false })
    }
  },

  generateResponse: async (hotelId: string, reviewText: string, settings: ResponseSettings) => {
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
        responseSettings: settings
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to generate response')
    }

    const data = await response.json()
    
    // Refresh reviews after generating response
    get().fetchReviews()
    
    return data.response
  }
}))

export default useReviews