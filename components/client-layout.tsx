"use client"

import { Sidebar } from "@/components/sidebar"
import { usePathname } from 'next/navigation'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Particles } from "@/components/ui/particles"
import { WhatsAppSupport } from "@/components/ui/whatsapp-support"
import FacebookPixel from "@/components/facebook-pixel"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const noSidebarPaths = ['/onboarding', '/login', '/signup', '/reset-password', '/verify-email']
  const shouldShowSidebar = !noSidebarPaths.includes(pathname)
  const isAuthPage = ['/login', '/signup', '/reset-password', '/verify-email'].includes(pathname)

  return (
    <Elements stripe={stripePromise}>
      {/* Facebook Pixel per il tracciamento */}
      <FacebookPixel />
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
      {/* WhatsApp Support Icon */}
      <WhatsAppSupport 
        phoneNumber="+393663153304" 
        message="Hello, I need assistance with Replai" 
      />
    </Elements>
  )
}