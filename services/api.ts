// services/api.ts
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Configura l'istanza axios con le impostazioni di default
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor per aggiungere il token di autenticazione
api.interceptors.request.use((config) => {
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

    const response = await api.get(`/reviews/hotel/${hotelId || ''}?${params.toString()}`);
    return response.data;
  },

  generateResponse: async (hotelId: string, review: string, settings: {
    style: 'professional' | 'friendly';
    length: 'short' | 'medium' | 'long';
  }) => {
    const response = await api.post('/reviews/generate', {
      hotelId,
      review,
      responseSettings: settings
    });
    return response.data;
  },

  updateResponse: async (reviewId: string, response: string) => {
    const res = await api.put(`/reviews/${reviewId}/response`, { response });
    return res.data;
  },

  getStats: async (hotelId: string) => {
    const response = await api.get(`/reviews/stats/${hotelId}`);
    return response.data;
  }
};

// Funzioni per gli hotel
export const hotelsApi = {
  getHotels: async () => {
    const response = await api.get('/hotels');
    return response.data;
  },

  getHotel: async (id: string) => {
    const response = await api.get(`/hotels/${id}`);
    return response.data;
  }
};

// Auth APIs
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    return { token, user };
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  }
};

export default api;