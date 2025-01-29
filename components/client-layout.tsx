"use client"

import { Sidebar } from "@/components/sidebar"
import { usePathname } from 'next/navigation'
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const noSidebarPaths = ['/onboarding', '/login', '/signup']
  const shouldShowSidebar = !noSidebarPaths.includes(pathname)

  return (
    <Elements stripe={stripePromise}>
      <div className="flex h-full">
        {shouldShowSidebar && <Sidebar />}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </Elements>
  )
}