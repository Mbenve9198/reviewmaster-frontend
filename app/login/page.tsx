"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { toast } from "react-hot-toast"
import { HandWrittenTitle } from "@/components/ui/hand-writing-text"
import { Tiles } from "@/components/ui/tiles"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [isResetting, setIsResetting] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    const loadingToast = toast.loading('Logging in...')

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const data = await response.json()

      if (response.ok) {
        document.cookie = `token=${data.token}; path=/; max-age=2592000; SameSite=Strict`
        toast.success('Login successful!', { id: loadingToast })
        router.push('/')
      } else {
        toast.error(data.message || 'Login failed', { id: loadingToast })
        setError(data.message || 'Login failed')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      const errorMessage = error.name === 'AbortError' 
        ? 'Request timed out. Please try again.'
        : 'Something went wrong'
      toast.error(errorMessage, { id: loadingToast })
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsResetting(true)
    
    const loadingToast = toast.loading('Sending reset link...')

    try {
        console.log('Sending reset password request for:', resetEmail);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password-request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: resetEmail }),
        })

        const data = await response.json()
        
        if (response.ok) {
            toast.success(data.message, { id: loadingToast })
            setShowForgotPassword(false)
        } else {
            toast.error(data.message || 'Failed to send reset link', { id: loadingToast })
        }
    } catch (error) {
        console.error('Reset password error:', error)
        toast.error('Failed to send reset link', { id: loadingToast })
    } finally {
        setIsResetting(false)
    }
  }

  const buttonClasses = "relative bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all active:top-[2px] active:shadow-[0_0_0_0_#2563eb] disabled:opacity-50 disabled:hover:bg-primary disabled:active:top-0 disabled:active:shadow-[0_4px_0_0_#2563eb]"

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
            subtitle={showForgotPassword ? "Reset your password" : "Sign in to your account"}
          />
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-3xl sm:px-10 border-2 border-gray-100">
            {!showForgotPassword ? (
              <>
                <form className="space-y-6" onSubmit={handleLogin}>
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
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="p-4 text-lg rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-primary"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className={`${buttonClasses} w-full text-xl py-6 rounded-xl shadow-[0_4px_0_0_#2563eb] flex items-center justify-center`}
                    >
                      {isLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        "Sign in"
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
                        <Link href="/signup" className="font-medium text-primary hover:text-primary/90">
                          Don't have an account? Sign up
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-sm text-center">
                  <button
                    onClick={() => setShowForgotPassword(true)}
                    className="text-primary hover:text-primary/90 font-medium"
                  >
                    Forgot your password?
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1">
                    <Input
                      id="reset-email"
                      name="email"
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="p-4 text-lg rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-primary"
                      disabled={isResetting}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isResetting}
                    className="flex-1 bg-primary text-primary-foreground"
                  >
                    {isResetting ? (
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
            )}
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
