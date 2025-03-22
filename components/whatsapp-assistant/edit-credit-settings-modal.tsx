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
import { Loader2, CreditCard, Wallet, Sparkles } from 'lucide-react'

// Price calculation functions
const calculatePricePerCredit = (credits: number) => {
  if (credits >= 10000) return 0.10
  if (credits >= 500) return 0.15
  return 0.30
}

const calculateTotalPrice = (credits: number) => {
  return credits * calculatePricePerCredit(credits)
}

const calculateSavings = (credits: number) => {
  const regularPrice = credits * 0.30 // regular price without discounts
  const actualPrice = calculateTotalPrice(credits)
  return regularPrice - actualPrice
}

const creditSettingsSchema = z.object({
  minimumThreshold: z.coerce.number().min(10, 'Minimum threshold must be at least 10').max(1000, 'Minimum threshold must be at most 1000'),
  topUpAmount: z.coerce.number().min(50, 'Top-up amount must be at least 50').max(10000, 'Top-up amount must be at most 10000'),
  autoTopUp: z.boolean().default(false),
})

type CreditSettingsFormValues = z.infer<typeof creditSettingsSchema>

interface EditCreditSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => Promise<void>
  currentConfig: {
    hotelId: string
    creditSettings: {
      minimumThreshold: number
      topUpAmount: number
      autoTopUp: boolean
    }
  }
  isUserAccount?: boolean
}

export function EditCreditSettingsModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  currentConfig,
  isUserAccount = false
}: EditCreditSettingsModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CreditSettingsFormValues>({
    resolver: zodResolver(creditSettingsSchema),
    defaultValues: {
      minimumThreshold: currentConfig.creditSettings?.minimumThreshold || 50,
      topUpAmount: currentConfig.creditSettings?.topUpAmount || 200,
      autoTopUp: currentConfig.creditSettings?.autoTopUp || false,
    },
  })
  
  const topUpAmount = form.watch('topUpAmount')
  const pricePerCredit = calculatePricePerCredit(topUpAmount)
  const totalPrice = calculateTotalPrice(topUpAmount)
  const savings = calculateSavings(topUpAmount)

  const onSubmit = async (data: CreditSettingsFormValues) => {
    try {
      setIsLoading(true)
      const token = getCookie('token')
      
      if (!token) {
        toast.error('Session expired. Please login again.')
        return
      }
      
      // Determine which endpoint to use based on whether we're in WhatsApp Assistant or Billing
      const endpoint = isUserAccount 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/wallet/credit-settings` 
        : `${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp-assistant/${currentConfig.hotelId}`
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          creditSettings: {
            minimumThreshold: data.minimumThreshold,
            topUpAmount: data.topUpAmount,
            autoTopUp: data.autoTopUp
          }
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update credit settings')
      }
      
      await onSuccess()
      toast.success('Credit settings updated successfully')
      onClose()
    } catch (error) {
      console.error('Error updating credit settings:', error)
      toast.error('Failed to update credit settings')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[500px] p-0 bg-white rounded-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="px-6 py-5 border-b flex-shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Wallet className="h-5 w-5 text-blue-500" />
              </div>
              <DialogTitle className="text-lg font-semibold">
                Credit Settings
              </DialogTitle>
            </div>
            <DialogDescription className="pt-1 text-sm">
              Configure credit usage and automatic top-up settings for your WhatsApp assistant
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="minimumThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Minimum Credit Threshold</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="50" 
                          className="rounded-xl h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500 mt-1">
                        When credits fall below this threshold, automatic top-up will be triggered (if enabled)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="topUpAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Automatic Top-up Amount</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="200" 
                          className="rounded-xl h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          {...field} 
                        />
                      </FormControl>
                      <div className="mt-1.5 p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Price per credit:</span>
                          <span className="font-medium text-gray-800">€{pricePerCredit.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-xs text-gray-600">Total price:</span>
                          <span className="font-bold text-blue-600">€{totalPrice.toFixed(2)}</span>
                        </div>
                        {savings > 0 && (
                          <div className="flex items-center justify-between mt-0.5 pb-0.5">
                            <span className="text-xs text-green-600 flex items-center">
                              <Sparkles className="h-3 w-3 mr-1" />
                              You save:
                            </span>
                            <span className="font-bold text-green-600">€{savings.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1.5 pt-1.5 border-t border-blue-100">
                          <p className="text-xs">
                            More credits = Lower price per credit
                          </p>
                          <p className="mt-0.5 text-xs">
                            <span className="font-medium">Price tiers:</span> €0.30 (50-499), €0.15 (500-9999), €0.10 (10000+)
                          </p>
                        </div>
                      </div>
                      <FormDescription className="text-xs text-gray-500 mt-1">
                        Number of credits to add when automatic top-up is triggered
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="autoTopUp"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-gray-200 p-3 bg-gray-50">
                      <div className="space-y-0">
                        <FormLabel className="text-sm font-medium text-gray-700">Enable Automatic Top-up</FormLabel>
                        <FormDescription className="text-xs text-gray-500">
                          Automatically purchase credits when balance falls below threshold
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter className="gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="rounded-xl border-gray-200 hover:bg-gray-50 h-10"
                >
                  Cancel
                </Button>
                
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 h-10"
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
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EditCreditSettingsModal 