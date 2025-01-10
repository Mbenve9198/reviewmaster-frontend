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
import { Loader2, RefreshCw, Settings, AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCookie } from "@/lib/utils"
import { format } from 'date-fns'

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
      language: string
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
}

export function IntegrationCard({ integration, onSync }: IntegrationCardProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

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
    } catch (error) {
      console.error('Sync error:', error)
    } finally {
      setIsSyncing(false)
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
    } catch (error) {
      console.error('Update settings error:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <>
      <Card className="relative overflow-hidden">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between mb-2">
            <div className="h-12 w-12 relative">
              <Image
                src={integration.logo}
                alt={integration.platform}
                fill
                className="object-contain"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <CardTitle>{integration.platform}</CardTitle>
            {statusIcons[integration.status]}
          </div>
          <CardDescription>
            Last synced: {integration.syncConfig.lastSync 
              ? format(new Date(integration.syncConfig.lastSync), 'MMM d, yyyy HH:mm')
              : 'Never'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {integration.status === 'error' && integration.syncConfig.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {integration.syncConfig.error.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Reviews Synced</span>
              <span>
                {integration.stats.syncedReviews}/{integration.stats.totalReviews}
              </span>
            </div>
            <Progress 
              value={(integration.stats.syncedReviews / integration.stats.totalReviews) * 100} 
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500">Sync Type</p>
              <p className="font-medium">
                {integration.syncConfig.type === 'automatic' ? 'Automatic' : 'Manual'}
              </p>
            </div>
            {integration.syncConfig.type === 'automatic' && (
              <div>
                <p className="text-gray-500">Frequency</p>
                <p className="font-medium capitalize">
                  {integration.syncConfig.frequency}
                </p>
              </div>
            )}
            <div>
              <p className="text-gray-500">Language</p>
              <p className="font-medium uppercase">
                {integration.syncConfig.language}
              </p>
            </div>
            {integration.syncConfig.type === 'automatic' && (
              <div>
                <p className="text-gray-500">Next Sync</p>
                <p className="font-medium">
                  {integration.syncConfig.nextScheduledSync
                    ? format(new Date(integration.syncConfig.nextScheduledSync), 'MMM d')
                    : 'Not scheduled'}
                </p>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button 
            className="w-full"
            onClick={handleSync}
            disabled={isSyncing || integration.status === 'disconnected'}
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

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Integration Settings</DialogTitle>
            <DialogDescription>
              Configure how reviews are synced from {integration.platform}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sync Type</label>
              <Select 
                value={integration.syncConfig.type}
                onValueChange={(value: 'manual' | 'automatic') => 
                  updateIntegrationSettings({ 
                    ...integration.syncConfig, 
                    type: value 
                  })
                }
              >
                <SelectTrigger>
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
                    updateIntegrationSettings({
                      ...integration.syncConfig,
                      frequency: value
                    })
                  }
                >
                  <SelectTrigger>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <Select
                value={integration.syncConfig.language}
                onValueChange={(value: string) =>
                  updateIntegrationSettings({
                    ...integration.syncConfig,
                    language: value
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isUpdating && (
              <div className="flex items-center justify-center text-sm text-gray-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating settings...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 