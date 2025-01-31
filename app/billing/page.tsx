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
import { Tiles } from "@/components/ui/tiles"
import { HandWrittenTitle } from "@/components/ui/hand-writing-text"

export default function BillingPage() {
  const router = useRouter()
  const { user } = useUser()
  const { credits, freeScrapingRemaining, recentTransactions, isLoading } = useWallet()
  const [isSliderOpen, setIsSliderOpen] = useState(false)
  const [isTransactionsExpanded, setIsTransactionsExpanded] = useState(false)

  const handleBuyCredits = () => {
    setIsSliderOpen(true)
  }

  const displayedTransactions = isTransactionsExpanded 
    ? recentTransactions 
    : recentTransactions.slice(0, 3)

  return (
    <div className="min-h-screen py-12 md:pl-[100px]">
      <Tiles 
        className="fixed inset-0 -z-10" 
        rows={100}
        cols={20}
        tileSize="md"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HandWrittenTitle 
          title="Wallet"
          subtitle="Manage your credits and usage"
        />

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Current Credits Section */}
            <div className="bg-white border-2 border-gray-200 rounded-3xl p-8">
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

            {/* Credit Costs - Spostato qui e stilizzato come una card */}
            <div className="bg-white border-2 border-gray-200 rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <CreditCard className="w-8 h-8 text-primary mr-4" />
                Credit Usage
              </h2>
              <div className="space-y-4">
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

          {/* Recent Transactions Section */}
          <div className="bg-white border-2 border-gray-200 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Transactions</h2>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-4">Loading...</div>
              ) : recentTransactions.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No recent transactions</div>
              ) : (
                displayedTransactions.map((transaction) => (
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
            
            <div className="flex flex-col gap-3 mt-6">
              {recentTransactions.length > 3 && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsTransactionsExpanded(!isTransactionsExpanded)}
                >
                  {isTransactionsExpanded ? 'Show Less' : 'Show More'}
                </Button>
              )}
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push('/billing/transactions')}
              >
                View All Transactions
              </Button>
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