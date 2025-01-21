import { create } from 'zustand';
import { getCookie } from '@/lib/utils';

export interface Review {
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
  response?: {
    text: string;
    createdAt: Date;
    settings: {
      style: 'professional' | 'friendly';
      length: 'short' | 'medium' | 'long';
    };
  };
  metadata: {
    originalCreatedAt: Date;
    lastUpdated?: Date;
    syncedAt?: Date;
  };
}

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
      const params = new URLSearchParams();
      if (filters.platform !== 'all') params.append('platform', filters.platform);
      if (filters.responseStatus !== 'all') params.append('status', filters.responseStatus);
      if (filters.rating !== 'all') params.append('rating', filters.rating);
      if (filters.searchQuery) params.append('search', filters.searchQuery);
      
      const token = getCookie('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/hotel/${filters.hotelId || 'all'}?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const reviews = await response.json();
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
      const token = getCookie('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/stats/${hotelId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const stats = await response.json();
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
    const token = getCookie('token');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        hotelId,
        review,
        responseSettings: settings
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to generate response');
    }

    const data = await response.json();
    get().fetchReviews(); // Aggiorna le recensioni dopo la generazione della risposta
    return data.response;
  },
}));

export default useReviews;