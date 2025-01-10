"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { getCookie } from "@/lib/utils"
import Image from "next/image"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type MaxReviews = '100' | '500' | '1000' | 'all';
type SyncFrequency = 'daily' | 'weekly' | 'monthly';

interface AddIntegrationModalProps {
  isOpen: boolean
  onClose: () => void
  hotelId: string
  onIntegrationAdded: (integration: any) => void
}

const platforms = [
  {
    id: 'google',
    name: 'Google Business Profile',
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/google-my-bussines-logo-png_seeklogo-329002-OvZ3IZAlUXbrND3lwaiejZMlWivOUq.png",
    placeholder: "Enter your Google Maps listing URL",
    example: "https://www.google.com/maps/place/YourBusinessName"
  },
  {
    id: 'booking',
    name: 'Booking.com',
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bookingcom-1-84iWRXFhKw2uhSLPIc1eL4eZPSKnUv.svg",
    placeholder: "Enter your Booking.com property URL",
    example: "https://www.booking.com/hotel/your-property-name"
  },
  {
    id: 'tripadvisor',
    name: 'TripAdvisor',
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Tripadvisor_logoset_solid_green-KkpUOomr3cNSTrXGcYHehXnIDlKdbg.svg",
    placeholder: "Enter your TripAdvisor listing URL",
    example: "https://www.tripadvisor.com/your-property"
  }
]

const maxReviewsOptions = [
  { value: '100', label: 'Last 100 reviews' },
  { value: '500', label: 'Last 500 reviews' },
  { value: '1000', label: 'Last 1000 reviews' },
  { value: 'all', label: 'All reviews' }
];

export function AddIntegrationModal({ isOpen, onClose, hotelId, onIntegrationAdded }: AddIntegrationModalProps) {
  const [step, setStep] = useState(1)
  const totalSteps = 3
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [url, setUrl] = useState('')
  const [syncType, setSyncType] = useState<'manual' | 'automatic'>('manual')
  const [frequency, setFrequency] = useState<SyncFrequency>('weekly')
  const [maxReviews, setMaxReviews] = useState<MaxReviews>('100')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [placeId, setPlaceId] = useState('');

  const resetForm = () => {
    setStep(1)
    setSelectedPlatform('')
    setUrl('')
    setSyncType('manual')
    setFrequency('weekly')
    setMaxReviews('100')
    setError('')
    setIsLoading(false)
    setIsVerifying(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const verifyUrl = async () => {
    setIsVerifying(true)
    setError('')

    try {
      const token = getCookie('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/integrations/verify-url`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url, platform: selectedPlatform })
        }
      )

      if (!response.ok) {
        throw new Error('Invalid URL. Please check the format and try again.')
      }

      const data = await response.json()
      setPlaceId(data.placeId)
      setStep(2)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to verify URL')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      const token = getCookie('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/integrations/hotel/${hotelId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            platform: selectedPlatform,
            url,
            placeId,
            syncConfig: {
              type: syncType,
              frequency,
              maxReviews
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create integration');
      }

      const integration = await response.json();
      onIntegrationAdded(integration);
      handleClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create integration');
    } finally {
      setIsLoading(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return selectedPlatform && url
      case 2:
        return syncType && (syncType === 'manual' || frequency)
      case 3:
        return maxReviews
      default:
        return false
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Add New Integration
          </DialogTitle>
          <DialogDescription className="text-center">
            Connect your property with review platforms
          </DialogDescription>
        </DialogHeader>

        <Progress value={(step / totalSteps) * 100} className="h-2 mb-8" />

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {step === 1 && (
            <>
              <div className="space-y-4">
                <label className="text-sm font-medium">Select Platform</label>
                <div className="grid grid-cols-3 gap-4">
                  {platforms.map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => setSelectedPlatform(platform.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedPlatform === platform.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="aspect-square relative mb-2">
                        <Image
                          src={platform.logo}
                          alt={platform.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <p className="text-sm font-medium">{platform.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {selectedPlatform && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Property URL</label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={platforms.find(p => p.id === selectedPlatform)?.placeholder}
                    className="text-base p-4"
                  />
                  <p className="text-xs text-gray-500">
                    Example: {platforms.find(p => p.id === selectedPlatform)?.example}
                  </p>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sync Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSyncType('manual')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      syncType === 'manual'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h3 className="font-medium mb-1">Manual</h3>
                    <p className="text-sm text-gray-500">
                      Sync reviews only when you click the sync button
                    </p>
                  </button>
                  <button
                    onClick={() => setSyncType('automatic')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      syncType === 'automatic'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h3 className="font-medium mb-1">Automatic</h3>
                    <p className="text-sm text-gray-500">
                      Automatically sync reviews on a schedule
                    </p>
                  </button>
                </div>
              </div>

              {syncType === 'automatic' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sync Frequency</label>
                  <Select 
                    value={frequency} 
                    onValueChange={(value: SyncFrequency) => setFrequency(value)}
                  >
                    <SelectTrigger className="text-base p-4">
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
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Reviews to Sync</label>
                <Select value={maxReviews} onValueChange={(value: MaxReviews) => setMaxReviews(value)}>
                  <SelectTrigger className="text-base p-4">
                    <SelectValue placeholder="Select number of reviews" />
                  </SelectTrigger>
                  <SelectContent>
                    {maxReviewsOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Select how many reviews you want to sync initially
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={isLoading}
              >
                Back
              </Button>
            ) : (
              <div />
            )}
            
            <Button
              onClick={step === totalSteps ? handleSubmit : step === 1 ? verifyUrl : () => setStep(step + 1)}
              disabled={!isStepValid() || isLoading || isVerifying}
            >
              {isLoading || isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isVerifying ? 'Verifying...' : 'Creating...'}
                </>
              ) : step === totalSteps ? (
                'Create Integration'
              ) : step === 1 ? (
                'Verify & Continue'
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 