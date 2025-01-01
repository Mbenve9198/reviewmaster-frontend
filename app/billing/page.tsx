"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CreditCard } from 'lucide-react'
import { useUserStats } from "@/hooks/useUserStats"
import { useRouter } from 'next/navigation'
import { useUser } from "@/hooks/use-user"

export default function BillingPage() {
  const { 
    responsesUsed, 
    responsesLimit, 
    hotelsCount, 
    hotelsLimit,
    subscriptionPlan,
    isLoading 
  } = useUserStats()
  const router = useRouter()
  const { user } = useUser()

  const handleManagePlan = async () => {
    if (subscriptionPlan === 'trial') {
      router.push('/billing/plans');
    } else {
      try {
        const response = await fetch('/api/users/create-portal-session', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to create portal session');
        }
        
        const { url } = await response.json();
        window.location.href = url;
      } catch (error) {
        console.error('Error opening customer portal:', error);
      }
    }
  };

  const getButtonText = () => {
    if (isLoading) return "...";
    return subscriptionPlan === 'trial' ? 'Upgrade Your Plan' : 'Manage Plan';
  }

  return (
    <div className="min-h-screen bg-white py-12">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Billing & Subscription</h1>
        <p className="text-xl text-gray-600">Manage your plan and usage</p>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        {/* Current Plan Section */}
        <div className="bg-white border-2 border-gray-200 rounded-3xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <CreditCard className="w-8 h-8 text-primary mr-4" />
              <h2 className="text-2xl font-bold text-gray-800">Current Plan</h2>
            </div>
            <span className="text-3xl font-bold text-primary capitalize">
              {isLoading ? "..." : subscriptionPlan}
            </span>
          </div>
          <p className="text-gray-600 mb-6">
            You are currently on the {isLoading ? "..." : subscriptionPlan} plan. 
            {subscriptionPlan === 'trial' 
              ? ' Upgrade now to access more features and benefits.'
              : ' Manage your subscription and billing information.'}
          </p>
          <Button
            onClick={handleManagePlan}
            className={`w-full ${
              subscriptionPlan === 'trial' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-primary hover:bg-primary/90'
            } text-white font-bold text-xl py-6 rounded-xl transition-all shadow-[0_4px_0_0_#1d4ed8]`}
          >
            {getButtonText()}
          </Button>
        </div>

        {/* Usage Section */}
        <div className="bg-white border-2 border-gray-200 rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Usage</h2>
          
          {/* Responses Counter */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <CreditCard className="w-6 h-6 text-primary mr-2" />
                <span className="text-lg font-medium text-gray-700">Responses Generated</span>
              </div>
              <span className="text-lg font-medium text-primary">
                {isLoading ? "..." : `${responsesLimit - responsesUsed}/${responsesLimit}`}
              </span>
            </div>
            <Progress 
              value={isLoading ? 0 : ((responsesLimit - responsesUsed) / responsesLimit) * 100} 
              className="h-3 bg-primary/20"
            />
          </div>

          {/* Hotels Counter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <CreditCard className="w-6 h-6 text-primary mr-2" />
                <span className="text-lg font-medium text-gray-700">Hotels Connected</span>
              </div>
              <span className="text-lg font-medium text-primary">
                {isLoading ? "..." : `${hotelsCount}/${hotelsLimit}`}
              </span>
            </div>
            <Progress 
              value={isLoading ? 0 : (hotelsCount / hotelsLimit) * 100} 
              className="h-3 bg-primary/20"
            />
          </div>
        </div>

        {/* Plan Benefits */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Plan Benefits</h2>
          <ul className="space-y-4">
            <li className="flex items-center">
              <span className="text-2xl mr-4">💬</span>
              <span className="text-gray-700">
                Up to {isLoading ? "..." : responsesLimit} AI-generated responses per month
              </span>
            </li>
            <li className="flex items-center">
              <span className="text-2xl mr-4">🏨</span>
              <span className="text-gray-700">
                Connect up to {isLoading ? "..." : hotelsLimit} hotels
              </span>
            </li>
            <li className="flex items-center">
              <span className="text-2xl mr-4">🎖️</span>
              <span className="text-gray-700">Priority customer support</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
