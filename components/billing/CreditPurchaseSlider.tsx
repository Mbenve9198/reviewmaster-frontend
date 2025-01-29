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
      <SheetContent className="bg-white w-full sm:max-w-[540px] h-full overflow-y-auto">
        <div className="h-full flex flex-col">
          <SheetHeader className="mb-6 flex-shrink-0">
            <SheetTitle>Purchase Credits</SheetTitle>
            <SheetDescription>
              Add credits to your wallet to continue using our services
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto space-y-6 relative">
            <div className="space-y-8">
              {!showPaymentForm ? (
                <>
                  {/* Credits Slider */}
                  <div className="space-y-4">
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
                  </div>

                  {/* Pricing Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-primary/5 p-4 rounded-lg">
                      <div className="text-sm font-medium mb-1">Price per Credit</div>
                      <div className="text-2xl font-bold">{formatPrice(pricePerCredit)}</div>
                    </div>
                    <div className="bg-primary/5 p-4 rounded-lg">
                      <div className="text-sm font-medium mb-1">Total Price</div>
                      <div className="text-2xl font-bold">{formatPrice(totalPrice)}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm font-medium mb-1">You Save</div>
                      <div className="text-2xl font-bold text-green-600">{formatPrice(savings)}</div>
                    </div>
                  </div>

                  {/* What You Can Do */}
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h3 className="font-medium mb-3">With {credits} credits you can:</h3>
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span>Download reviews</span>
                        <span className="font-medium">{potentialActions.reviews.toLocaleString()}</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Generate AI responses</span>
                        <span className="font-medium">{potentialActions.responses.toLocaleString()}</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Run analysis reports</span>
                        <span className="font-medium">{potentialActions.analysis.toLocaleString()}</span>
                      </li>
                    </ul>
                  </div>

                  {/* Continue to Payment Button */}
                  <Button
                    onClick={handleStartPurchase}
                    disabled={isLoading}
                    className="w-full rounded-xl bg-primary text-white shadow-[0_4px_0_0_rgb(0,0,0,0.25)] active:translate-y-0.5 active:shadow-[0_2px_0_0_rgb(0,0,0,0.25)]
                    hover:opacity-90 transition-all"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Purchase ${credits} credits for ${formatPrice(totalPrice)}`
                    )}
                  </Button>

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
            </div>

            {isStripeLoading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Loading payment form...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default CreditPurchaseSlider