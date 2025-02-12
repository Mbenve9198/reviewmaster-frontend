"use client"

import { LogOut, Sparkles, MessageSquare, Star, Blocks, Building2, CreditCard, BarChart2, ScrollText } from 'lucide-react'
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useUserStats } from "@/hooks/useUserStats"
import { useState } from "react"
import { SidebarContainer, SidebarBody, SidebarLink } from "@/components/ui/sidebar"
import { motion } from "framer-motion"
import CreditPurchaseSlider from "@/components/billing/CreditPurchaseSlider"

const navigation = [
  { 
    label: "Manual Responses", 
    href: "/manual-response",
    icon: (
      <MessageSquare 
        className="w-6 h-6 text-gray-700 stroke-[1.5px]" 
      />
    )
  },
  { 
    label: "Reviews", 
    href: "/reviews",
    icon: (
      <Star 
        className="w-6 h-6 text-gray-700 stroke-[1.5px]" 
      />
    )
  },
  { 
    label: "Analyses",
    href: "/analyses",
    icon: (
      <BarChart2 
        className="w-6 h-6 text-gray-700 stroke-[1.5px]" 
      />
    )
  },
  { 
    label: "Rules",
    href: "/rules",
    icon: (
      <ScrollText 
        className="w-6 h-6 text-gray-700 stroke-[1.5px]" 
      />
    )
  },
  { 
    label: "Integrations", 
    href: "/integrations",
    icon: (
      <Blocks 
        className="w-6 h-6 text-gray-700 stroke-[1.5px]" 
      />
    )
  },
  { 
    label: "Hotel Settings", 
    href: "/hotel-settings",
    icon: (
      <Building2 
        className="w-6 h-6 text-gray-700 stroke-[1.5px]" 
      />
    )
  },
  { 
    label: "Billing", 
    href: "/billing",
    icon: (
      <CreditCard 
        className="w-6 h-6 text-gray-700 stroke-[1.5px]" 
      />
    )
  }
]

interface SidebarLinkProps {
  link: string
  active?: boolean
  className?: string
  children: React.ReactNode
}

export function SidebarLink({ link, active, className, children }: SidebarLinkProps) {
  return (
    <Link
      href={link}
      className={cn(
        "flex items-center justify-center w-12 h-12 rounded-xl transition-colors",
        active 
          ? "bg-primary text-primary-foreground shadow-sm" 
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        className
      )}
    >
      {children}
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [showCreditSlider, setShowCreditSlider] = useState(false)
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
    <>
      <SidebarContainer open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between bg-white shadow-lg">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <span className="text-4xl font-bold bg-gradient-to-b from-blue-800 to-blue-600 bg-clip-text text-transparent">
                R
              </span>
            </div>

            {/* Navigation */}
            <div className="space-y-4">
              {navigation.map((item) => (
                <SidebarLink 
                  key={item.href}
                  link={item.href}
                  active={pathname === item.href}
                >
                  {item.icon}
                </SidebarLink>
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
                    {isLoading ? "..." : responseCredits >= 1000 
                      ? "1000+" 
                      : responseCredits.toFixed(1)
                    }
                  </span>
                </div>
                <Progress 
                  value={responseCredits >= 1000 
                    ? 100 
                    : (responseCredits / 1000) * 100
                  } 
                  max={100}
                  className="h-3 bg-primary/20"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreditSlider(true)}
                  className={cn(
                    "w-full mt-2 text-sm border-primary/20 hover:bg-primary/5 flex items-center justify-center gap-2",
                    responseCredits < 20 
                      ? "text-red-500 border-red-200 hover:bg-red-50" 
                      : "text-primary"
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  {responseCredits < 20 
                    ? "Credits Running Low!" 
                    : "Add More Credits"
                  }
                </Button>
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

      <CreditPurchaseSlider 
        open={showCreditSlider}
        onClose={() => setShowCreditSlider(false)}
      />
    </>
  )
}
