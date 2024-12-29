"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft } from 'lucide-react'
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    propertyName: "",
    propertyType: "",
    description: "",
    managerSignature: ""
  })
  const totalSteps = 4
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const steps = [
    {
      title: "What's your property name?",
      description: "Enter your property's name here",
      isInput: true,
      field: "propertyName",
      placeholder: "Enter your property name"
    },
    {
      title: "What type of property do you manage?",
      description: "Select the type of property you manage from the options below.",
      options: [
        { emoji: "🏨", label: "Hotel", value: "hotel" },
        { emoji: "🛏️", label: "B&B", value: "b&b" },
        { emoji: "🏖️", label: "Resort", value: "resort" },
        { emoji: "🏠", label: "Apartment", value: "apartment" },
      ]
    },
    {
      title: "Add a description of your property",
      description: "Provide a detailed description of your property for your guests.",
      isTextarea: true,
      field: "description",
      placeholder: "Describe your property to your guests..."
    },
    {
      title: "Add your signature for review responses",
      description: "Enter your name and title for review responses.",
      isInput: true,
      field: "managerSignature",
      placeholder: "Ex: John Smith, General Manager"
    }
  ]

  const progress = (step / totalSteps) * 100

  const handleContinue = async () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      try {
        const token = localStorage.getItem('token')
        
        if (!token) {
          throw new Error('No authentication token found')
        }

        const dataToSend = {
          name: formData.propertyName,
          type: formData.propertyType,
          description: formData.description,
          managerName: formData.managerSignature.split(',')[0].trim(),
          signature: formData.managerSignature,
          responseSettings: {
            style: 'professional',
            length: 'medium'
          }
        }

        console.log('Data to send:', JSON.stringify(dataToSend, null, 2))

        const response = await fetch('http://localhost:3000/api/hotels', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(dataToSend),
          credentials: 'include'
        })

        const responseData = await response.json()
        console.log('Full server response:', responseData)

        if (!response.ok) {
          throw new Error(responseData.message || 'Error creating hotel')
        }

        router.push('/')
      } catch (error) {
        console.error('Onboarding error:', error)
        setError(error instanceof Error ? error.message : 'An error occurred')
      }
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const isStepValid = () => {
    const currentStep = steps[step - 1]
    if (currentStep.options) {
      return !!formData.propertyType
    }
    if (currentStep.field === 'description') {
      return formData.description && formData.description.trim().length > 0
    }
    return !!formData[currentStep.field as keyof typeof formData]
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-4 bg-[#E5E5E5] z-10">
        <div className="h-full bg-[#3b82f6]" style={{ width: `${progress}%` }} />
        <button 
          onClick={() => step > 1 && setStep(step - 1)}
          className="absolute left-6 top-1/2 -translate-y-1/2"
        >
          <ChevronLeft className="w-8 h-8 text-gray-400" />
        </button>
      </div>

      <div className="pt-20 px-6 max-w-3xl mx-auto min-h-screen pb-32">
        {/* Mascot and speech bubble */}
        <div className="flex items-start gap-6 mb-12">
          <div className="w-32 h-32">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Animation%20-%201735491929327-XOhgz8lfJwx8lGgMsQoyT2J9Vn8Vya.gif"
              alt="ReviewMaster Mascot"
              width={128}
              height={128}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div className="flex-1">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{steps[step - 1].title}</h2>
              <p className="text-gray-600">{steps[step - 1].description}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 max-w-2xl mx-auto">
          {step === 1 && (
            <Input
              value={formData.propertyName}
              onChange={(e) => handleInputChange('propertyName', e.target.value)}
              className="p-6 text-xl rounded-2xl border-2 border-gray-200 focus:border-[#3b82f6] focus:ring-[#3b82f6]"
              placeholder="Enter your property name"
            />
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 gap-4">
              {steps[1]?.options?.map((type) => (
                <button
                  key={type.value}
                  className={`flex items-center gap-6 p-6 text-left text-xl border-2 rounded-3xl transition-colors ${
                    formData.propertyType === type.value
                      ? "bg-[#3b82f6]/10 border-[#3b82f6]"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => handleInputChange('propertyType', type.value)}
                >
                  <span className="text-4xl">{type.emoji}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="p-6 text-xl rounded-2xl border-2 border-gray-200 focus:border-[#3b82f6] focus:ring-[#3b82f6] min-h-[200px]"
              placeholder="Describe your property to your guests..."
            />
          )}

          {step === 4 && (
            <div className="space-y-4">
              <Input
                value={formData.managerSignature}
                onChange={(e) => handleInputChange('managerSignature', e.target.value)}
                className="p-6 text-xl rounded-2xl border-2 border-gray-200 focus:border-[#3b82f6] focus:ring-[#3b82f6]"
                placeholder="Ex: John Smith, General Manager"
              />
              <p className="text-lg text-gray-600 px-2">
                This signature will appear at the end of your review responses
              </p>
            </div>
          )}
        </div>

        {/* Continue button */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t">
          <div className="max-w-3xl mx-auto">
            <Button 
              className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold text-2xl py-8 rounded-2xl transition-all disabled:opacity-50 disabled:hover:bg-[#3b82f6]"
              disabled={!isStepValid()}
              onClick={handleContinue}
            >
              {step === totalSteps ? "COMPLETE" : "CONTINUE"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

