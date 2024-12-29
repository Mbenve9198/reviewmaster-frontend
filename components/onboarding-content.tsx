"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ConnectPropertyModal } from "@/components/connect-property-modal"
import { Star, Hotel, Trophy } from 'lucide-react'
import Image from "next/image"

export function OnboardingContent() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="text-center space-y-8 mb-12">
        <div className="relative">
          <Image
            src="/placeholder.svg"
            alt="ReviewMaster Mascot"
            width={180}
            height={180}
            className="mx-auto"
          />
        </div>
        <h1 className="text-4xl font-bold text-[#58CC02]">Welcome to ReviewMaster!</h1>
        <p className="text-xl text-gray-600">Start your journey to better review management</p>
      </div>

      {/* Main content area styled like Duolingo's lesson path */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-100">
          <div className="flex flex-col items-center space-y-6">
            <div className="w-24 h-24 bg-[#58CC02] rounded-full flex items-center justify-center shadow-lg">
              <Hotel className="w-12 h-12 text-white" />
            </div>
            <Button 
              size="lg" 
              onClick={() => setIsModalOpen(true)}
              className="bg-[#58CC02] hover:bg-[#4CAF00] text-white font-bold py-6 px-8 rounded-2xl text-xl shadow-lg transition-all hover:scale-105 min-w-[240px]"
            >
              Connect Property
            </Button>
          </div>
        </div>

        {/* Achievement preview cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-6 border-2 border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Unlock Reviews</h3>
                <p className="text-gray-600 text-sm">Import your first 100 reviews</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border-2 border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Earn Achievements</h3>
                <p className="text-gray-600 text-sm">Complete daily review goals</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConnectPropertyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}

