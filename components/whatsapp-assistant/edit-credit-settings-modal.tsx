"use client"

import { useState } from 'react'
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
import { Loader2, CreditCard, Wallet } from 'lucide-react'

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
}

export function EditCreditSettingsModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  currentConfig 
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

  const onSubmit = async (data: CreditSettingsFormValues) => {
    try {
      setIsLoading(true)
      const token = getCookie('token')
      
      if (!token) {
        toast.error('Session expired. Please login again.')
        return
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp-assistant/${currentConfig.hotelId}`, {
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Edit Credit Settings
          </DialogTitle>
          <DialogDescription>
            Configure credit usage and auto-refill settings for your WhatsApp assistant
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-5">
              <FormField
                control={form.control}
                name="minimumThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Credit Threshold</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="50" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      When credits fall below this threshold, auto-refill will be triggered (if enabled)
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
                    <FormLabel>Auto Top-up Amount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="200" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Number of credits to add when auto-refill is triggered
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="autoTopUp"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Auto Top-up</FormLabel>
                      <FormDescription>
                        Automatically purchase credits when balance falls below threshold
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              
              <Button type="submit" disabled={isLoading}>
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

export default EditCreditSettingsModal 