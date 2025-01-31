"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CreditCard, Coins, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUser } from "@/hooks/use-user"
import { toast } from "sonner"
import { getCookie } from "@/lib/utils"
import { useWallet } from "@/hooks/useWallet"
import { useEffect, useState } from "react"
import CreditPurchaseSlider from "@/components/billing/CreditPurchaseSlider"
import { motion } from "framer-motion"

export default function BillingPage() {
  const router = useRouter()
  const { user } = useUser()
  const { credits, freeScrapingRemaining, recentTransactions, isLoading } = useWallet()
  const [isSliderOpen, setIsSliderOpen] = useState(false)

  const handleBuyCredits = () => {
    setIsSliderOpen(true)
  }

  return (
    <div className="min-h-screen bg-[url('/grain.svg')] bg-repeat py-12">
      {/* Header Section */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-6xl font-bold text-gray-800 [text-shadow:_2px_2px_0_rgb(0_0_0_/_20%)]">
            Wallet & Credits
          </h1>
        </motion.div>
        <motion.p 
          className="text-xl text-gray-600 mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Manage your credits and usage
        </motion.p>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        {/* Current Credits Section */}
        <div className="bg-white border-2 border-gray-200 rounded-3xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Coins className="w-8 h-8 text-primary mr-4" />
              <h2 className="text-2xl font-bold text-gray-800">Available Credits</h2>
            </div>
            <span className="text-3xl font-bold text-primary">
              {isLoading ? "..." : credits.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center justify-between mb-6">
            <span className="text-gray-600">Free Reviews Remaining</span>
            <span className="text-primary font-medium flex items-center">
              <Download className="w-4 h-4 mr-2" />
              {isLoading ? "..." : freeScrapingRemaining}
            </span>
          </div>
          <Button
            onClick={handleBuyCredits}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-xl py-6 rounded-xl transition-all shadow-[0_4px_0_0_#1d4ed8]"
          >
            Buy More Credits
          </Button>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white border-2 border-gray-200 rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Transactions</h2>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No recent transactions</div>
            ) : (
              recentTransactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800">{transaction.description}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  <div className={`font-bold ${
                    transaction.credits > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.credits > 0 ? '+' : ''}{transaction.credits.toFixed(1)}
                  </div>
                </div>
              ))
            )}
          </div>
          <Button 
            variant="outline" 
            className="w-full mt-6"
            onClick={() => router.push('/billing/transactions')}
          >
            View All Transactions
          </Button>
        </div>

        {/* Credit Costs */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Credit Usage</h2>
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Download className="w-5 h-5 mr-3 text-primary" />
                <span>Download Review</span>
              </div>
              <span className="font-medium">0.1 credits</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <CreditCard className="w-5 h-5 mr-3 text-primary" />
                <span>Generate Response</span>
              </div>
              <span className="font-medium">2 credits</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <CreditCard className="w-5 h-5 mr-3 text-primary" />
                <span>Edit Response</span>
              </div>
              <span className="font-medium">1 credit</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <CreditCard className="w-5 h-5 mr-3 text-primary" />
                <span>Analysis Report</span>
              </div>
              <span className="font-medium">10-30 credits</span>
            </div>
          </div>
        </div>
      </div>

      {/* TODO: Aggiungere il componente Slider per l'acquisto dei crediti */}
      {isSliderOpen && (
        <CreditPurchaseSlider 
          open={isSliderOpen} 
          onClose={() => setIsSliderOpen(false)} 
        />
      )}
    </div>
  )
}