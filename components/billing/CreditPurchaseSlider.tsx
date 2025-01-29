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
  const [isProcessing, setIsProcessing] = useState(false)
  const [isStripeLoading, setIsStripeLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState<string>('')
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const { refresh } = useWallet()

  const calculatePricePerCredit = (amount: number) => {
    if (amount < 200) return 0.30
    if (amount < 1000) return 0.24
    return 0.20
  }

  const pricePerCredit = calculatePricePerCredit(credits)
  const totalPrice = credits * pricePerCredit
  const basePrice = credits * 0.30
  const savings = basePrice - totalPrice

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const calculatePotentialActions = (credits: number) => {
    return {
      reviews: Math.floor(credits / 0.1),
      responses: Math.floor(credits / 2),
      analysis: Math.floor(credits / 10)
    }
  }

  const handleStartPurchase = async () => {
    try {
      setIsLoading(true)
      setIsProcessing(true)
      const token = getCookie('token')
      
      if (!token) {
        toast.error('Session expired. Please login again.')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallet/payment-intent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          credits,
          amount: Math.round(totalPrice * 100)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create payment intent')
      }

      const { clientSecret } = await response.json()
      setClientSecret(clientSecret)
      setIsStripeLoading(true)
      setShowPaymentForm(true)
    } catch (error) {
      console.error('Purchase setup error:', error)
      toast.error('Failed to initialize payment. Please try again.')
    } finally {
      setIsLoading(false)
      setIsProcessing(false)
    }
  }

  const handlePaymentSuccess = () => {
    toast.success('Credits purchased successfully!')
    refresh()
    setShowPaymentForm(false)
    setClientSecret('')
    setCredits(100)
    setIsProcessing(false)
    setIsStripeLoading(false)
    onClose()
  }

  const handlePaymentError = (error: string) => {
    toast.error(error || 'Payment failed. Please try again.')
    setShowPaymentForm(false)
    setClientSecret('')
    setIsLoading(false)
    setIsProcessing(false)
    setIsStripeLoading(false)
  }

  const potentialActions = calculatePotentialActions(credits)

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#3b82f6',
      colorBackground: '#ffffff',
      borderRadius: '0.5rem'
    }
  }

  return (
    <Sheet 
      open={open} 
      onOpenChange={(isOpen) => {
        if (isProcessing || isStripeLoading) {
          toast.warning('Please wait...')
          return
        }
        if (!isOpen) {
          setShowPaymentForm(false)
          setClientSecret('')
          setCredits(100)
          setIsLoading(false)
          setIsProcessing(false)
          setIsStripeLoading(false)
        }
        onClose()
      }}
    >
      <SheetContent className="bg-white w-full sm:max-w-[540px] h-full overflow-y-auto p-0">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="h-full flex flex-col p-6"
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-shrink-0"
          >
            <SheetHeader className="mb-6">
              <SheetTitle>Purchase Credits</SheetTitle>
              <SheetDescription>
                Add credits to your wallet to continue using our services
              </SheetDescription>
            </SheetHeader>
          </motion.div>

          <div className="flex-1 overflow-y-auto space-y-6 relative">
            <AnimatePresence mode="wait">
              <motion.div 
                key={showPaymentForm ? 'payment' : 'credits'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="space-y-8"
              >
                {!showPaymentForm ? (
                  <>
                    {/* Credits Slider */}
                    <motion.div 
                      className="space-y-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex justify-between items-baseline">
                        <label className="text-sm font-medium">Credits Amount</label>
                        <span className="text-2xl font-bold text-primary">{credits}</span>
                      </div>
                      <Slider
                        defaultValue={[100]}
                        min={34}
                        max={5000}
                        step={1}
                        value={[credits]}
                        onValueChange={([value]) => setCredits(value)}
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>34</span>
                        <span>5000</span>
                      </div>
                    </motion.div>

                    {/* Pricing Info Cards */}
                    <motion.div 
                      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <motion.div 
                        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10
                        hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1
                        border border-primary/10 backdrop-blur-sm"
                        whileHover={{ scale: 1.02 }}
                        initial={{ rotateX: 10 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="p-6 relative z-10">
                          <div className="text-sm font-medium mb-1 text-primary/70">Price per Credit</div>
                          <div className="text-2xl font-bold text-primary">{formatPrice(pricePerCredit)}</div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/5 to-primary/10 opacity-0 
                          group-hover:opacity-100 transition-opacity duration-300" />
                      </motion.div>

                      <motion.div 
                        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10
                        hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1
                        border border-primary/10 backdrop-blur-sm"
                        whileHover={{ scale: 1.02 }}
                        initial={{ rotateX: 10 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="p-6 relative z-10">
                          <div className="text-sm font-medium mb-1 text-primary/70">Total Price</div>
                          <div className="text-2xl font-bold text-primary">{formatPrice(totalPrice)}</div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/5 to-primary/10 opacity-0 
                          group-hover:opacity-100 transition-opacity duration-300" />
                      </motion.div>

                      <motion.div 
                        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-green-100/50
                        hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1
                        border border-green-200/20 backdrop-blur-sm"
                        whileHover={{ scale: 1.02 }}
                        initial={{ rotateX: 10 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="p-6 relative z-10">
                          <div className="text-sm font-medium mb-1 text-green-600/70">You Save</div>
                          <div className="text-2xl font-bold text-green-600">{formatPrice(savings)}</div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-green-100/20 to-green-100/30 opacity-0 
                          group-hover:opacity-100 transition-opacity duration-300" />
                      </motion.div>
                    </motion.div>

                    {/* What You Can Do Card */}
                    <motion.div 
                      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10
                      hover:shadow-lg transition-all duration-300
                      border border-primary/10 backdrop-blur-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="p-6 relative z-10">
                        <h3 className="font-medium mb-4 text-primary/70">With {credits} credits you can:</h3>
                        <ul className="space-y-3">
                          <li className="flex justify-between items-center">
                            <span className="text-primary/60">Download reviews</span>
                            <span className="font-medium text-primary">{potentialActions.reviews.toLocaleString()}</span>
                          </li>
                          <li className="flex justify-between items-center">
                            <span className="text-primary/60">Generate AI responses</span>
                            <span className="font-medium text-primary">{potentialActions.responses.toLocaleString()}</span>
                          </li>
                          <li className="flex justify-between items-center">
                            <span className="text-primary/60">Run analysis reports</span>
                            <span className="font-medium text-primary">{potentialActions.analysis.toLocaleString()}</span>
                          </li>
                        </ul>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/5 to-primary/10 opacity-0 
                        group-hover:opacity-100 transition-opacity duration-300" />
                    </motion.div>

                    {/* Purchase Button */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="flex justify-center"
                    >
                      <Button
                        onClick={handleStartPurchase}
                        disabled={isLoading || isProcessing}
                        className="bg-primary hover:bg-primary/90 text-white font-medium 
                        px-8 py-2 rounded-xl shadow-lg transform transition-all duration-200
                        hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0
                        inline-flex items-center gap-2 w-auto min-w-[200px]"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4" />
                            Purchase {formatPrice(totalPrice)}
                          </>
                        )}
                      </Button>
                    </motion.div>

                    {/* Special Offer */}
                    {credits >= 1000 && (
                      <div className="flex items-center justify-center text-sm text-green-600">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Best value: {formatPrice(0.30 - pricePerCredit)} savings per credit!
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-2">Payment Details</h3>
                      <p className="text-sm text-muted-foreground">
                        You are purchasing {credits} credits for {formatPrice(totalPrice)}
                      </p>
                    </div>
                    
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
                      <PaymentForm
                        clientSecret={clientSecret}
                        amount={Math.round(totalPrice * 100)}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                        onReady={() => setIsStripeLoading(false)}
                      />
                    </Elements>

                    <Button
                      variant="ghost"
                      onClick={() => setShowPaymentForm(false)}
                      className="w-full mt-4"
                    >
                      Back to Credit Selection
                    </Button>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Loading overlay */}
            {isStripeLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/80 flex items-center justify-center"
              >
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Loading payment form...
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </SheetContent>
    </Sheet>
  )
}

export default CreditPurchaseSlider