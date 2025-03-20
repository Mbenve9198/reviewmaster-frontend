"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Tiles } from "@/components/ui/tiles"
import { FiMail, FiCheckCircle, FiArrowRight } from "react-icons/fi"
import Image from "next/image"
import Link from "next/link"

export default function VerifyEmailNoticePage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(60)
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prevCountdown => {
        if (prevCountdown <= 1) {
          clearInterval(timer)
          return 0
        }
        return prevCountdown - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <>
      <Tiles 
        className="fixed inset-0 -z-10" 
        rows={100}
        cols={20}
        tileSize="md"
      />
      
      <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex flex-col items-center">
            <Image 
              src="/logo-replai.svg" 
              alt="Replai Logo" 
              width={180} 
              height={60} 
              className="mb-4"
            />
            <h2 className="text-xl text-gray-700 font-medium">
              Verify your email
            </h2>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-3xl sm:px-10 border-2 border-gray-100">
            <div className="flex flex-col items-center justify-center text-center">
              
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <FiMail className="w-12 h-12 text-primary" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Check your inbox
              </h2>
              
              <p className="text-gray-600 mb-6">
                We've sent a verification link to your email address.
                Please check your inbox and click the link to verify your account.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-xl w-full mb-6">
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <FiCheckCircle className="text-green-500 flex-shrink-0" />
                  <p>Check your spam folder if you don't see it in your inbox</p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-700 mt-2">
                  <FiCheckCircle className="text-green-500 flex-shrink-0" />
                  <p>The verification link will expire in 24 hours</p>
                </div>
              </div>
              
              <Link 
                href="/login" 
                className="flex items-center justify-center text-primary hover:text-primary/90"
              >
                <span>Proceed to login</span>
                <FiArrowRight className="ml-1" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-6 px-4 shadow sm:rounded-3xl sm:px-10 border-2 border-gray-100">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Didn't receive the email?</p>
              {countdown > 0 ? (
                <p className="text-sm text-gray-500">
                  You can request a new verification email in {countdown} seconds
                </p>
              ) : (
                <Button 
                  onClick={() => router.push('/login?resend=true')}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Resend verification email
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 