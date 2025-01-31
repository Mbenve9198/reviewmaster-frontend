"use client"

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Wallet, 
  Sparkles, 
  Download, 
  ArrowRight, 
  FileSpreadsheet, 
  Clock, 
  PlusCircle, 
  MinusCircle, 
  Rocket, 
  PencilRuler 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from "@/hooks/use-user";
import { useWallet } from "@/hooks/useWallet";
import CreditPurchaseSlider from "@/components/billing/CreditPurchaseSlider";
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";
import { Tiles } from "@/components/ui/tiles";
import Image from "next/image"

type CardType = 'credits' | 'usage' | null;

export default function BillingPage() {
  const router = useRouter();
  const { user } = useUser();
  const { credits, freeScrapingRemaining, recentTransactions, isLoading } = useWallet();
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const [isTransactionsExpanded, setIsTransactionsExpanded] = useState(false);
  const [activeCard, setActiveCard] = useState<CardType>(null);

  const displayedTransactions = isTransactionsExpanded 
    ? recentTransactions 
    : recentTransactions.slice(0, 3);

  const creditUsageItems = [
    { icon: Download, label: "Download Review", cost: "0.1" },
    { icon: Rocket, label: "Generate Response", cost: "2" },
    { icon: PencilRuler, label: "Edit Response", cost: "1" },
    { icon: FileSpreadsheet, label: "Analysis Report", cost: "10-30" }
  ];

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
            {/* Credits Card */}
            <div 
              className="group relative overflow-hidden bg-white rounded-3xl p-8 border border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              onMouseEnter={() => setActiveCard('credits')}
              onMouseLeave={() => setActiveCard(null)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded-bl-full transform transition-transform duration-300 group-hover:scale-110" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/billing-Y6wfuqXGbZ7TIpFrhCoDQMjXShiPgI.png"
                      alt=""
                      width={48}
                      height={48}
                      className="w-9 h-9 flex-shrink-0"
                    />
                    <h2 className="text-2xl font-bold text-gray-800 ml-4">Available Credits</h2>
                  </div>
                  <span className="text-4xl font-bold text-primary">
                    {isLoading ? "..." : credits.toFixed(1)}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-600">Free Reviews Remaining</span>
                  <span className="text-primary font-medium flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    {isLoading ? "..." : freeScrapingRemaining}
                  </span>
                </div>

                <Button
                  onClick={() => setIsSliderOpen(true)}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-xl py-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px]"
                >
                  Buy More Credits
                  <Sparkles className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Usage Card */}
            <div 
              className="group relative overflow-hidden bg-white rounded-3xl p-8 border border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              onMouseEnter={() => setActiveCard('usage')}
              onMouseLeave={() => setActiveCard(null)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded-bl-full transform transition-transform duration-300 group-hover:scale-110" />
              
              <div className="relative">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <div className="p-3 bg-primary/10 rounded-xl mr-4">
                    <Wallet className="w-8 h-8 text-primary" />
                  </div>
                  Credit Usage
                </h2>

                <div className="space-y-4">
                  {creditUsageItems.map((item, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex items-center">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <item.icon className="w-5 h-5 text-primary" />
                        </div>
                        <span className="ml-3">{item.label}</span>
                      </div>
                      <span className="font-medium">{item.cost} credits</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Card */}
          <div className="bg-white rounded-3xl p-8 border border-indigo-100 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 ml-4">Recent Transactions</h2>
              </div>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-4">Loading...</div>
              ) : recentTransactions.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No recent transactions</div>
              ) : (
                displayedTransactions.map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg ${
                        transaction.credits > 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.credits > 0 ? (
                          <PlusCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <MinusCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-800">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString('it-IT')}
                        </p>
                      </div>
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
            
            {recentTransactions.length > 3 && (
              <div className="mt-6">
                <Button 
                  onClick={() => setIsTransactionsExpanded(!isTransactionsExpanded)}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-xl py-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px]"
                >
                  {isTransactionsExpanded ? 'Show Less' : `Show More (${recentTransactions.length - 3})`}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isSliderOpen && (
        <CreditPurchaseSlider 
          open={isSliderOpen} 
          onClose={() => setIsSliderOpen(false)} 
        />
      )}
    </div>
  );
}