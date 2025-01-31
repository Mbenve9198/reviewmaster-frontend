import { ChatBubbleMessage } from "@/components/ui/chat-bubble"
import ReactMarkdown from 'react-markdown'
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

interface FormattedMessageProps {
  content: string
  variant?: "sent" | "received"
}

export function FormattedMessage({ content, variant = "received" }: FormattedMessageProps) {
  // Verifica se il contenuto è un'analisi strutturata o una risposta di follow-up
  const isStructuredAnalysis = content.includes("====================") || 
                              content.includes("📊 PANORAMICA") || 
                              content.includes("⚠️ PROBLEMI CHIAVE") ||
                              content.includes("💪 PUNTI DI FORZA");

  if (!isStructuredAnalysis) {
    // Per i messaggi di follow-up, applica uno stile più semplice e conversazionale
    return (
      <ChatBubbleMessage 
        variant={variant}
        className="text-lg rounded-2xl"
      >
        <div className="prose prose-blue max-w-none">
          <ReactMarkdown
            components={{
              // Stile base per il testo normale
              p: ({ children }) => <p className="text-gray-800">{children}</p>,
              // Manteniamo solo alcuni stili di base per eventuali elementi di formattazione
              strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
              em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
              // Citazioni più semplici per i messaggi di follow-up
              blockquote: ({ children }) => (
                <div className="pl-4 border-l-2 border-gray-200 text-gray-600 my-2 italic">
                  {children}
                </div>
              ),
              // Liste più semplici
              li: ({ children }) => (
                <div className="flex items-start gap-2 my-1">
                  <span className="text-gray-400">•</span>
                  <span>{children}</span>
                </div>
              )
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </ChatBubbleMessage>
    );
  }

  // Per l'analisi strutturata, manteniamo la formattazione originale completa
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