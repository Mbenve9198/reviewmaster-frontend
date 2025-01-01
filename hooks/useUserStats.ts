import { useState, useEffect, useCallback } from 'react'
import { getCookie } from 'cookies-next'

export interface UserStats {
  responsesUsed: number
  responsesLimit: number
  hotelsCount: number
  hotelsLimit: number
  responseCredits: number
  subscriptionPlan: string
  nextResetDate: string
  isLoading?: boolean
  error?: any
}

export function useUserStats() {
  const [stats, setStats] = useState<UserStats>({
    responsesUsed: 0,
    responsesLimit: 0,
    hotelsCount: 0,
    hotelsLimit: 0,
    responseCredits: 0,
    subscriptionPlan: '',
    nextResetDate: '',
    isLoading: true,
    error: null
  })

  const fetchStats = useCallback(async () => {
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
      const responsesUsed = data.subscription.responsesUsed || 0

      setStats({
        responsesUsed,
        responsesLimit: data.subscription.responsesLimit,
        hotelsCount: data.hotelsCount,
        hotelsLimit: data.subscription.hotelsLimit,
        responseCredits: data.subscription.responseCredits,
        subscriptionPlan: data.subscription.plan,
        nextResetDate: data.subscription.nextResetDate,
        isLoading: false,
        error: null
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      setStats(prev => ({ ...prev, isLoading: false, error }))
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { ...stats, refetch: fetchStats }
}
