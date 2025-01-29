import { useState, useEffect } from 'react'
import { getCookie } from '@/lib/utils'
import { toast } from 'sonner'

interface Transaction {
  id: string
  type: 'purchase' | 'usage' | 'bonus'
  credits: number
  description: string
  createdAt: string
  amount?: number
  metadata: {
    actionType?: string
    pricePerCredit?: number
  }
}

interface WalletInfo {
  credits: number
  freeScrapingUsed: number
  freeScrapingRemaining: number
  recentTransactions: Transaction[]
}

export function useWallet() {
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    credits: 0,
    freeScrapingUsed: 0,
    freeScrapingRemaining: 0,
    recentTransactions: []
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchWalletInfo = async () => {
      try {
        const token = getCookie('token')
        if (!token) {
          toast.error('Session expired. Please login again.')
          return
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallet`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch wallet info')
        }

        const data = await response.json()
        setWalletInfo(data)
      } catch (error) {
        console.error('Error fetching wallet info:', error)
        toast.error('Failed to load wallet information')
      } finally {
        setIsLoading(false)
      }
    }

    fetchWalletInfo()
  }, [])

  return {
    ...walletInfo,
    isLoading,
    refresh: () => setIsLoading(true) // Trigger a refresh
  }
}

export default useWallet