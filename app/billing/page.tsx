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
  PencilRuler,
  MessageSquare,
  Coins
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
  const { credits, freeScrapingRemaining, freeScrapingUsed, recentTransactions, isLoading } = useWallet();
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const [isTransactionsExpanded, setIsTransactionsExpanded] = useState(false);
  const [activeCard, setActiveCard] = useState<CardType>(null);

  // Calcola la percentuale di crediti gratuiti utilizzati
  const totalFreeCredits = freeScrapingRemaining + freeScrapingUsed;
  const freeCreditsPercentage = totalFreeCredits > 0 
    ? Math.round((freeScrapingRemaining / totalFreeCredits) * 100) 
    : 0;

  const displayedTransactions = isTransactionsExpanded 
    ? recentTransactions 
    : recentTransactions.slice(0, 3);

  const creditUsageItems = [
    { icon: Download, label: "Download Review", cost: "0.1" },
    { icon: Rocket, label: "Generate Response", cost: "2" },
    { icon: PencilRuler, label: "Edit Response", cost: "1" },
    { icon: FileSpreadsheet, label: "Analysis Report", cost: "10-30" },
    { icon: MessageSquare, label: "WhatsApp Inbound", cost: "0.5" },
    { icon: MessageSquare, label: "WhatsApp Outbound", cost: "0.5" },
    { icon: Clock, label: "WhatsApp Scheduled", cost: "1" }
  ];

  return (
    <div className="flex flex-col px-10 md:pl-[96px] py-12 min-h-screen">
      {/* Modern gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#FAFAFB] via-[#F0F0F2] to-[#FAFAFB] backdrop-blur-sm" />
      
      <div className="max-w-[1400px] mx-auto w-full space-y-12">
        {/* Header aligned to the left */}
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue-600 to-blue-400" />
            <h1 className="text-3xl sm:text-4xl font-semibold bg-gradient-to-b from-blue-800 to-blue-600 bg-clip-text text-transparent">
              Billing
            </h1>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <p className="text-base">
              Manage your credits and usage
            </p>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
              {credits.toFixed(1)} Credits Available
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Credits Card */}
          <div 
            className="group relative overflow-hidden bg-white rounded-3xl p-8 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
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

              {/* Paid Credits Display */}
              <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-600">Paid Credits</span>
                <span className="text-primary font-medium flex items-center">
                  <Wallet className="w-4 h-4 mr-2" />
                  {isLoading ? "..." : credits.toFixed(1)}
                </span>
              </div>

              {/* Free Credits Display with Progress Bar */}
              {freeScrapingRemaining > 0 && (
                <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700 font-medium">Free Credits Remaining</span>
                    <span className="text-blue-600 font-medium flex items-center">
                      <Coins className="w-4 h-4 mr-2" />
                      {isLoading ? "..." : freeScrapingRemaining} / {totalFreeCredits}
                    </span>
                  </div>
                  <Progress value={freeCreditsPercentage} className="h-2 w-full overflow-hidden rounded-full bg-blue-100" />
                  <p className="text-xs text-gray-500 mt-2">
                    You have used {freeScrapingUsed} of your {totalFreeCredits} free credits
                  </p>
                </div>
              )}

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
            className="group relative overflow-hidden bg-white rounded-3xl p-8 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
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
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Recent Transactions</h2>
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="mb-4">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto" />
                </div>
                No recent transactions
              </div>
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
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                {isTransactionsExpanded ? 'Show Less' : `Show More (${recentTransactions.length - 3})`}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          )}
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