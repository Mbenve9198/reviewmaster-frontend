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

  const handlePaymentClick = async () => {
    try {
      await createPaymentIntent(credits)
    } catch (error) {
      console.error('Error creating payment intent:', error)
    }
  }

  const creditOptions = [
    { credits: 50, label: "Starter" },
    { credits: 500, label: "Manager" },
    { credits: 10000, label: "Director" },
  ]

  const possibleActivities = calculatePossibleActivities(credits)

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Acquista Crediti</SheetTitle>
          <SheetDescription>
            Seleziona la quantità di crediti da acquistare
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8">
          {/* Slider e informazioni sui crediti */}
          <div className="space-y-4">
            <Slider
              value={[credits]}
              onValueChange={([value]) => setCredits(value)}
              min={34}
              max={10000}
              step={1}
              className="w-full"
            />
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Crediti selezionati</p>
                <p className="text-2xl font-bold">{credits}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-muted-foreground">Prezzo per credito</p>
                <p className="text-2xl font-bold">€{calculatePricePerCredit(credits).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Riquadro del totale e pulsante di pagamento */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Totale da pagare</p>
                <p className="text-3xl font-bold">€{calculateTotalPrice(credits).toFixed(2)}</p>
              </div>
              {calculateSavings(credits) > 0 && (
                <div className="text-right">
                  <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-md">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Risparmi €{calculateSavings(credits).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {!clientSecret ? (
              <Button
                onClick={handlePaymentClick}
                disabled={isLoading}
                className="w-full h-12 text-base font-medium"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creazione pagamento...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Procedi al pagamento
                  </>
                )}
              </Button>
            ) : (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm
                  clientSecret={clientSecret}
                  amount={calculateTotalPrice(credits)}
                  onSuccess={handleSuccess}
                  onError={handleError}
                  onReady={handleStripeReady}
                />
              </Elements>
            )}
          </div>

          {/* Informazioni aggiuntive */}
          <div className="text-sm text-muted-foreground">
            <p>
              I crediti verranno aggiunti immediatamente al tuo account dopo il pagamento.
              Pagamento sicuro tramite Stripe.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default CreditPurchaseSlider