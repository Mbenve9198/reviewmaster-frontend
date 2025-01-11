"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import Image from "next/image"

const buttonBaseStyles = "transition-all shadow-[0_4px_0_0_#2563eb] active:shadow-[0_0_0_0_#2563eb] active:translate-y-1"
const inputBaseStyles = "border-2 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"

const PLATFORMS: Array<{
  id: Integration['platform'];
  name: string;
  logo: string;
  placeholder: string;
  example: string;
}> = [
  {
    id: 'google',
    name: 'Google Business',
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/google-my-bussines-logo-png_seeklogo-329002-OvZ3IZAlUXbrND3lwaiejZMlWivOUq.png",
    placeholder: "Enter your Google Business URL",
    example: "https://www.google.com/maps/place/your-hotel-name"
  },
  {
    id: 'booking',
    name: 'Booking.com',
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bookingcom-1-84iWRXFhKw2uhSLPIc1eL4eZPSKnUv.svg",
    placeholder: "Enter your Booking.com property URL",
    example: "https://www.booking.com/hotel/it/hotel-name.it.html"
  },
  {
    id: 'tripadvisor',
    name: 'TripAdvisor',
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Tripadvisor_logoset_solid_green-KkpUOomr3cNSTrXGcYHehXnIDlKdbg.svg",
    placeholder: "Enter your TripAdvisor property URL",
    example: "https://www.tripadvisor.com/Hotel_Review-g123-d456-Reviews-Hotel_Name.html"
  }
];

interface Integration {
  _id: string;
  hotelId: string;
  platform: 'google' | 'booking' | 'tripadvisor';
  url: string;
  placeId: string;
  status: 'active' | 'error' | 'disconnected' | 'pending';
  stats: {
    totalReviews: number;
    syncedReviews: number;
    lastSyncedReviewDate: Date | null;
  };
  syncConfig: {
    type: 'manual' | 'automatic';
    frequency: 'daily' | 'weekly' | 'monthly';
    language: string;
    lastSync: Date | null;
    nextScheduledSync: Date | null;
    error?: {
      message: string;
      code: string;
      timestamp: Date;
    };
  };
}

export function AddIntegrationModal({
  isOpen,
  onClose,
  hotelId,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  hotelId: string;
  onSuccess: (integration: Integration) => Promise<void>;
}) {
  const [selectedPlatform, setSelectedPlatform] = useState<Integration['platform']>('google')
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/integrations/hotel/${hotelId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          hotelId,
          platform: selectedPlatform,
          url: url.trim(),
          syncConfig: {
            type: 'manual',
            frequency: 'weekly',
            maxReviews: '100'
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to add integration')
      }

      const integration = await response.json()
      
      toast.success("Integration added successfully")
      await onSuccess(integration)
      onClose()
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('An unexpected error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white sm:max-w-[600px] p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 bg-gradient-to-b from-gray-50 border-b">
          <DialogTitle className="text-2xl font-bold text-gray-800">Add Integration</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-8">
          {/* Platform Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={`relative p-6 rounded-xl border-2 transition-all ${
                  selectedPlatform === platform.id
                    ? "border-primary bg-primary/5 shadow-lg"
                    : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 relative">
                    <img
                      src={platform.logo}
                      alt={platform.name}
                      className="object-contain"
                    />
                  </div>
                  <span className="font-medium text-gray-700">{platform.name}</span>
                </div>
              </button>
            ))}
          </div>

          {/* URL Input */}
          {selectedPlatform && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={PLATFORMS.find(p => p.id === selectedPlatform)?.placeholder}
                  className={`h-12 rounded-xl ${inputBaseStyles}`}
                />
                <p className="text-sm text-gray-500">
                  Example: {PLATFORMS.find(p => p.id === selectedPlatform)?.example}
                </p>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isLoading || !url.trim()}
                className={`w-full h-12 rounded-xl font-medium ${buttonBaseStyles}`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up integration...
                  </>
                ) : (
                  "Add Integration"
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 