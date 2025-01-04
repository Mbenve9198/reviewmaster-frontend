"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

export default function VerifyEmailPage() {
  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('Token di verifica mancante')
        setVerifying(false)
        return
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token })
        })

        const data = await response.json()

        if (response.ok) {
          toast.success('Email verificata con successo!')
          router.push('/login')
        } else {
          setError(data.message || 'Errore durante la verifica')
        }
      } catch (error) {
        console.error('Verification error:', error)
        setError('Errore durante la verifica')
      } finally {
        setVerifying(false)
      }
    }

    verifyEmail()
  }, [token, router])

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-4xl font-bold text-center text-[#3b82f6] mb-6">ReviewMaster</h1>
        <div className="relative w-32 h-32 mx-auto mb-8">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Animation%20-%201735475353995%20(1)-gb0Iqm2o4UfOtqKV9ci6WaYC8gW8R8.gif"
            alt="ReviewMaster Mascot"
            layout="fill"
            objectFit="contain"
            priority
          />
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-3xl sm:px-10 border-2 border-gray-100">
          <div className="text-center">
            {verifying ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6]"></div>
              </div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : (
              <div className="text-green-600">Email verificata con successo!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 