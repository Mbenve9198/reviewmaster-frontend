import { ChatBubbleMessage } from "@/components/ui/chat-bubble"
import ReactMarkdown from 'react-markdown'
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

interface FormattedMessageProps {
  content: string
  variant?: "sent" | "received"
}

export function FormattedMessage({ content, variant = "received" }: FormattedMessageProps) {
  return (
    <ChatBubbleMessage 
      variant={variant}
      className="text-lg rounded-2xl"
    >
      <div className="prose prose-blue max-w-none">
        <ReactMarkdown
          components={{
            // Sezioni principali
            h2: ({ children }) => (
              <div className="flex items-center gap-2 mt-6 mb-4 font-semibold text-lg text-gray-900 border-b pb-2">
                {children}
              </div>
            ),
            // Citazioni dalle recensioni
            blockquote: ({ children }) => (
              <div className="pl-4 border-l-2 border-blue-200 text-gray-600 my-2 italic">
                {children}
              </div>
            ),
            // Metriche e badge
            strong: ({ children }) => {
              if (!children) return null;
              const text = children.toString();
              if (text.includes('Frequenza:') || text.includes('Impatto:')) {
                return (
                  <Badge variant="outline" className="ml-2 font-normal">
                    {text}
                  </Badge>
                );
              }
              return <strong className="font-semibold text-gray-900">{children}</strong>;
            },
            // Card per problemi/soluzioni
            li: ({ children }) => (
              <div className="flex items-start gap-2 my-2">
                <span className="text-blue-500">•</span>
                <span>{children}</span>
              </div>
            )
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </ChatBubbleMessage>
  )
} 