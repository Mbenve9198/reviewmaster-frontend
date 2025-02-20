"use client"

import { LogOut, Sparkles, MessageSquare, Star, Blocks, Building2, CreditCard, BarChart2, ScrollText, MessagesSquare, Bot, MessageCircle, Settings, Hotel, Share2 } from 'lucide-react'
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useUserStats } from "@/hooks/useUserStats"
import { useState, useEffect } from "react"
import { SidebarContainer, SidebarBody } from "@/components/ui/sidebar"
import { motion } from "framer-motion"
import CreditPurchaseSlider from "@/components/billing/CreditPurchaseSlider"

interface NavigationItem {
  label: string
  href?: string
  icon: React.ReactNode
  children?: NavigationItem[]
}

const navigation: NavigationItem[] = [
  { 
    label: "Reviews",
    icon: <Star className="w-5 h-5 text-gray-700 stroke-[1.5px]" />,
    children: [
      {
        label: "All Reviews",
        href: "/reviews",
        icon: <Star className="w-4 h-4 text-gray-700 stroke-[1.5px]" />
      },
      {
        label: "Manual Response",
        href: "/manual-response",
        icon: <MessageCircle className="w-4 h-4 text-gray-700 stroke-[1.5px]" />
      },
      {
        label: "Review Analysis",
        href: "/analyses",
        icon: <BarChart2 className="w-4 h-4 text-gray-700 stroke-[1.5px]" />
      },
      {
        label: "Response Rules",
        href: "/rules",
        icon: <ScrollText className="w-4 h-4 text-gray-700 stroke-[1.5px]" />
      }
    ]
  },
  { 
    label: "AI Concierge",
    icon: <Bot className="w-5 h-5 text-gray-700 stroke-[1.5px]" />,
    children: [
      {
        label: "Train Your AI",
        href: "/whatsapp-assistant",
        icon: <Bot className="w-4 h-4 text-gray-700 stroke-[1.5px]" />
      },
      {
        label: "AI Conversations",
        href: "/whatsapp-conversations",
        icon: <MessagesSquare className="w-4 h-4 text-gray-700 stroke-[1.5px]" />
      }
    ]
  },
  { 
    label: "Settings",
    icon: <Settings className="w-5 h-5 text-gray-700 stroke-[1.5px]" />,
    children: [
      {
        label: "Hotel Details",
        href: "/hotel-settings",
        icon: <Hotel className="w-4 h-4 text-gray-700 stroke-[1.5px]" />
      },
      {
        label: "Connect Platforms",
        href: "/integrations",
        icon: <Share2 className="w-4 h-4 text-gray-700 stroke-[1.5px]" />
      }
    ]
  },
  { 
    label: "Billing", 
    href: "/billing",
    icon: <CreditCard className="w-5 h-5 text-gray-700 stroke-[1.5px]" />
  }
]

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
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  
  useEffect(() => {
    if (!open) {
      setExpandedItems([])
    }
  }, [open])

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

  const toggleExpand = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
  }

  const renderNavigationItem = (item: NavigationItem) => {
    const isExpanded = expandedItems.includes(item.label)
    const hasChildren = item.children && item.children.length > 0

    return (
      <div key={item.label}>
        {hasChildren ? (
          <button
            onClick={() => toggleExpand(item.label)}
            className={cn(
              "flex items-center gap-3 px-3 h-12 w-full rounded-xl transition-colors",
              "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              "justify-between"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "transition-transform",
                !open && "scale-[1.4]"
              )}>
                {item.icon}
              </div>
              <motion.span
                animate={{
                  opacity: open ? 1 : 0,
                  width: open ? "auto" : 0
                }}
                className="whitespace-nowrap overflow-hidden"
              >
                {item.label}
              </motion.span>
            </div>
            {open && (
              <ChevronDown 
                className={cn(
                  "w-4 h-4 transition-transform",
                  isExpanded && "transform rotate-180"
                )}
              />
            )}
          </button>
        ) : (
          <Link
            href={item.href ?? '#'}
            className={cn(
              "flex items-center gap-3 px-3 h-12 w-full rounded-xl transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <div className={cn(
              "transition-transform",
              !open && "scale-[1.4]"
            )}>
              {item.icon}
            </div>
            <motion.span
              animate={{
                opacity: open ? 1 : 0,
                width: open ? "auto" : 0
              }}
              className="whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
          </Link>
        )}

        {hasChildren && isExpanded && item.children && open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="ml-4 mt-2 space-y-2"
          >
            {item.children.map(child => (
              <Link
                key={child.href}
                href={child.href ?? '#'}
                className={cn(
                  "flex items-center gap-3 px-3 h-10 rounded-xl transition-colors",
                  pathname === child.href
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <div className={cn(
                  "transition-transform",
                  !open && "scale-[1.4]"
                )}>
                  {child.icon}
                </div>
                <motion.span
                  animate={{
                    opacity: open ? 1 : 0,
                    width: open ? "auto" : 0
                  }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  {child.label}
                </motion.span>
              </Link>
            ))}
          </motion.div>
        )}
      </div>
    )
  }

  return (
    <>
      <SidebarContainer 
        open={open}
        setOpen={setOpen}
      >
        <SidebarBody>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <span className="text-4xl font-bold bg-gradient-to-b from-blue-800 to-blue-600 bg-clip-text text-transparent">
                R
              </span>
            </div>

            {/* Navigation */}
            <div className="space-y-4">
              {navigation.map(renderNavigationItem)}
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
