import { ChatBubbleMessage } from "@/components/ui/chat-bubble"
import ReactMarkdown from 'react-markdown'
import { Badge } from "@/components/ui/badge"

interface FormattedMessageProps {
  content: string
  variant?: "sent" | "received"
}

export function FormattedMessage({ content, variant = "received" }: FormattedMessageProps) {
  // Rimuovi i tag detailed_analysis se presenti
  const cleanContent = content.replace(/<detailed_analysis>[\s\S]*?<\/detailed_analysis>/g, '');
  
  // Verifica se è un'analisi strutturata o una risposta di follow-up
  const isStructuredAnalysis = cleanContent.includes("====================") || 
                              cleanContent.includes("📊 PANORAMICA") ||
                              cleanContent.includes("⚠️ PROBLEMI CHIAVE") ||
                              cleanContent.includes("💪 PUNTI DI FORZA");

  // Per le risposte di follow-up, usa uno stile più semplice
  if (!isStructuredAnalysis) {
    return (
      <ChatBubbleMessage 
        variant={variant}
        className="text-lg rounded-2xl"
      >
        <div className="prose prose-blue max-w-none text-gray-800">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-3">{children}</p>,
              blockquote: ({ children }) => (
                <div className="pl-4 border-l-2 border-gray-200 text-gray-600 my-2 italic">
                  {children}
                </div>
              ),
              strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
              li: ({ children }) => (
                <div className="flex items-start gap-2 my-1">
                  <span className="text-gray-400 mt-1">•</span>
                  <span>{children}</span>
                </div>
              )
            }}
          >
            {cleanContent}
          </ReactMarkdown>
        </div>
      </ChatBubbleMessage>
    );
  }

  // Per l'analisi strutturata, mantieni la formattazione originale
  return (
    <ChatBubbleMessage 
      variant={variant}
      className="text-lg rounded-2xl"
    >
      <div className="prose prose-blue max-w-none">
        <ReactMarkdown
          components={{
            h2: ({ children }) => (
              <div className="flex items-center gap-2 mt-6 mb-4 font-semibold text-lg text-gray-900 border-b pb-2">
                {children}
              </div>
            ),
            blockquote: ({ children }) => (
              <div className="pl-4 border-l-2 border-blue-200 text-gray-600 my-2 italic">
                {children}
              </div>
            ),
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
            li: ({ children }) => (
              <div className="flex items-start gap-2 my-2">
                <span className="text-blue-500">•</span>
                <span>{children}</span>
              </div>
            )
          }}
        >
          {cleanContent}
        </ReactMarkdown>
      </div>
    </ChatBubbleMessage>
  );
}