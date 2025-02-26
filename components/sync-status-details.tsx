"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Info, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import { format } from 'date-fns'

interface SyncStatusDetailsProps {
  integration: {
    _id: string
    platform: string
    status: 'active' | 'error' | 'disconnected' | 'pending'
    syncConfig: {
      type: 'manual' | 'automatic'
      frequency: 'daily' | 'weekly' | 'monthly'
      lastSync: Date | null
      nextScheduledSync: Date | null
      error?: {
        message: string
        code: string
        timestamp: Date
        details?: string
      }
    }
    stats: {
      totalReviews: number
      syncedReviews: number
      lastSyncedReviewDate: Date | null
      lastSyncStats?: {
        newReviews: number
        updatedReviews: number
        duration: number
        startTime: Date
        endTime: Date
      }
    }
  }
}

export function SyncStatusDetails({ integration }: SyncStatusDetailsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const statusIcons = {
    active: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    disconnected: <AlertCircle className="w-5 h-5 text-gray-500" />,
    pending: <Clock className="w-5 h-5 text-yellow-500" />
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl"
      >
        <Info className="w-4 h-4 mr-1" />
        Details
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-white sm:max-w-[500px] p-6 rounded-3xl border-0">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">
              Sync Details for {integration.platform}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex items-center gap-3">
              <div className="text-lg font-medium">Status:</div>
              <div className="flex items-center gap-2">
                {statusIcons[integration.status]}
                <span className="capitalize">{integration.status}</span>
              </div>
            </div>

            {integration.syncConfig.lastSync && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Last sync</div>
                  <div className="font-medium">
                    {format(new Date(integration.syncConfig.lastSync), 'dd MMM yyyy HH:mm')}
                  </div>
                </div>
                
                {integration.syncConfig.nextScheduledSync && (
                  <div>
                    <div className="text-sm text-gray-500">Next scheduled sync</div>
                    <div className="font-medium">
                      {format(new Date(integration.syncConfig.nextScheduledSync), 'dd MMM yyyy HH:mm')}
                    </div>
                  </div>
                )}
              </div>
            )}

            {integration.stats.lastSyncStats && (
              <div className="bg-blue-50 p-4 rounded-xl">
                <h3 className="font-medium mb-2">Last sync details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">New reviews</div>
                    <div className="font-medium">{integration.stats.lastSyncStats.newReviews}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Updated reviews</div>
                    <div className="font-medium">{integration.stats.lastSyncStats.updatedReviews}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Duration</div>
                    <div className="font-medium">{Math.round(integration.stats.lastSyncStats.duration / 1000)}s</div>
                  </div>
                </div>
              </div>
            )}

            {integration.status === 'error' && integration.syncConfig.error && (
              <div className="bg-red-50 p-4 rounded-xl border-l-4 border-red-500">
                <h3 className="font-medium text-red-700 mb-2">Error</h3>
                <div className="text-red-600">{integration.syncConfig.error.message}</div>
                {integration.syncConfig.error.details && (
                  <div className="text-sm text-red-500 mt-2">{integration.syncConfig.error.details}</div>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  {format(new Date(integration.syncConfig.error.timestamp), 'dd MMM yyyy HH:mm')}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 