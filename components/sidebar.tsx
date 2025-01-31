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
import { motion } from "framer-motion"

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
        className="w-9 h-9 flex-shrink-0"
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
        className="w-9 h-9 flex-shrink-0"
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
        className="w-9 h-9 flex-shrink-0"
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
        className="w-9 h-9 flex-shrink-0"
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
        className="w-9 h-9 flex-shrink-0"
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
      <SidebarBody className="justify-between bg-white shadow-lg">
        <div className="flex flex-col flex-1">
          <div className="flex flex-col gap-2 mt-4">
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

          <motion.div 
            className="mt-auto space-y-6"
            animate={{
              display: open ? "block" : "none",
              opacity: open ? 1 : 0
            }}
          >
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-600">Available Credits</span>
                <span className="text-primary">
                  {isLoading ? "..." : responseCredits.toFixed(1)}
                </span>
              </div>
              <Progress 
                value={isLoading ? 0 : (responseCredits / 100) * 100} 
                className="h-3 bg-primary/20"
              />
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
          </motion.div>
        </div>
      </SidebarBody>
    </SidebarContainer>
  )
}
