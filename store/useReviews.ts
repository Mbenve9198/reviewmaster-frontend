// store/useReviews.ts
import { create } from 'zustand';
import { reviewsApi, type Review } from '@/services/api';

interface ReviewsState {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  filters: {
    hotelId: string;
    platform: string;
    responseStatus: string;
    rating: string;
    searchQuery: string;
  };
  stats: {
    averageRating: number;
    totalReviews: number;
    responseRate: number;
  } | null;
  
  // Actions
  fetchReviews: () => Promise<void>;
  fetchStats: (hotelId: string) => Promise<void>;
  setFilters: (filters: Partial<ReviewsState['filters']>) => void;
  generateResponse: (hotelId: string, review: string, settings: {
    style: 'professional' | 'friendly';
    length: 'short' | 'medium' | 'long';
  }) => Promise<string>;
}

const useReviews = create<ReviewsState>((set, get) => ({
  reviews: [],
  loading: false,
  error: null,
  filters: {
    hotelId: '',
    platform: 'all',
    responseStatus: 'all',
    rating: 'all',
    searchQuery: '',
  },
  stats: null,

  fetchReviews: async () => {
    const { filters } = get();
    set({ loading: true, error: null });
    
    try {
      const reviews = await reviewsApi.getReviews(filters.hotelId, {
        platform: filters.platform !== 'all' ? filters.platform : undefined,
        responseStatus: filters.responseStatus !== 'all' ? filters.responseStatus : undefined,
        rating: filters.rating !== 'all' ? parseInt(filters.rating) : undefined,
        searchQuery: filters.searchQuery || undefined,
      });
      
      set({ reviews, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error fetching reviews',
        loading: false 
      });
    }
  },

  fetchStats: async (hotelId: string) => {
    try {
      const stats = await reviewsApi.getStats(hotelId);
      set({ stats });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
    get().fetchReviews();
  },

  generateResponse: async (hotelId: string, review: string, settings) => {
    try {
      const response = await reviewsApi.generateResponse(hotelId, review, settings);
      // Aggiorna le recensioni dopo la generazione della risposta
      get().fetchReviews();
      return response.response;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Error generating response');
    }
  },
}));

export default useReviews;