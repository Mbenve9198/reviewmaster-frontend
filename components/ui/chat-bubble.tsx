"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MessageLoading } from "@/components/ui/message-loading";
import { useEffect, useState } from "react";

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
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    // Se il children è una stringa, applica l'effetto digitazione
    if (!isLoading && typeof children === "string") {
      setDisplayText(""); // resetta il testo visualizzato per un nuovo messaggio
      let currentIndex = 0;
      const interval = setInterval(() => {
        setDisplayText((prev) => prev + children[currentIndex]);
        currentIndex++;
        if (currentIndex >= children.length) {
          clearInterval(interval);
        }
      }, 50); // delay per l'effetto "digitazione"
      return () => clearInterval(interval);
    }
  }, [children, isLoading]);

  if (isLoading) {
    // Visualizza un placeholder con cursore lampeggiante
    return (
      <div className={cn("text-sm text-gray-600", className)}>
        <span>Sto scrivendo</span>
        <span className="blinking-cursor">|</span>
      </div>
    );
  }
  
  // Se children è una stringa, mostra il testo animato; altrimenti, renderizza direttamente children
  if (typeof children === "string") {
    return <div className={cn("text-sm text-gray-600", className)}>{displayText}</div>;
  }

  return <div className={cn("text-sm text-gray-600", className)}>{children}</div>;
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

