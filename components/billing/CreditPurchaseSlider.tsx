import { useState, useEffect } from 'react'
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Loader2, CreditCard, Sparkles } from 'lucide-react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { getCookie } from '@/lib/utils'
import { toast } from 'sonner'
import PaymentForm from './PaymentForm'
import { useWallet } from '@/hooks/useWallet'
import { motion, AnimatePresence } from 'framer-motion'

interface CreditPurchaseSliderProps {
  open: boolean
  onClose: () => void
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const calculatePricePerCredit = (credits: number) => {
  if (credits >= 10000) return 0.10
  if (credits >= 500) return 0.15
  return 0.30
}

const calculateTotalPrice = (credits: number) => {
  return credits * calculatePricePerCredit(credits)
}

const calculateSavings = (credits: number) => {
  const regularPrice = credits * 0.30 // prezzo senza sconti
  const actualPrice = calculateTotalPrice(credits)
  return regularPrice - actualPrice
}

const ACTIVITY_COSTS = {
  aiResponse: 2,      // generate ai response for review
  editResponse: 1,    // edit response generated
  importReview: 0.1,  // import reviews from google, booking, trip
  createAnalysis: 10, // create analysis with AI
  askAnalysis: 1,     // ask ai about analysis
}

const calculatePossibleActivities = (credits: number) => {
  return {
    aiResponses: Math.floor(credits / ACTIVITY_COSTS.aiResponse),
    editResponses: Math.floor(credits / ACTIVITY_COSTS.editResponse),
    importReviews: Math.floor(credits / ACTIVITY_COSTS.importReview),
    createAnalyses: Math.floor(credits / ACTIVITY_COSTS.createAnalysis),
    askAnalyses: Math.floor(credits / ACTIVITY_COSTS.askAnalysis),
  }
}

const CreditPurchaseSlider = ({ open, onClose }: CreditPurchaseSliderProps) => {
  const [credits, setCredits] = useState<number>(1000)
  const [isLoading, setIsLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState<string>("")
  const [isStripeLoading, setIsStripeLoading] = useState(true)
  const { refresh } = useWallet()

  const handleSuccess = async () => {
    await refresh()
    onClose()
    toast.success('Payment successful! Credits added to your account.')
  }

  const handleError = (error: string) => {
    toast.error(error)
  }

  const handleStripeReady = () => {
    setIsStripeLoading(false)
  }

  const createPaymentIntent = async (credits: number) => {
    try {
      setIsLoading(true)
      const token = getCookie('token')
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallet/payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ credits })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Payment intent error:', errorData)
        throw new Error(errorData.message || 'Failed to create payment intent')
      }
      
      const data = await response.json()
      
      if (!data.clientSecret) {
        throw new Error('No client secret received')
      }

      setClientSecret(data.clientSecret)
    } catch (error) {
      console.error('Create payment intent error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to initialize payment')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open && credits > 0) {
      createPaymentIntent(credits)
    }
  }, [credits, open])

  const creditOptions = [
    { credits: 50, label: "Starter" },
    { credits: 500, label: "Manager" },
    { credits: 10000, label: "Director" },
  ]

  const possibleActivities = calculatePossibleActivities(credits)

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-[600px] overflow-y-auto bg-white">
        <div className="space-y-8 bg-white">
          <SheetHeader className="bg-white">
            <SheetTitle className="text-3xl font-bold flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-primary" />
              Purchase Credits
            </SheetTitle>
            <SheetDescription className="text-lg">
              Choose the amount of credits you want to purchase
            </SheetDescription>
          </SheetHeader>

          <motion.div 
            className="space-y-8 bg-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {creditOptions.map((option) => {
                const price = calculateTotalPrice(option.credits)
                const pricePerCredit = calculatePricePerCredit(option.credits)
                const savings = calculateSavings(option.credits)
                
                return (
                  <button
                    key={option.credits}
                    onClick={() => setCredits(option.credits)}
                    className={`group relative overflow-hidden bg-white rounded-2xl p-6 border-2 transition-all duration-200 hover:scale-[1.02] ${
                      credits === option.credits 
                        ? 'border-primary shadow-lg' 
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-bl-full transform transition-transform duration-300 group-hover:scale-110" />
                    <div className="relative space-y-2">
                      <div className="text-sm font-medium text-gray-500">
                        {option.label}
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {option.credits}
                      </div>
                      <div className="text-sm text-gray-500">
                        credits
                      </div>
                      <div className="text-lg font-semibold">
                        €{price.toFixed(2)}
                      </div>
                      <div className="text-sm text-green-600">
                        €{pricePerCredit.toFixed(2)}/credit
                      </div>
                      {savings > 0 && (
                        <>
                          <div className="absolute -top-3 -right-2 rotate-6 z-10">
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-4 bg-gradient-to-b from-gray-100/80 to-gray-200/60 rounded-sm transform -rotate-6" />
                            <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1 rounded-lg shadow-md">
                              <span className="text-sm font-bold whitespace-nowrap">
                                Save €{savings.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Custom Amount</span>
                <div className="text-right">
                  <div className="text-primary font-semibold">
                    {credits} credits
                  </div>
                  <div className="text-sm text-gray-500">
                    €{calculateTotalPrice(credits).toFixed(2)} total
                  </div>
                  <div className="text-sm text-green-600">
                    €{calculatePricePerCredit(credits).toFixed(2)}/credit
                  </div>
                  {calculateSavings(credits) > 0 && (
                    <div className="relative inline-block">
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-4 bg-gradient-to-b from-gray-100/80 to-gray-200/60 rounded-sm transform -rotate-6" />
                      <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg shadow-md rotate-6">
                        <span className="text-sm font-bold">
                          Save €{calculateSavings(credits).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Slider
                value={[credits]}
                onValueChange={(value) => setCredits(value[0])}
                min={50}
                max={50000}
                step={50}
                className="w-full"
              />
            </div>

            <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                What you can do with {credits} credits:
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Generate AI responses</span>
                  <span className="font-semibold text-primary">
                    {possibleActivities.aiResponses.toLocaleString()} reviews
                    <span className="text-gray-400 text-sm ml-2">
                      (2 credits each)
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Edit generated responses</span>
                  <span className="font-semibold text-primary">
                    {possibleActivities.editResponses.toLocaleString()} edits
                    <span className="text-gray-400 text-sm ml-2">
                      (1 credit each)
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Import reviews</span>
                  <span className="font-semibold text-primary">
                    {possibleActivities.importReviews.toLocaleString()} reviews
                    <span className="text-gray-400 text-sm ml-2">
                      (0.1 credits each)
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Create AI analyses</span>
                  <span className="font-semibold text-primary">
                    {possibleActivities.createAnalyses.toLocaleString()} analyses
                    <span className="text-gray-400 text-sm ml-2">
                      (10 credits each)
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Ask about analyses</span>
                  <span className="font-semibold text-primary">
                    {possibleActivities.askAnalyses.toLocaleString()} questions
                    <span className="text-gray-400 text-sm ml-2">
                      (1 credit each)
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {clientSecret ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="relative"
              >
                <div className="group relative overflow-hidden bg-white rounded-2xl p-6 border-2 border-gray-200">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded-bl-full" />
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <PaymentForm
                      clientSecret={clientSecret}
                      amount={calculateTotalPrice(credits) * 100}
                      onSuccess={handleSuccess}
                      onError={handleError}
                      onReady={handleStripeReady}
                    />
                  </Elements>
                </div>
              </motion.div>
            ) : (
              <div className="flex items-center justify-center p-12">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Initializing payment...
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default CreditPurchaseSlider