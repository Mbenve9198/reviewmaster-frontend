"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Button } from "@/components/ui/button"

export default function VerifyEmailPage() {
  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showResendButton, setShowResendButton] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const verifyEmail = async () => {
    if (!token) {
      setError('Verification token is missing')
      setVerifying(false)
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Importante per CORS
        body: JSON.stringify({ token })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Email verified successfully!')
        router.push('/login?verified=true')
      } else {
        setError(data.message || 'Error during verification')
        if (data.code === 'TOKEN_EXPIRED') {
          setShowResendButton(true)
        }
      }
    } catch (error) {
      console.error('Verification error:', error)
      setError('Error during verification. Please try again later.')
    } finally {
      setVerifying(false)
    }
  }

  const handleResendVerification = async () => {
    try {
      const email = searchParams.get('email')
      if (!email) {
        toast.error('Email address is missing')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('New verification email sent! Please check your inbox.')
        setShowResendButton(false)
      } else {
        toast.error(data.message || 'Error sending verification email')
      }
    } catch (error) {
      console.error('Resend verification error:', error)
      toast.error('Error sending verification email')
    }
  }

  useEffect(() => {
    verifyEmail()
  }, [token])

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-4xl font-bold text-center text-[#3b82f6] mb-6">ReviewMaster</h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-3xl sm:px-10 border-2 border-gray-100">
          <div className="text-center">
            {verifying ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6]"></div>
              </div>
            ) : error ? (
              <div className="space-y-4">
                <div className="text-red-600">{error}</div>
                {showResendButton && (
                  <Button
                    onClick={handleResendVerification}
                    className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
                  >
                    Resend Verification Email
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-green-600">Email verified successfully!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 