// services/api.ts
import axios from 'axios';
import { getCookie } from 'cookies-next';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Configura l'istanza axios con le impostazioni di default
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor per aggiungere il token di autenticazione
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

export interface Hotel {
  _id: string;
  name: string;
  type: string;
  description: string;
  managerSignature: string;
  responseSettings: {
    style: 'professional' | 'friendly' | 'formal';
    length: 'short' | 'medium' | 'long';
  };
}

// Funzioni per le recensioni
export const reviewsApi = {
  getReviews: async (hotelId?: string, filters?: {
    platform?: string;
    responseStatus?: string;
    rating?: number;
    searchQuery?: string;
  }) => {
    const params = new URLSearchParams();
    if (hotelId) params.append('hotelId', hotelId);
    if (filters?.platform) params.append('platform', filters.platform);
    if (filters?.responseStatus) params.append('responseStatus', filters.responseStatus);
    if (filters?.rating) params.append('rating', filters.rating.toString());
    if (filters?.searchQuery) params.append('search', filters.searchQuery);

    const response = await axiosInstance.get(`/reviews/hotel/${hotelId || ''}?${params.toString()}`);
    return response.data;
  },

  generateResponse: async (hotelId: string, review: string, settings: {
    style: 'professional' | 'friendly';
    length: 'short' | 'medium' | 'long';
  }) => {
    const response = await axiosInstance.post('/reviews/generate', {
      hotelId,
      review,
      responseSettings: settings
    });
    return response.data;
  },

  updateResponse: async (reviewId: string, response: string) => {
    const res = await axiosInstance.put(`/reviews/${reviewId}/response`, { response });
    return res.data;
  },

  getStats: async (hotelId: string) => {
    const response = await axiosInstance.get(`/reviews/stats/${hotelId}`);
    return response.data;
  }
};

// Funzioni per gli hotel
export const hotelsApi = {
  getHotels: async () => {
    const response = await axiosInstance.get('/hotels');
    return response.data;
  },

  getHotel: async (id: string) => {
    const response = await axiosInstance.get(`/hotels/${id}`);
    return response.data;
  }
};

// Auth APIs
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await axiosInstance.post('/auth/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    return { token, user };
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  getProfile: async () => {
    const response = await axiosInstance.get('/auth/profile');
    return response.data;
  }
};

// Funzioni per l'analytics
export const analyticsApi = {
  getAnalyses: async () => {
    const token = getCookie('token');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch analyses');
    }

    return response.json();
  },

  downloadAnalysisPDF: async (analysisId: string) => {
    const token = getCookie('token');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/${analysisId}/pdf`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to download PDF');
    }

    // Trigger il download del PDF
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${analysisId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  analyzeReviews: async (
    reviews: any[], 
    prompt: string, 
    previousMessages?: string | null,
    messages?: Array<{ role: string; content: string }>
  ) => {
    const token = getCookie('token');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        reviews: reviews.slice(0, 500), // Aumentato a 500 recensioni
        prompt, 
        previousMessages,
        messages
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to analyze reviews');
    }

    const data = await response.json();
    return {
      analysis: data.analysis,
      suggestions: data.suggestions,
      reviewsAnalyzed: data.reviewsAnalyzed,
      avgRating: data.avgRating,
      platforms: data.platforms,
      creditsRemaining: data.creditsRemaining,
      provider: data.provider
    };
  },

  getFollowUpAnalysis: async (
    analysisId: string,
    prompt: string,
    previousMessages?: string | null,
    messages?: Array<{ role: string; content: string }>
  ) => {
    const token = getCookie('token');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/${analysisId}/follow-up`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        previousMessages,
        messages
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get follow-up analysis');
    }

    const data = await response.json();
    return {
      analysis: data.analysis,
      provider: data.provider
    };
  },

  renameAnalysis: async (analysisId: string, newTitle: string) => {
    const token = getCookie('token');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/${analysisId}/rename`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: newTitle })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to rename analysis');
    }

    return response.json();
  },

  deleteAnalysis: async (analysisId: string) => {
    const token = getCookie('token');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/${analysisId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete analysis');
    }

    return response.json();
  },

  getValuePlan: async (strength: any) => {
    const token = getCookie('token');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/value-plan`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ strength }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate value plan');
    }
    
    return response.json();
  },
  
  getSolutionPlan: async (issue: any) => {
    const token = getCookie('token');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/solution-plan`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ issue }),
    });
    
    if (!response.ok) {
        const error = await response.json();
        if (response.status === 429) {
            throw new Error('QUOTA_EXCEEDED');
        }
        throw new Error(error.message || 'Failed to generate solution plan');
    }
    
    return response.json();
  },
};

// Export principale
export const api = {
  reviews: reviewsApi,
  analytics: analyticsApi,
  hotels: hotelsApi,
  auth: authApi
};

export default api;