'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

type User = {
  id: string;
  email: string;
  name: string;
  subscription: {
    plan: 'trial' | 'host' | 'manager' | 'director';
    status: 'active' | 'inactive' | 'cancelled' | 'past_due';
    responseCredits: number;
    trialEndsAt?: Date;
  };
};

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = auth.token;
        
        if (!token) {
          setLoading(false);
          router.push('/login');
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            auth.clearAuth();
            router.push('/login');
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
        auth.clearAuth();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router, auth]);

  return { user, loading };
};

export default useUser;
