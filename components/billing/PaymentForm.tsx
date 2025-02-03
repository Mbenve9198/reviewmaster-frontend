// components/billing/PaymentForm.tsx
import { useState, useEffect } from 'react'
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { XCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  onReady?: () => void;
}

const PaymentForm = ({ clientSecret, amount, onSuccess, onError, onReady }: PaymentFormProps) => {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (elements) {
      onReady?.()
    }
  }, [elements, onReady])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required'
      })

      if (error) {
        // Gestione specifica degli errori di Stripe
        let message = 'Payment failed. Please try again.'
        
        switch (error.type) {
          case 'card_error':
            message = error.message || 'Your card was declined.'
            break
          case 'validation_error':
            message = 'Please check your card details.'
            break
          default:
            message = error.message || 'An unexpected error occurred.'
        }
        
        setErrorMessage(message)
        onError(message)
        toast.error(message)
        return
      }

      if (!paymentIntent) {
        throw new Error('Payment failed. Please try again.')
      }

      switch(paymentIntent.status) {
        case 'succeeded':
          onSuccess()
          toast.success('Payment successful!')
          break
        case 'requires_payment_method':
          const msg = 'Your payment was not successful, please try again.'
          setErrorMessage(msg)
          onError(msg)
          toast.error(msg)
          break
        case 'requires_action':
          setErrorMessage('Please complete the authentication.')
          break
        default:
          const errorMsg = 'Something went wrong with your payment.'
          setErrorMessage(errorMsg)
          onError(errorMsg)
          toast.error(errorMsg)
          break
      }
    } catch (e) {
      const errorMsg = 'An unexpected error occurred. Please try again.'
      setErrorMessage(errorMsg)
      onError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement options={{
        layout: 'tabs',
        paymentMethodOrder: ['card', 'paypal', 'sepa_debit'],
      }} />
      
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          <p className="flex items-center">
            <XCircle className="h-4 w-4 mr-2" />
            {errorMessage}
          </p>
        </div>
      )}

      <div className="flex justify-center">
        <Button
          type="submit"
          disabled={!stripe || isLoading}
          className="rounded-xl bg-primary hover:opacity-90 text-white shadow-[0_4px_0_0_rgb(29,78,216)] 
          active:translate-y-0.5 active:shadow-[0_2px_0_0_rgb(29,78,216)] transition-all px-8"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ${new Intl.NumberFormat('it-IT', {
              style: 'currency',
              currency: 'EUR'
            }).format(amount)}`
          )}
        </Button>
      </div>
    </form>
  )
}

export default PaymentForm