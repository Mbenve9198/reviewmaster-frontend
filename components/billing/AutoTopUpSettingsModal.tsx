"use client"

import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { getCookie } from '@/lib/utils'
import { toast } from 'sonner'
import { Loader2, CreditCard, Wallet, DollarSign, Info, Zap } from 'lucide-react'
import { useWallet } from '@/hooks/useWallet'

const autoTopUpSettingsSchema = z.object({
  minimumThreshold: z.coerce.number().min(10, 'Minimum threshold must be at least 10').max(1000, 'Minimum threshold must be at most 1000'),
  topUpAmount: z.coerce.number().min(50, 'Top-up amount must be at least 50').max(10000, 'Top-up amount must be at most 10000'),
  autoTopUp: z.boolean().default(false),
})

type AutoTopUpSettingsFormValues = z.infer<typeof autoTopUpSettingsSchema>

interface AutoTopUpSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => Promise<void>
  currentSettings?: {
    minimumThreshold?: number
    topUpAmount?: number
    autoTopUp?: boolean
  }
}

// Function to calculate price per credit based on amount
const calculatePricePerCredit = (credits: number) => {
  if (credits >= 10000) return 0.10;
  if (credits >= 500) return 0.15;
  return 0.30;
};

// Function to calculate total price
const calculateTotalPrice = (credits: number) => {
  return credits * calculatePricePerCredit(credits);
};

export function AutoTopUpSettingsModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  currentSettings = {
    minimumThreshold: 50,
    topUpAmount: 200,
    autoTopUp: false
  }
}: AutoTopUpSettingsModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [topUpAmountEUR, setTopUpAmountEUR] = useState(0)
  const [thresholdReachedEUR, setThresholdReachedEUR] = useState(0)
  const { refresh } = useWallet()

  const form = useForm<AutoTopUpSettingsFormValues>({
    resolver: zodResolver(autoTopUpSettingsSchema),
    defaultValues: {
      minimumThreshold: currentSettings.minimumThreshold || 50,
      topUpAmount: currentSettings.topUpAmount || 200,
      autoTopUp: currentSettings.autoTopUp || false,
    },
  })

  // Recalculate EUR amounts when credit values change
  useEffect(() => {
    const topUpAmount = form.watch('topUpAmount');
    const minimumThreshold = form.watch('minimumThreshold');
    
    setTopUpAmountEUR(calculateTotalPrice(topUpAmount));
    setThresholdReachedEUR(calculateTotalPrice(minimumThreshold));
  }, [form.watch('topUpAmount'), form.watch('minimumThreshold')]);

  const onSubmit = async (data: AutoTopUpSettingsFormValues) => {
    try {
      setIsLoading(true)
      const token = getCookie('token')
      
      if (!token) {
        toast.error('Session expired. Please login again.')
        return
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallet/auto-top-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          minimumThreshold: data.minimumThreshold,
          topUpAmount: data.topUpAmount,
          autoTopUp: data.autoTopUp
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update auto top-up settings')
      }
      
      await refresh()
      await onSuccess()
      toast.success('Auto top-up settings updated successfully')
      onClose()
    } catch (error) {
      console.error('Error updating auto top-up settings:', error)
      toast.error('Failed to update auto top-up settings')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[500px] p-0 bg-white rounded-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Zap className="h-5 w-5 text-blue-500" />
              </div>
              <DialogTitle className="text-lg font-semibold">
                Auto Top-up Settings
              </DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              Configure your auto top-up settings to automatically recharge your credits when they fall below a specified threshold
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="px-6 py-6 space-y-6">
              <FormField
                control={form.control}
                name="minimumThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Minimum Credit Threshold</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="number" 
                          placeholder="50" 
                          className="rounded-xl h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-12"
                          {...field} 
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                          credits
                        </div>
                      </div>
                    </FormControl>
                    <div className="flex justify-between items-center mt-1.5">
                      <FormDescription className="text-xs text-gray-500">
                        Auto top-up will trigger when credits drop below this threshold
                      </FormDescription>
                      <div className="text-xs font-medium flex items-center text-blue-600">
                        <DollarSign className="h-3 w-3 mr-1" />
                        €{thresholdReachedEUR.toFixed(2)}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
                
              <FormField
                control={form.control}
                name="topUpAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Auto Top-up Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="number" 
                          placeholder="200" 
                          className="rounded-xl h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-12"
                          {...field} 
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                          credits
                        </div>
                      </div>
                    </FormControl>
                    <div className="flex justify-between items-center mt-1.5">
                      <FormDescription className="text-xs text-gray-500">
                        Number of credits to add when auto top-up is triggered
                      </FormDescription>
                      <div className="text-xs font-medium flex items-center text-blue-600">
                        <DollarSign className="h-3 w-3 mr-1" />
                        €{topUpAmountEUR.toFixed(2)}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
                
              <FormField
                control={form.control}
                name="autoTopUp"
                render={({ field }) => (
                  <FormItem className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium text-gray-700">Enable Auto Top-up</FormLabel>
                        <FormDescription className="text-xs text-gray-500">
                          Automatically add credits when your balance falls below the threshold
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("autoTopUp") && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-4">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium mb-1">Auto Top-up Information</p>
                      <p>Your account will be automatically charged <strong>€{topUpAmountEUR.toFixed(2)}</strong> whenever your credit balance falls below <strong>{form.watch("minimumThreshold")} credits</strong>.</p>
                      <p className="mt-2">Price calculation: <strong>{form.watch("topUpAmount")} credits × €{calculatePricePerCredit(form.watch("topUpAmount")).toFixed(2)}/credit</strong></p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="bg-gray-50 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="mr-2 border-gray-300"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default AutoTopUpSettingsModal 