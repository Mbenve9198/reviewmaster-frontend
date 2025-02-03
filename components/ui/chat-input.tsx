import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>{}

const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ className, ...props }, ref) => (
    <Textarea
      autoComplete="off"
      ref={ref}
      name="message"
      className={cn(
        "min-h-[48px] max-h-[200px] px-4 py-3 bg-white text-base",
        "placeholder:text-muted-foreground focus-visible:outline-none",
        "focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "w-full rounded-xl border-2 border-gray-200",
        "resize-none overflow-hidden",
        className,
      )}
      onInput={(e) => {
        const target = e.target as HTMLTextAreaElement;
        target.style.height = 'auto';
        target.style.height = `${target.scrollHeight}px`;
      }}
      {...props}
    />
  ),
);
ChatInput.displayName = "ChatInput";

export { ChatInput };

