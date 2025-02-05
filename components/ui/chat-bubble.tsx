"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MessageLoading } from "@/components/ui/message-loading";
import React, { useEffect, useState } from "react";

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
    if (!isLoading && children) {
      setDisplayText(""); // resetta il testo visualizzato per un nuovo messaggio
      let currentIndex = 0;
      const interval = setInterval(() => {
        setDisplayText((prev) => prev + children[currentIndex]);
        currentIndex++;
        if (currentIndex >= children.length) {
          clearInterval(interval);
        }
      }, 50); // questo delay (50ms) controlla la velocità di "digitazione"
      return () => clearInterval(interval);
    } else {
      setDisplayText("");
    }
  }, [children, isLoading]);

  if (isLoading) {
    // Visualizza un placeholder con cursore lampeggiante
    return (
      <div className={cn("text-sm font-medium", className)}>
        <span>Sto scrivendo</span>
        <span className="blinking-cursor">|</span>
      </div>
    );
  }

  return (
    <div className={cn("text-sm font-medium", className)}>
      {displayText}
    </div>
  );
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

