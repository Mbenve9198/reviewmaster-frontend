"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from "react-hot-toast"
import { HandWrittenTitle } from "@/components/ui/hand-writing-text"
import { Tiles } from "@/components/ui/tiles"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Starting password reset with token:', token) // Debug log
    
    if (!token) {
        setError("Reset token is missing")
        return
    }

    if (password !== confirmPassword) {
        setError("Passwords don't match")
        return
    }

    if (password.length < 6) {
        setError("Password must be at least 6 characters long")
        return
    }
    
    setError(null)
    setIsLoading(true)
    const loadingToast = toast.loading('Resetting password...')

    try {
        console.log('Sending reset request to API') // Debug log
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ 
                token: token,
                newPassword: password
            })
        })

        console.log('Response status:', response.status) // Debug log
        const data = await response.json()
        console.log('Response data:', data) // Debug log

        if (response.ok) {
            toast.success('Password reset successful! Please login with your new password.', {
                id: loadingToast,
                duration: 5000
            })
            router.push('/login')
        } else {
            const errorMessage = data.message || 'Failed to reset password'
            console.error('Reset failed:', errorMessage) // Debug log
            toast.error(errorMessage, { id: loadingToast })
            setError(errorMessage)
        }
    } catch (error) {
        console.error('Reset password error:', error)
        toast.error('Failed to reset password', { id: loadingToast })
        setError('Failed to reset password. Please try again.')
    } finally {
        setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Reset Link</h1>
          <p className="text-gray-600 mb-4">This password reset link is invalid or has expired.</p>
          <Button
            onClick={() => router.push('/login')}
            className="bg-primary text-primary-foreground"
          >
            Return to Login
          </Button>
        </div>
      </div>
    )
  }

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
          <HandWrittenTitle 
            title="Replai"
            subtitle="Reset your password"
          />
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-3xl sm:px-10 border-2 border-gray-100">
            <form className="space-y-6" onSubmit={handleResetPassword}>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="mt-1">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="p-4 text-lg rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-primary"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="mt-1">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="p-4 text-lg rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-primary"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-xl py-6 rounded-xl bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all flex items-center justify-center"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
            >
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
} 