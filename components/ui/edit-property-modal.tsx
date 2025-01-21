"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface EditPropertyModalProps {
  isOpen: boolean
  onClose: () => void
  hotelId: string
}

interface IntegrationConfig {
  enabled: boolean
  url: string
  syncType: "automatic" | "manual"
  syncFrequency: "daily" | "weekly" | "monthly"
  reviewCount: "50" | "100" | "500" | "1000" | "10000"
}

interface Integrations {
  google: IntegrationConfig
  booking: IntegrationConfig
  tripadvisor: IntegrationConfig
}

export function EditPropertyModal({ isOpen, onClose, hotelId }: EditPropertyModalProps) {
  const [hotelData, setHotelData] = useState({
    name: "",
    type: "",
    description: "",
    managerSignature: "",
  })

  const [integrations, setIntegrations] = useState<Integrations>({
    google: { enabled: false, url: "", syncType: "automatic", syncFrequency: "daily", reviewCount: "100" },
    booking: { enabled: false, url: "", syncType: "automatic", syncFrequency: "daily", reviewCount: "100" },
    tripadvisor: { enabled: false, url: "", syncType: "automatic", syncFrequency: "daily", reviewCount: "100" },
  })

  useEffect(() => {
    // Fetch hotel data based on hotelId
    // This is a placeholder. In a real application, you would fetch this data from your API
    setHotelData({
      name: "Grand Hotel",
      type: "hotel",
      description: "A luxurious hotel in the heart of the city",
      managerSignature: "John Doe, General Manager",
    })
    setIntegrations({
      google: {
        enabled: true,
        url: "https://g.page/r/ABC123",
        syncType: "automatic",
        syncFrequency: "daily",
        reviewCount: "100",
      },
      booking: {
        enabled: true,
        url: "https://www.booking.com/hotel/grandhotel",
        syncType: "automatic",
        syncFrequency: "weekly",
        reviewCount: "500",
      },
      tripadvisor: { enabled: false, url: "", syncType: "automatic", syncFrequency: "daily", reviewCount: "100" },
    })
  }, [hotelId])

  const handleSave = () => {
    // Save the updated hotel data and integrations
    console.log("Saving hotel data:", hotelData)
    console.log("Saving integrations:", integrations)
    onClose()
  }

  const updateIntegration = (platform: keyof Integrations, field: keyof IntegrationConfig, value: string | boolean) => {
    setIntegrations((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value,
        // If we're enabling the integration, set default values
        ...(field === "enabled" &&
          value === true && {
            url: prev[platform].url || "",
            syncType: prev[platform].syncType || "automatic",
            syncFrequency: prev[platform].syncFrequency || "daily",
            reviewCount: prev[platform].reviewCount || "100",
          }),
      },
    }))
  }

  const platformLogos = {
    google:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/gmg-logo-300x300-1-YhBm2cRJdd8cFKdb5h4uv3cwYooXY7.webp",
    booking: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bookingcom-1-PpT1aFkuoypK4E5hr81mmrkAjltN7f.svg",
    tripadvisor:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Tripadvisor_logoset_solid_green-C4tt0kmMG5GVmLCV2awScR86Qv1xNO.svg",
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Hotel</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Hotel Info</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>
          <TabsContent value="info">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Hotel Name</Label>
                <Input
                  id="name"
                  value={hotelData.name}
                  onChange={(e) => setHotelData({ ...hotelData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Property Type</Label>
                <Select value={hotelData.type} onValueChange={(value) => setHotelData({ ...hotelData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hotel">Hotel</SelectItem>
                    <SelectItem value="b&b">B&B</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={hotelData.description}
                  onChange={(e) => setHotelData({ ...hotelData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="managerSignature">Manager Signature</Label>
                <Input
                  id="managerSignature"
                  value={hotelData.managerSignature}
                  onChange={(e) => setHotelData({ ...hotelData, managerSignature: e.target.value })}
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="integrations">
            <div className="space-y-4 py-4">
              {(Object.keys(integrations) as Array<keyof Integrations>).map((platform) => (
                <Card
                  key={platform}
                  className={cn(
                    "relative p-4 cursor-pointer transition-all",
                    integrations[platform].enabled
                      ? "border-primary ring-2 ring-primary ring-offset-2"
                      : "hover:border-primary/50",
                  )}
                  onClick={() => updateIntegration(platform, "enabled", !integrations[platform].enabled)}
                >
                  <CardHeader className="p-0 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center">
                          <Image
                            src={platformLogos[platform] || "/placeholder.svg"}
                            alt={`${platform} logo`}
                            width={40}
                            height={40}
                            className="object-contain"
                          />
                        </div>
                        <CardTitle className="text-lg font-medium capitalize">{platform}</CardTitle>
                      </div>
                      {integrations[platform].enabled && (
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  {integrations[platform].enabled && (
                    <CardContent className="p-0 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`${platform}-url`}>Platform URL</Label>
                        <Input
                          id={`${platform}-url`}
                          value={integrations[platform].url}
                          onChange={(e) => updateIntegration(platform, "url", e.target.value)}
                          placeholder={`Enter your ${platform} URL`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${platform}-sync-type`}>Sync Type</Label>
                        <Select
                          value={integrations[platform].syncType}
                          onValueChange={(value) => updateIntegration(platform, "syncType", value)}
                        >
                          <SelectTrigger id={`${platform}-sync-type`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="automatic">Automatic</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${platform}-sync-frequency`}>Sync Frequency</Label>
                        <Select
                          value={integrations[platform].syncFrequency}
                          onValueChange={(value) => updateIntegration(platform, "syncFrequency", value)}
                        >
                          <SelectTrigger id={`${platform}-sync-frequency`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${platform}-review-count`}>Review Count</Label>
                        <Select
                          value={integrations[platform].reviewCount}
                          onValueChange={(value) => updateIntegration(platform, "reviewCount", value)}
                        >
                          <SelectTrigger id={`${platform}-review-count`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="50">Last 50 reviews</SelectItem>
                            <SelectItem value="100">Last 100 reviews</SelectItem>
                            <SelectItem value="500">Last 500 reviews</SelectItem>
                            <SelectItem value="1000">Last 1,000 reviews</SelectItem>
                            <SelectItem value="10000">Last 10,000 reviews</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        <Button onClick={handleSave} className="w-full mt-4">
          Save Changes
        </Button>
      </DialogContent>
    </Dialog>
  )
}

