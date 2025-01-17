"use client"

import { LogOut } from 'lucide-react'
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useUserStats } from "@/hooks/useUserStats"
import { useEffect, useState } from "react"
import { SidebarContainer, SidebarBody, SidebarLink } from "@/components/ui/sidebar"

const navigation = [
  { 
    label: "Manual Responses", 
    href: "/", 
    icon: (
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/manual%20response-O89S3zfgiDHVSo8aslEIqW3O8G9Q1n.png"
        alt=""
        width={48}
        height={48}
        className="w-5 h-5 flex-shrink-0"
      />
    )
  },
  { 
    label: "Reviews", 
    href: "/reviews", 
    icon: (
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/reviews-l1OpTAuGJuHcOblMRfwhcgfLCeAwcL.png"
        alt=""
        width={48}
        height={48}
        className="w-5 h-5 flex-shrink-0"
      />
    )
  },
  { 
    label: "Integrations", 
    href: "/integrations", 
    icon: (
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/integrations-j6xc3UsKFO34cvJf9gb4RD4SCIVG4W.png"
        alt=""
        width={48}
        height={48}
        className="w-5 h-5 flex-shrink-0"
      />
    )
  },
  { 
    label: "Hotel Settings", 
    href: "/hotel-settings", 
    icon: (
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hotel%20settings-f5Dt1SvEcaRL6BkvvE2q78qgAeJXL4.png"
        alt=""
        width={48}
        height={48}
        className="w-5 h-5 flex-shrink-0"
      />
    )
  },
  { 
    label: "Billing", 
    href: "/billing", 
    icon: (
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/billing-Y6wfuqXGbZ7TIpFrhCoDQMjXShiPgI.png"
        alt=""
        width={48}
        height={48}
        className="w-5 h-5 flex-shrink-0"
      />
    )
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
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
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    router.push('/login')
  }

  return (
    <SidebarContainer open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between">
        <div className="flex flex-col flex-1">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-primary">ReviewMaster</h1>
          </div>

          <div className="flex flex-col gap-2">
            {navigation.map((link) => (
              <SidebarLink 
                key={link.href}
                link={link}
                className={cn(
                  pathname === link.href && "bg-primary/10 text-primary"
                )}
              />
            ))}
          </div>

          <div className="mt-auto space-y-6">
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
      </SidebarBody>
    </SidebarContainer>
  )
}
