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
      <DialogContent className="max-w-[500px] p-0 bg-white rounded-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Wallet className="h-5 w-5 text-blue-500" />
              </div>
              <DialogTitle className="text-lg font-semibold">
                Impostazioni Crediti
              </DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              Configura l'utilizzo dei crediti e le impostazioni di ricarica automatica per il tuo assistente WhatsApp
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-5">
                <FormField
                  control={form.control}
                  name="minimumThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Soglia Minima Crediti</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="50" 
                          className="rounded-xl h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500 mt-1.5">
                        Quando i crediti scendono sotto questa soglia, verrà attivata la ricarica automatica (se abilitata)
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
                      <FormLabel className="text-sm font-medium text-gray-700">Importo Ricarica Automatica</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="200" 
                          className="rounded-xl h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500 mt-1.5">
                        Numero di crediti da aggiungere quando viene attivata la ricarica automatica
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="autoTopUp"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-gray-200 p-4 bg-gray-50">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-medium text-gray-700">Abilita Ricarica Automatica</FormLabel>
                        <FormDescription className="text-sm text-gray-500">
                          Acquista automaticamente crediti quando il saldo scende sotto la soglia
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
                  className="rounded-xl border-gray-200 hover:bg-gray-50"
                >
                  Annulla
                </Button>
                
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    'Salva Modifiche'
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