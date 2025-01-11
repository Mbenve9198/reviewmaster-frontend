"use client"

import { LogOut } from 'lucide-react'
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useUserStats } from "@/hooks/useUserStats"
import { useEffect } from "react"

const navigation = [
  { 
    name: "Manual Responses", 
    href: "/", 
    icon: (props: any) => (
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/manual%20response-O89S3zfgiDHVSo8aslEIqW3O8G9Q1n.png"
        alt=""
        width={64}
        height={64}
        {...props}
      />
    )
  },
  { 
    name: "Reviews", 
    href: "/reviews", 
    icon: (props: any) => (
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/reviews-l1OpTAuGJuHcOblMRfwhcgfLCeAwcL.png"
        alt=""
        width={64}
        height={64}
        {...props}
      />
    )
  },
  { 
    name: "Integrations", 
    href: "/integrations", 
    icon: (props: any) => (
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/integrations-j6xc3UsKFO34cvJf9gb4RD4SCIVG4W.png"
        alt=""
        width={64}
        height={64}
        {...props}
      />
    )
  },
  { 
    name: "Hotel Settings", 
    href: "/hotel-settings", 
    icon: (props: any) => (
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hotel%20settings-f5Dt1SvEcaRL6BkvvE2q78qgAeJXL4.png"
        alt=""
        width={64}
        height={64}
        {...props}
      />
    )
  },
  { 
    name: "Billing", 
    href: "/billing", 
    icon: (props: any) => (
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/billing-Y6wfuqXGbZ7TIpFrhCoDQMjXShiPgI.png"
        alt=""
        width={64}
        height={64}
        {...props}
      />
    )
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { 
    responsesUsed, 
    responsesLimit, 
    hotelsCount, 
    hotelsLimit,
    responseCredits,
    subscriptionPlan,
    nextResetDate,
    isLoading,
    refetch
  } = useUserStats()

  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 5000)

    return () => clearInterval(interval)
  }, [refetch])

  const formatDate = (dateString: string) => {
    if (!dateString) return "..."
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(date)
    } catch {
      return "Data non disponibile"
    }
  }

  const handleLogout = () => {
    // Rimuovi il token dai cookies
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    router.push('/login')
  }

  return (
    <div className="flex flex-col w-[280px] bg-white border-r min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">ReviewMaster</h1>
      </div>
      <nav className="flex-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-6 px-8 py-6 text-xl font-medium rounded-xl mb-3 transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <item.icon className="w-12 h-12" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-gray-600">Responses generated</span>
            <span className="text-primary">
              {isLoading ? "..." : `${responsesUsed}/${responsesLimit}`}
            </span>
          </div>
          <Progress 
            value={isLoading ? 0 : (responsesUsed / responsesLimit) * 100} 
            className="h-3 bg-primary/20"
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-gray-600">Hotels connected</span>
            <span className="text-primary">
              {isLoading ? "..." : `${hotelsCount}/${hotelsLimit}`}
            </span>
          </div>
          <Progress 
            value={isLoading ? 0 : (hotelsCount / hotelsLimit) * 100} 
            className="h-3 bg-primary/20"
          />
        </div>

        <div className="pt-4 border-t space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Current plan</span>
            <span className="text-primary font-medium capitalize">
              {isLoading ? "..." : subscriptionPlan}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Next reset</span>
            <span className="text-primary font-medium">
              {isLoading ? "..." : formatDate(nextResetDate)}
            </span>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            variant="default"
            size="default"
            className="w-full max-w-[150px] text-base py-3 rounded-xl shadow-[0_4px_0_0_#2563eb] flex items-center justify-center gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Log out
          </Button>
        </div>
      </div>
    </div>
  )
}
