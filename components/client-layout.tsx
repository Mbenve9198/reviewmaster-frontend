"use client"

import { Sidebar } from "@/components/sidebar"
import { usePathname } from 'next/navigation'

export function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const noSidebarPaths = ['/onboarding', '/login', '/signup']
  const shouldShowSidebar = !noSidebarPaths.includes(pathname)

  return (
    <div className="flex h-full">
      {shouldShowSidebar && <Sidebar />}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
} 