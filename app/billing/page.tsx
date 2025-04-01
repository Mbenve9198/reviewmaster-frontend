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
  Coins,
  CreditCard,
  ExternalLink,
  Settings,
  Receipt,
  Building2,
  MapPin,
  Edit
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from "@/hooks/use-user";
import { useWallet } from "@/hooks/useWallet";
import { getCookie } from "@/lib/utils";
import CreditPurchaseSlider from "@/components/billing/CreditPurchaseSlider";
import { EditCreditSettingsModal } from "@/components/whatsapp-assistant/edit-credit-settings-modal";
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";
import { Tiles } from "@/components/ui/tiles";
import Image from "next/image"
import { BillingAddressModal, BillingAddress } from "@/components/billing/BillingAddressModal";

type CardType = 'credits' | 'usage' | 'billing' | null;

export default function BillingPage() {
  const router = useRouter();
  const { user } = useUser();
  const { credits, freeScrapingRemaining, freeScrapingUsed, recentTransactions, failedTransactions, isLoading, refresh } = useWallet();
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const [isTransactionsExpanded, setIsTransactionsExpanded] = useState(false);
  const [activeCard, setActiveCard] = useState<CardType>(null);
  const [isStripeLoading, setIsStripeLoading] = useState(false);
  const [isCreditSettingsModalOpen, setIsCreditSettingsModalOpen] = useState(false);
  const [isBillingAddressModalOpen, setIsBillingAddressModalOpen] = useState(false);
  const [billingAddress, setBillingAddress] = useState<BillingAddress | null>(null);
  const [creditSettings, setCreditSettings] = useState({
    minimumThreshold: 50,
    topUpAmount: 200,
    autoTopUp: false
  });

  // Calcola la percentuale di crediti gratuiti utilizzati
  const totalFreeCredits = freeScrapingRemaining + freeScrapingUsed;
  const freeCreditsPercentage = totalFreeCredits > 0 
    ? Math.round((freeScrapingRemaining / totalFreeCredits) * 100) 
    : 0;

  const displayedTransactions = isTransactionsExpanded 
    ? recentTransactions 
    : recentTransactions.slice(0, 3);

  // Fetch credit settings
  useEffect(() => {
    const fetchCreditSettings = async () => {
      try {
        const token = getCookie('token');
        if (!token) return;
        
        // Use the same endpoint as WhatsApp Assistant
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallet/user`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Extract credit settings from user data
          if (data.creditSettings) {
            setCreditSettings({
              minimumThreshold: data.creditSettings.minimumThreshold || 50,
              topUpAmount: data.creditSettings.topUpAmount || 200,
              autoTopUp: data.creditSettings.autoTopUp || false
            });
          }
        }
      } catch (error) {
        console.error('Error fetching credit settings:', error);
      }
    };
    
    fetchCreditSettings();
  }, []);

  const handleCreditSettingsSuccess = async () => {
    // Refresh wallet data and credit settings
    await refresh();
    // Re-fetch credit settings to ensure UI is in sync
    const fetchCreditSettings = async () => {
      try {
        const token = getCookie('token');
        if (!token) return;
        
        // Use the same endpoint as WhatsApp Assistant
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallet/user`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Extract credit settings from user data
          if (data.creditSettings) {
            setCreditSettings({
              minimumThreshold: data.creditSettings.minimumThreshold || 50,
              topUpAmount: data.creditSettings.topUpAmount || 200,
              autoTopUp: data.creditSettings.autoTopUp || false
            });
          }
        }
      } catch (error) {
        console.error('Error fetching credit settings:', error);
      }
    };
    
    fetchCreditSettings();
  };

  // Fetch billing address
  useEffect(() => {
    const fetchBillingAddress = async () => {
      try {
        const token = getCookie('token');
        if (!token) return;
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallet/billing-address`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.billingAddress) {
            setBillingAddress(data.billingAddress);
          }
        }
      } catch (error) {
        console.error('Error fetching billing address:', error);
      }
    };
    
    fetchBillingAddress();
  }, []);

  const handleAddressUpdate = (address: BillingAddress) => {
    setBillingAddress(address);
    setIsBillingAddressModalOpen(false);
  };

  const creditUsageItems = [
    { icon: Download, label: "Download Review", cost: "0.1" },
    { icon: Rocket, label: "Generate Response", cost: "2" },
    { icon: PencilRuler, label: "Edit Response", cost: "1" },
    { icon: FileSpreadsheet, label: "Analysis Report", cost: "10-30" },
    { icon: MessageSquare, label: "WhatsApp Inbound", cost: "0.5" },
    { icon: MessageSquare, label: "WhatsApp Outbound", cost: "0.5" },
    { icon: Clock, label: "WhatsApp Scheduled", cost: "1" }
  ];

  // Funzione per gestire il redirect al portale clienti di Stripe
  const handleStripePortalRedirect = async () => {
    setIsStripeLoading(true);
    try {
      // Ottiene l'ID cliente Stripe dall'API
      const token = getCookie('token');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallet/stripe-customer`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const { stripeCustomerId } = await response.json();
        if (stripeCustomerId) {
          // Redirect al portale clienti Stripe con l'ID cliente come parametro
          window.open(`https://billing.stripe.com/p/login/eVadS9dD67fH4De288?prefilled_email=${encodeURIComponent(user?.email || '')}`, '_blank');
        } else {
          alert("You don't have a payment method set up yet. Please make a purchase first.");
        }
      } else {
        throw new Error('Failed to get Stripe customer ID');
      }
    } catch (error) {
      console.error('Error redirecting to Stripe portal:', error);
      alert('Could not access payment settings. Please try again later.');
    } finally {
      setIsStripeLoading(false);
    }
  };

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
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
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-xl py-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] mb-4"
              >
                Buy More Credits
                <Sparkles className="w-5 h-5" />
              </Button>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Stripe Customer Portal Button */}
                <Button
                  onClick={handleStripePortalRedirect}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                  disabled={isStripeLoading}
                >
                  {isStripeLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
                  ) : (
                    <>
                      Payment Methods
                      <CreditCard className="w-4 h-4" />
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </>
                  )}
                </Button>
                
                {/* Auto Top-up Settings Button */}
                <Button
                  onClick={() => setIsCreditSettingsModalOpen(true)}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Auto Top-up
                  {creditSettings.autoTopUp ? (
                    <div className="flex items-center ml-1">
                      <div className="h-2 w-2 bg-green-500 rounded-full mr-1"></div>
                      <span className="text-xs text-green-600">ON</span>
                    </div>
                  ) : (
                    <div className="flex items-center ml-1">
                      <div className="h-2 w-2 bg-gray-300 rounded-full mr-1"></div>
                      <span className="text-xs text-gray-500">OFF</span>
                    </div>
                  )}
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Auto Top-up Status Indicator (shown only if enabled) */}
              {creditSettings.autoTopUp && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-full mr-3">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700">
                        Auto Top-up Enabled
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Will add {creditSettings.topUpAmount} credits when balance falls below {creditSettings.minimumThreshold} credits
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Billing Address Card */}
          <div 
            className="group relative overflow-hidden bg-white rounded-3xl p-8 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            onMouseEnter={() => setActiveCard('billing')}
            onMouseLeave={() => setActiveCard(null)}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded-bl-full transform transition-transform duration-300 group-hover:scale-110" />
            
            <div className="relative">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <div className="p-3 bg-primary/10 rounded-xl mr-4">
                  <Receipt className="w-8 h-8 text-primary" />
                </div>
                Billing Address
              </h2>

              {billingAddress ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{billingAddress.name}</h3>
                      {billingAddress.company && (
                        <div className="flex items-center text-gray-600 mt-1">
                          <Building2 className="w-4 h-4 mr-2" />
                          <span>{billingAddress.company}</span>
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsBillingAddressModalOpen(true)}
                      className="flex items-center gap-1 rounded-xl hover:bg-gray-50 transition-all font-medium"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                  
                  {(billingAddress.vatId || billingAddress.taxId) && (
                    <div className="space-y-1 border-t pt-2">
                      {billingAddress.vatId && (
                        <p className="text-sm">
                          <span className="font-semibold">VAT Number:</span> {billingAddress.vatId}
                        </p>
                      )}
                      {billingAddress.taxId && (
                        <p className="text-sm">
                          <span className="font-semibold">Tax ID:</span> {billingAddress.taxId}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="space-y-2 mt-4 border-t pt-3">
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 text-primary mt-0.5 mr-2" />
                      <div>
                        <p>{billingAddress.address.line1}</p>
                        {billingAddress.address.line2 && <p>{billingAddress.address.line2}</p>}
                        <p>
                          {billingAddress.address.postalCode} {billingAddress.address.city}
                          {billingAddress.address.state && `, ${billingAddress.address.state}`}
                        </p>
                        <p>{billingAddress.address.country}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <MapPin className="w-16 h-16 text-primary/30 mb-4" />
                  <p className="text-lg text-gray-500 text-center mb-6">
                    No billing address configured
                  </p>
                  <Button 
                    onClick={() => setIsBillingAddressModalOpen(true)}
                    className="bg-primary hover:bg-primary/90 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                  >
                    Add Address
                  </Button>
                </div>
              )}
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
        
        {/* Failed Payments Card - Only shown if there are failed transactions */}
        {failedTransactions && failedTransactions.length > 0 && (
          <div className="bg-white rounded-3xl p-8 border border-red-200 shadow-lg hover:shadow-xl transition-all duration-300 mt-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-xl">
                  <CreditCard className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-800">Failed Recharges</h2>
              </div>
            </div>
            
            <div className="space-y-4">
              {failedTransactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors duration-200"
                >
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-red-100">
                      <CreditCard className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-800">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  </div>
                  <div className="font-bold text-red-600">
                    Failed: €{transaction.amount?.toFixed(2)}
                  </div>
                </div>
              ))}
              
              <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-red-100 mr-3">
                    <ExternalLink className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 mb-1">
                      <strong>Payment failed</strong> - Please update your payment method or try again
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        onClick={handleStripePortalRedirect}
                        disabled={isStripeLoading}
                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-xl text-sm flex items-center gap-1"
                      >
                        {isStripeLoading ? 'Loading...' : 'Update Payment Method'}
                        <CreditCard className="w-4 h-4 ml-1" />
                      </Button>
                      <Button 
                        onClick={() => setIsSliderOpen(true)}
                        className="bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-xl text-sm flex items-center gap-1"
                      >
                        Try Again
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isSliderOpen && (
        <CreditPurchaseSlider 
          open={isSliderOpen} 
          onClose={() => setIsSliderOpen(false)} 
          billingAddress={billingAddress}
        />
      )}
      
      <EditCreditSettingsModal 
        isOpen={isCreditSettingsModalOpen}
        onClose={() => setIsCreditSettingsModalOpen(false)}
        onSuccess={handleCreditSettingsSuccess}
        currentConfig={{
          hotelId: user?.id || '',
          creditSettings: creditSettings
        }}
        isUserAccount={true}
      />
      
      <BillingAddressModal
        isOpen={isBillingAddressModalOpen}
        onClose={() => setIsBillingAddressModalOpen(false)}
        billingAddress={billingAddress}
        onAddressUpdate={handleAddressUpdate}
      />
    </div>
  );
}