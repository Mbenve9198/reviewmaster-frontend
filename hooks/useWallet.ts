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

interface AutoTopUpSettings {
  minimumThreshold: number
  topUpAmount: number
  autoTopUp: boolean
}

interface WalletInfo {
  credits: number
  freeScrapingUsed: number
  freeScrapingRemaining: number
  recentTransactions: Transaction[]
  failedTransactions: Transaction[]
  autoTopUpSettings?: AutoTopUpSettings
}

export function useWallet() {
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    credits: 0,
    freeScrapingUsed: 0,
    freeScrapingRemaining: 0,
    recentTransactions: [],
    failedTransactions: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const fetchWalletInfo = async () => {
    try {
      setIsLoading(true)
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

  useEffect(() => {
    fetchWalletInfo()
  }, [refreshTrigger]) // Ricarica quando refreshTrigger cambia

  return {
    ...walletInfo,
    isLoading,
    refresh: () => setRefreshTrigger(prev => prev + 1) // Incrementa il trigger per forzare il refresh
  }
}

export default useWallet