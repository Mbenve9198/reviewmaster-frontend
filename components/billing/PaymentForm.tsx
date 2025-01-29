// components/billing/PaymentForm.tsx
import { useState } from 'react'
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const PaymentForm = ({ clientSecret, amount, onSuccess, onError }: PaymentFormProps) => {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
        onError(error.message || 'Payment failed')
        return
      }

      switch(paymentIntent.status) {
        case 'succeeded':
          onSuccess()
          break
        case 'requires_payment_method':
          onError('Your payment was not successful, please try again.')
          break
        case 'requires_action':
          onError('Please complete the authentication.')
          break
        default:
          onError('Something went wrong.')
          break
      }
    } catch (e) {
      onError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement 
        options={{
          layout: 'tabs',
          defaultValues: {
            billingDetails: {
              name: '',
              email: '',
            }
          },
          business: {
            name: 'Replai'
          }
        }} 
      />
      <Button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay €${(amount / 100).toFixed(2)}`
        )}
      </Button>
    </form>
  )
}

export default PaymentForm