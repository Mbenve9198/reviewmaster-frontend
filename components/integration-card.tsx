"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { 
  Loader2, 
  RefreshCw, 
  Settings, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Trash2 
} from "lucide-react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCookie } from "@/lib/utils"
import { format } from 'date-fns'
import { toast } from "sonner"

const buttonBaseStyles = "transition-all shadow-[0_4px_0_0_#2563eb] active:shadow-[0_0_0_0_#2563eb] active:translate-y-1"
const inputBaseStyles = "border-2 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"

interface IntegrationCardProps {
  integration: {
    _id: string
    platform: string
    status: 'active' | 'error' | 'disconnected' | 'pending'
    logo: string
    stats: {
      totalReviews: number
      syncedReviews: number
      lastSyncedReviewDate: Date | null
    }
    syncConfig: {
      type: 'manual' | 'automatic'
      frequency: 'daily' | 'weekly' | 'monthly'
      lastSync: Date | null
      nextScheduledSync: Date | null
      error?: {
        message: string
        code: string
        timestamp: Date
      }
    }
  }
  onSync: () => Promise<void>
  onDelete?: () => void
}

export function IntegrationCard({ integration, onSync, onDelete }: IntegrationCardProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const statusIcons = {
    active: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    disconnected: <XCircle className="w-5 h-5 text-gray-500" />,
    pending: <Loader2 className="w-5 h-5 text-yellow-500" />
  }

  const handleSync = async () => {
    try {
      setIsSyncing(true)
      await onSync()
      toast.success("Sync completed successfully")
    } catch (error) {
      console.error('Sync error:', error)
      toast.error("Failed to sync reviews")
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const token = getCookie('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/integrations/${integration._id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete integration')
      }

      toast.success("Integration deleted successfully")
      onDelete?.()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error("Failed to delete integration")
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const updateIntegrationSettings = async (settings: any) => {
    try {
      setIsUpdating(true)
      const token = getCookie('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/integrations/${integration._id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ syncConfig: settings })
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update settings')
      }

      toast.success("Settings updated successfully")
    } catch (error) {
      console.error('Update settings error:', error)
      toast.error("Failed to update settings")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <>
      <Card className="relative overflow-hidden border-2 hover:border-primary/20 transition-all duration-200 hover:shadow-xl rounded-2xl bg-gradient-to-b from-white to-gray-50/50">
        <CardHeader className="space-y-1 border-b bg-white/50">
          <div className="flex items-center justify-between mb-2">
            <div className="h-12 w-12 relative">
              <Image
                src={integration.logo}
                alt={integration.platform}
                fill
                className="object-contain"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
                className="hover:bg-gray-100 rounded-xl"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="hover:bg-red-50 text-red-500 rounded-xl"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <CardTitle className="capitalize">{integration.platform}</CardTitle>
            {statusIcons[integration.status]}
          </div>
          <CardDescription>
            Last synced: {integration.syncConfig.lastSync 
              ? format(new Date(integration.syncConfig.lastSync), 'MMM d, yyyy HH:mm')
              : 'Never'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          {integration.status === 'error' && integration.syncConfig.error && (
            <Alert variant="destructive" className="mb-4 rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {integration.syncConfig.error.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Reviews Synced</span>
              <span className="font-medium">
                {integration.stats.syncedReviews}/{integration.stats.totalReviews}
              </span>
            </div>
            <Progress 
              value={(integration.stats.syncedReviews / integration.stats.totalReviews) * 100} 
              className="h-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Sync Type</p>
              <p className="font-medium capitalize">
                {integration.syncConfig.type}
              </p>
            </div>
            {integration.syncConfig.type === 'automatic' && (
              <div>
                <p className="text-gray-500 mb-1">Frequency</p>
                <p className="font-medium capitalize">
                  {integration.syncConfig.frequency}
                </p>
              </div>
            )}
            {integration.syncConfig.type === 'automatic' && (
              <div>
                <p className="text-gray-500 mb-1">Next Sync</p>
                <p className="font-medium">
                  {integration.syncConfig.nextScheduledSync
                    ? format(new Date(integration.syncConfig.nextScheduledSync), 'MMM d')
                    : 'Not scheduled'}
                </p>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0">
          <Button 
            onClick={handleSync}
            disabled={isSyncing || integration.status === 'disconnected'}
            className={`w-full ${buttonBaseStyles} rounded-xl h-12`}
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Now
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="bg-white sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Integration Settings</DialogTitle>
            <DialogDescription>
              Configure sync settings for {integration.platform}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sync Type</label>
              <Select 
                value={integration.syncConfig.type}
                onValueChange={(value: 'manual' | 'automatic') => 
                  updateIntegrationSettings({ type: value })
                }
              >
                <SelectTrigger className={inputBaseStyles}>
                  <SelectValue placeholder="Select sync type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {integration.syncConfig.type === 'automatic' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Sync Frequency</label>
                <Select
                  value={integration.syncConfig.frequency}
                  onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
                    updateIntegrationSettings({ frequency: value })
                  }
                >
                  <SelectTrigger className={inputBaseStyles}>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="w-full rounded-xl"
              >
                Delete Integration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete Integration</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this integration? This action will also delete all associated reviews and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="rounded-xl flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl flex-1 sm:flex-none"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Integration'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}