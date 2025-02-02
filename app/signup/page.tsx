"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { setCookie } from 'cookies-next'
import { toast } from "react-hot-toast"
import { HandWrittenTitle } from "@/components/ui/hand-writing-text"
import { Tiles } from "@/components/ui/tiles"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError("Passwords don't match")
      return
    }
    
    setError(null)
    setIsLoading(true)
    const loadingToast = toast.loading('Creating your account...')

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password,
          name: email.split('@')[0]
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const data = await response.json()

      if (response.ok) {
        toast.success('Account created! Please check your email to verify your account.', { 
          id: loadingToast,
          duration: 5000
        })
        router.push('/verify-email-notice')
      } else {
        toast.error(data.message || 'Registration failed', { id: loadingToast })
        setError(data.message || 'Registration failed')
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      const errorMessage = error.name === 'AbortError' 
        ? 'Request timed out. Please try again.'
        : 'Registration failed'
      toast.error(errorMessage, { id: loadingToast })
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
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
            subtitle="Create your account"
          />
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-3xl sm:px-10 border-2 border-gray-100">
            <form className="space-y-6" onSubmit={handleSignUp}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="p-4 text-lg rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-primary"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
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
                  Confirm Password
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
                    "Sign up"
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-center">
                  <div className="text-sm">
                    <Link href="/login" className="font-medium text-primary hover:text-primary/90">
                      Already have an account? Sign in
                    </Link>
                  </div>
                </div>
              </div>
            </div>
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
