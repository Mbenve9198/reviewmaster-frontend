"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, MessageSquare, Zap } from 'lucide-react'
import Image from "next/image"

export default function WhatsAppAssistantPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col items-center px-6">
      <div className="max-w-3xl w-full pt-12">
        <div className="text-center space-y-8 mb-12">
          <div className="relative">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/whatsapp-assistant-2x9KPWr0HqPEFpWxgvI8QMJIbfLdSB.png"
              alt="WhatsApp Assistant"
              width={180}
              height={180}
              className="mx-auto animate-float"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-800">
            Your AI WhatsApp Concierge
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Transform your guest communication with an intelligent WhatsApp assistant that handles inquiries 24/7, speaks multiple languages, and delivers personalized responses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: <MessageSquare className="w-8 h-8 text-blue-500" />,
              title: "Smart Communication",
              description: "Automatically detects guest language based on country code and provides instant, contextual responses tailored to your hotel's services"
            },
            {
              icon: <Sparkles className="w-8 h-8 text-purple-500" />,
              title: "Customizable Intelligence",
              description: "Create custom rules to enhance AI responses with specific details about your property, local attractions, and special offerings"
            },
            {
              icon: <Zap className="w-8 h-8 text-yellow-500" />,
              title: "Automated Follow-ups",
              description: "Schedule review requests, manage time zones, and handle operational tasks like sharing menus or booking information"
            }
          ].map((feature, i) => (
            <div 
              key={i}
              className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center space-y-4">
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="relative bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 px-12 text-xl rounded-2xl shadow-[0_4px_0_0_#1e40af] transition-all active:top-[2px] active:shadow-[0_0_0_0_#1e40af] hover:scale-105"
          >
            Create Your AI Assistant
          </Button>
          <p className="text-sm text-gray-500">
            Set up your personalized WhatsApp concierge in minutes
          </p>
        </div>
      </div>
    </div>
  )
} 