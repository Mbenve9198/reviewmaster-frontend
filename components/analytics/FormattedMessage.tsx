import { ChatBubbleMessage } from "@/components/ui/chat-bubble"
import ReactMarkdown from 'react-markdown'
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

interface FormattedMessageProps {
  content: string
  variant?: "sent" | "received"
}

export function FormattedMessage({ content, variant = "received" }: FormattedMessageProps) {
  // Rimuovi i tag detailed_analysis se presenti
  const cleanContent = content.replace(/<detailed_analysis>[\s\S]*?<\/detailed_analysis>/g, '');
  
  // Verifica se è un'analisi strutturata o una risposta di follow-up
  const isStructuredAnalysis = cleanContent.includes("✦") || 
                              cleanContent.includes("PERFORMANCE ANALYSIS") ||
                              cleanContent.includes("━━━━");

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

  // Per l'analisi strutturata, usa il nuovo stile grafico
  return (
    <ChatBubbleMessage 
      variant={variant}
      className="text-lg rounded-2xl"
    >
      <div className="prose prose-blue max-w-none">
        <ReactMarkdown
          components={{
            // Titolo principale con stile speciale
            h1: ({ children }) => {
              const text = children.toString();
              if (text.includes('✦')) {
                return (
                  <div className="text-xl font-bold mb-4 pb-2 border-b-2 border-gray-200">
                    {text}
                  </div>
                );
              }
              return <h1>{children}</h1>;
            },
            
            // Header delle sezioni con linee decorative
            h2: ({ children }) => {
              const text = children.toString();
              if (text.includes('━━━')) {
                return (
                  <div className="mt-6 mb-4">
                    <div className="font-semibold text-lg text-gray-900">{text.replace(/━/g, '')}</div>
                    <div className="border-b-2 border-gray-200 mt-1"></div>
                  </div>
                );
              }
              return (
                <div className="flex items-center gap-2 mt-6 mb-4 font-semibold text-lg text-gray-900">
                  {children}
                </div>
              );
            },

            // Box per le soluzioni raccomandate
            pre: ({ children }) => {
              const text = children.toString();
              if (text.includes('┌') && text.includes('┐')) {
                return (
                  <Card className="bg-gray-50 p-4 my-4 border-2">
                    <div className="font-medium mb-2">
                      {text.split('\n').map((line, i) => (
                        <div key={i} className={
                          line.includes('┌') || line.includes('┐') || 
                          line.includes('└') || line.includes('┘') ? 'hidden' : 
                          line.includes('├') || line.includes('┤') ? 'border-b pb-2 mb-2' : ''
                        }>
                          {line.replace(/[├┤│]/g, '')}
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              }
              return <pre>{children}</pre>;
            },

            // Statistiche e metriche
            strong: ({ children }) => {
              if (!children) return null;
              const text = children.toString();
              
              // Badge per priorità e impatto
              if (text.includes('⚠️') || text.includes('HIGH') || text.includes('MEDIUM') || text.includes('LOW')) {
                return (
                  <Badge variant="outline" className={`ml-2 font-normal ${
                    text.includes('HIGH') ? 'bg-red-50 text-red-700 border-red-200' :
                    text.includes('MEDIUM') ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    {text}
                  </Badge>
                );
              }

              // Costi
              if (text.includes('€')) {
                return (
                  <Badge variant="outline" className="ml-2 font-normal bg-blue-50 text-blue-700 border-blue-200">
                    {text}
                  </Badge>
                );
              }

              // ROI e altri indicatori numerici
              if (text.includes('%') || text.match(/[+-]\d+(\.\d+)?/)) {
                return (
                  <span className="text-blue-600 font-semibold">
                    {text}
                  </span>
                );
              }

              return <strong className="font-semibold text-gray-900">{children}</strong>;
            },

            // Lista con icone e spaziatura migliorata
            li: ({ children }) => {
              const text = children.toString();
              if (text.startsWith('▸')) {
                return (
                  <div className="flex items-start gap-2 my-2 text-blue-600">
                    <span className="mt-1">▸</span>
                    <span>{text.substring(1)}</span>
                  </div>
                );
              }
              return (
                <div className="flex items-start gap-2 my-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <span>{text}</span>
                </div>
              );
            },

            // Citazioni dalle recensioni
            blockquote: ({ children }) => (
              <div className="pl-4 border-l-2 border-blue-200 text-gray-600 my-2 italic bg-blue-50 p-2 rounded-r">
                {children}
              </div>
            ),
          }}
        >
          {cleanContent}
        </ReactMarkdown>
      </div>
    </ChatBubbleMessage>
  );
}