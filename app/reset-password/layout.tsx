"use client"

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  useEffect(() => {
    // Se non c'è token, reindirizza al login
    if (!token) {
      router.push('/login')
    }
  }, [token, router])

  // Se c'è il token, mostra la pagina di reset
  if (token) {
    return <>{children}</>
  }

  // Durante il reindirizzamento, mostra un loader
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )
} 