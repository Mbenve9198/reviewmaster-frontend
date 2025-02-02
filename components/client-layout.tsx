"use client"

import { Sidebar } from "@/components/sidebar"
import { usePathname } from 'next/navigation'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Particles } from "@/components/ui/particles"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const noSidebarPaths = ['/onboarding', '/login', '/signup', '/reset-password']
  const shouldShowSidebar = !noSidebarPaths.includes(pathname)
  const isAuthPage = ['/login', '/signup', '/reset-password'].includes(pathname)

  return (
    <Elements stripe={stripePromise}>
      <div className="flex h-full">
        {shouldShowSidebar && <Sidebar />}
        <main className={`flex-1 overflow-auto ${isAuthPage ? 'relative' : ''}`}>
          {isAuthPage && (
            <Particles
              className="absolute inset-0"
              quantity={75}
              ease={50}
              size={0.8}
              color="#94a3b8"
              refresh={false}
            />
          )}
          {children}
        </main>
      </div>
    </Elements>
  )
}