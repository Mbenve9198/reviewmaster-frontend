"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Check, ArrowLeft } from 'lucide-react';

interface ImportOptionsProps {
  onClose: () => void;
}

interface PlatformConfig {
  url: string;
  syncType: string;
  syncFrequency: string;
  reviewCount: string;
}

const platforms = [
  {
    id: "google",
    name: "Google Business",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/gmg-logo-300x300-1-ecWuLciZwoxo5uZJsdnIyFYBU3sEQs.webp",
    logoWidth: 40,
    logoHeight: 40,
  },
  {
    id: "booking",
    name: "Booking.com",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bookingcom-1-PpT1aFkuoypK4E5hr81mmrkAjltN7f.svg",
    logoWidth: 40,
    logoHeight: 40,
  },
  {
    id: "tripadvisor",
    name: "TripAdvisor",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Tripadvisor_logoset_solid_green-C4tt0kmMG5GVmLCV2awScR86Qv1xNO.svg",
    logoWidth: 40,
    logoHeight: 40,
  },
] as const;

type PlatformId = (typeof platforms)[number]["id"];

export function ImportOptions({ onClose }: ImportOptionsProps) {
  const [step, setStep] = useState<"select" | "configure">("select");
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformId[]>([]);
  const [currentPlatformIndex, setCurrentPlatformIndex] = useState(0);
  const [configs, setConfigs] = useState<Record<PlatformId, PlatformConfig>>({
    google: { url: "", syncType: "automatic", syncFrequency: "daily", reviewCount: "100" },
    booking: { url: "", syncType: "automatic", syncFrequency: "daily", reviewCount: "100" },
    tripadvisor: { url: "", syncType: "automatic", syncFrequency: "daily", reviewCount: "100" },
  });

  const togglePlatform = (platformId: PlatformId) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platformId)) {
        return prev.filter(id => id !== platformId);
      }
      return [...prev, platformId];
    });
  };

  const updateConfig = (
    platform: PlatformId,
    field: keyof PlatformConfig,
    value: string
  ) => {
    setConfigs(prev => ({
      ...prev,
      [platform]: { ...prev[platform], [field]: value }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPlatformIndex < selectedPlatforms.length - 1) {
      setCurrentPlatformIndex(prev => prev + 1);
    } else {
      const selectedConfigs = selectedPlatforms.reduce((acc, platform) => {
        acc[platform] = configs[platform];
        return acc;
      }, {} as Record<PlatformId, PlatformConfig>);
      console.log("Importing reviews with config:", selectedConfigs);
      onClose();
    }
  };

  const currentPlatform = selectedPlatforms[currentPlatformIndex];
  const isLastPlatform = currentPlatformIndex === selectedPlatforms.length - 1;

  if (step === "select") {
    return (
      <div className="space-y-6">
        <div className="text-center text-sm text-muted-foreground">
          Select the platforms you want to import reviews from
        </div>
        <div className="grid grid-cols-1 gap-4">
          {platforms.map((platform) => (
            <Card
              key={platform.id}
              className={`relative p-4 cursor-pointer transition-all ${
                selectedPlatforms.includes(platform.id)
                  ? "border-primary ring-2 ring-primary ring-offset-2"
                  : "hover:border-primary/50"
              }`}
              onClick={() => togglePlatform(platform.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center">
                    <Image
                      src={platform.logo || "/placeholder.svg"}
                      alt={platform.name}
                      width={platform.logoWidth}
                      height={platform.logoHeight}
                      className="object-contain"
                    />
                  </div>
                  <span className="font-medium">{platform.name}</span>
                </div>
                {selectedPlatforms.includes(platform.id) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </motion.div>
                )}
              </div>
            </Card>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => {
              setStep("configure");
              setCurrentPlatformIndex(0);
            }}
            disabled={selectedPlatforms.length === 0}
          >
            Continue
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setStep("select")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center">
            <Image
              src={platforms.find(p => p.id === currentPlatform)!.logo || "/placeholder.svg"}
              alt={platforms.find(p => p.id === currentPlatform)!.name}
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <h3 className="font-medium">
            {platforms.find(p => p.id === currentPlatform)!.name}
          </h3>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentPlatform}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          <div>
            <Label>Platform URL</Label>
            <Input
              value={configs[currentPlatform].url}
              onChange={(e) => updateConfig(currentPlatform, "url", e.target.value)}
              placeholder={`Enter your ${platforms.find(p => p.id === currentPlatform)!.name} URL`}
            />
          </div>
          <div>
            <Label>Sync Type</Label>
            <Select
              value={configs[currentPlatform].syncType}
              onValueChange={(value) => updateConfig(currentPlatform, "syncType", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="automatic">Automatic</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Sync Frequency</Label>
            <Select
              value={configs[currentPlatform].syncFrequency}
              onValueChange={(value) => updateConfig(currentPlatform, "syncFrequency", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Initial Import Count</Label>
            <Select
              value={configs[currentPlatform].reviewCount}
              onValueChange={(value) => updateConfig(currentPlatform, "reviewCount", value)}
            >
              <SelectTrigger>
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
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-col gap-2">
        <Button type="submit">
          {isLastPlatform ? "Start Import" : "Next Platform"}
        </Button>
      </div>
    </form>
  );
}

