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
  if (credits >= 1000) return 0.10
  if (credits >= 100) return 0.15
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
    { credits: 100, label: "Basic" },
    { credits: 1000, label: "Pro" },
    { credits: 2000, label: "Enterprise" },
  ]

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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                        <div className="text-sm text-green-600 font-medium">
                          Save €{savings.toFixed(2)}
                        </div>
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
                    <div className="text-sm text-green-600 font-medium">
                      Save €{calculateSavings(credits).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
              <Slider
                value={[credits]}
                onValueChange={(value) => setCredits(value[0])}
                min={5}
                max={5000}
                step={5}
                className="w-full"
              />
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
                      amount={credits * 100}
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