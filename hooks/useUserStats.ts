import { useState, useEffect } from 'react'
import { getCookie } from '@/lib/utils'
import { API_BASE_URL } from '@/lib/api-config'

interface UserStats {
  responsesUsed: number
  responsesLimit: number
  hotelsCount: number
  hotelsLimit: number
  subscriptionPlan: string
  isLoading: boolean
  error: string | null
}

export function useUserStats() {
  const [stats, setStats] = useState<UserStats>({
    responsesUsed: 0,
    responsesLimit: 0,
    hotelsCount: 0,
    hotelsLimit: 0,
    subscriptionPlan: '',
    isLoading: true,
    error: null
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/stats`, {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${getCookie('token')}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }

        const data = await response.json()
        setStats({
          responsesUsed: data.subscription.responseCredits,
          responsesLimit: data.subscription.responsesLimit,
          hotelsCount: data.hotelsCount,
          hotelsLimit: data.subscription.hotelsLimit,
          subscriptionPlan: data.subscription.plan,
          isLoading: false,
          error: null
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
        throw error
      }
    }

    fetchStats()
  }, [])

  return stats
} 