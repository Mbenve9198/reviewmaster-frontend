import { useEffect, useRef, useState } from "react"

interface AutoScrollHookResult {
  scrollRef: React.RefObject<HTMLDivElement>;
  isAtBottom: boolean;
  autoScrollEnabled: boolean;
  scrollToBottom: () => void;
  disableAutoScroll: () => void;
}

export function useAutoScroll(options: {
  smooth?: boolean;
  content?: React.ReactNode;
}): AutoScrollHookResult {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true)

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const scrollOptions = options.smooth ? { behavior: 'smooth' as const } : undefined
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      setIsAtBottom(true)
      setAutoScrollEnabled(true)
    }
  }

  const disableAutoScroll = () => {
    if (scrollRef.current) {
      const isBottom = scrollRef.current.scrollHeight - scrollRef.current.scrollTop === scrollRef.current.clientHeight
      setIsAtBottom(isBottom)
      setAutoScrollEnabled(isBottom)
    }
  }

  useEffect(() => {
    if (autoScrollEnabled && scrollRef.current) {
      scrollToBottom()
    }
  }, [options.content])

  return {
    scrollRef,
    isAtBottom,
    autoScrollEnabled,
    scrollToBottom,
    disableAutoScroll
  }
} 