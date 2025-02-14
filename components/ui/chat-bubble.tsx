"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MessageLoading } from "@/components/ui/message-loading";
import { useEffect, useState } from "react";
import { Loader2, Bot } from "lucide-react"

interface ChatBubbleProps {
  variant?: "sent" | "received"
  layout?: "default" | "ai"
  className?: string
  children: React.ReactNode
}

export function ChatBubble({
  variant = "received",
  layout = "default",
  className,
  children,
}: ChatBubbleProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 mb-4",
        variant === "sent" && "flex-row-reverse",
        className,
      )}
    >
      {children}
    </div>
  )
}

interface ChatBubbleMessageProps {
  variant?: "sent" | "received"
  isLoading?: boolean
  className?: string
  children?: React.ReactNode
}

export function ChatBubbleMessage({
  variant = "received",
  isLoading,
  className,
  children,
}: ChatBubbleMessageProps) {
  const baseStyle = "text-sm whitespace-pre-wrap p-3 rounded-2xl"
  const variantStyle =
    variant === "sent"
      ? "bg-primary text-primary-foreground"
      : "bg-gray-100 text-gray-700"

  if (isLoading) {
    return (
      <div className={cn(
        "flex items-start gap-3", 
        baseStyle, 
        variantStyle, 
        "min-w-[200px]",
        className
      )}>
        <Bot className="h-5 w-5 text-blue-500 mt-0.5" />
        <div className="flex flex-col gap-2">
          <div className="font-medium">Thinking...</div>
          <div className="flex gap-1">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]"></div>
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]"></div>
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce"></div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className={cn(baseStyle, variantStyle, className)}>
      {children}
    </div>
  )
}

interface ChatBubbleAvatarProps {
  src?: string
  fallback?: string
  className?: string
  children?: React.ReactNode
}

export function ChatBubbleAvatar({
  src,
  fallback = "AI",
  className,
  children,
}: ChatBubbleAvatarProps) {
  return (
    <Avatar className={cn("h-8 w-8", className)}>
      {children || (src && <AvatarImage src={src} />)}
      {!children && <AvatarFallback>{fallback}</AvatarFallback>}
    </Avatar>
  )
}

interface ChatBubbleActionProps {
  icon?: React.ReactNode
  onClick?: () => void
  className?: string
}

export function ChatBubbleAction({
  icon,
  onClick,
  className,
}: ChatBubbleActionProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-6 w-6", className)}
      onClick={onClick}
    >
      {icon}
    </Button>
  )
}

export function ChatBubbleActionWrapper({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("flex items-center gap-1 mt-2", className)}>
      {children}
    </div>
  )
}

