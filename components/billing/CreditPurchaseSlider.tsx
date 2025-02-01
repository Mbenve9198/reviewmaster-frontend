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

const CreditPurchaseSlider = ({ open, onClose }: CreditPurchaseSliderProps) => {
  const [credits, setCredits] = useState<number>(100)
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

  const createPaymentIntent = async (amount: number) => {
    try {
      setIsLoading(true)
      const token = getCookie('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: amount * 100 }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create payment intent')
      }
      
      const data = await response.json()
      setClientSecret(data.clientSecret)
    } catch (error) {
      toast.error('Failed to initialize payment')
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
    { credits: 100, price: 10 },
    { credits: 500, price: 45 },
    { credits: 1000, price: 80 },
    { credits: 2000, price: 150 },
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
              {creditOptions.map((option) => (
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
                    <div className="text-2xl font-bold text-primary">
                      {option.credits}
                    </div>
                    <div className="text-sm text-gray-500">
                      credits
                    </div>
                    <div className="text-lg font-semibold">
                      €{option.price}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm font-medium">
                <span>Custom Amount</span>
                <span className="text-primary">{credits} credits</span>
              </div>
              <Slider
                value={[credits]}
                onValueChange={(value) => setCredits(value[0])}
                min={10}
                max={5000}
                step={10}
                className="w-full"
              />
              <div className="text-sm text-gray-500 text-center">
                €{(credits * 0.1).toFixed(2)}
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