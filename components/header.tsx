import { Bell, Crown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function Header() {
  return (
    <header className="h-16 border-b bg-white px-6 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Crown className="w-5 h-5 text-yellow-400" />
          <span className="font-medium">Level 5</span>
        </div>
        <div className="h-4 w-px bg-gray-200" />
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-xs font-medium text-white">500</span>
          </div>
          <span className="text-sm text-gray-600">points</span>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
        </Button>
        <Button variant="ghost" size="icon">
          <Image
            src="/placeholder.svg"
            alt="Avatar"
            width={32}
            height={32}
            className="rounded-full"
          />
        </Button>
      </div>
    </header>
  )
}

