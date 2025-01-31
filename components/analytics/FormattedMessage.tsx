import { ChatBubbleMessage } from "@/components/ui/chat-bubble"
import ReactMarkdown from 'react-markdown'
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ReactNode } from "react"

interface FormattedMessageProps {
  content: string
  variant?: "sent" | "received"
}

const childrenToString = (children: ReactNode): string => {
  if (children === null || children === undefined) return '';
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return children.toString();
  if (Array.isArray(children)) return children.join('');
  return '';
};

export function FormattedMessage({ content, variant = "received" }: FormattedMessageProps) {
  const cleanContent = content.replace(/<detailed_analysis>[\s\S]*?<\/detailed_analysis>/g, '');
  
  const isStructuredAnalysis = cleanContent.includes("✦") || 
                              cleanContent.includes("PERFORMANCE ANALYSIS") ||
                              cleanContent.includes("━━━");

  if (!isStructuredAnalysis) {
    return (
      <ChatBubbleMessage 
        variant={variant}
        className="text-lg rounded-2xl whitespace-pre-wrap break-words"
      >
        <div className="prose prose-blue max-w-none text-gray-800 overflow-hidden">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2">{childrenToString(children)}</p>,
              blockquote: ({ children }) => (
                <div className="pl-4 border-l-2 border-gray-200 text-gray-600 my-2 italic">
                  {children}
                </div>
              ),
              strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
              li: ({ children }) => (
                <div className="flex items-start gap-2 my-0.5">
                  <span className="text-gray-400 mt-0.5 flex-shrink-0">•</span>
                  <span className="flex-1">{children}</span>
                </div>
              ),
              ul: ({ children }) => (
                <div className="space-y-0.5 my-1">
                  {children}
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

  return (
    <ChatBubbleMessage 
      variant={variant}
      className="text-lg rounded-2xl w-full overflow-hidden"
    >
      <div className="prose prose-blue max-w-none break-words w-full overflow-x-hidden">
        <ReactMarkdown
          components={{
            // Titolo principale con logo hotel
            h1: ({ children }) => {
              const text = childrenToString(children);
              if (text.includes('✦')) {
                return (
                  <div className="flex flex-col gap-2 mb-6">
                    <div className="text-xl font-bold text-gray-900">
                      {text.split('|')[0].trim()}
                    </div>
                    <div className="text-lg text-gray-600">
                      {text.split('|')[1].trim()}
                    </div>
                  </div>
                );
              }
              return <h1 className="text-xl font-bold mb-4">{children}</h1>;
            },

            // Sezioni principali
            h2: ({ children }) => {
              const text = childrenToString(children);
              const isPositive = text.includes('STRENGTHS') || text.includes('GROWTH');
              const isNegative = text.includes('IMPROVEMENT');
              
              return (
                <div className="mt-6 mb-4">
                  <h2 className={`font-bold text-lg ${
                    isPositive ? 'text-green-600' : 
                    isNegative ? 'text-red-600' : 
                    'text-gray-900'
                  }`}>
                    {text.replace(/━+/g, '').trim()}
                  </h2>
                  <div className={`border-b-2 mt-1 ${
                    isPositive ? 'border-green-200' : 
                    isNegative ? 'border-red-200' : 
                    'border-gray-200'
                  }`}></div>
                </div>
              );
            },

            // Sottotitoli e altre sezioni
            h3: ({ children }) => {
              const text = childrenToString(children);
              const isPositive = text.includes('STRENGTH') || text.includes('positive');
              const isNegative = text.includes('ISSUE') || text.includes('negative');
              
              return (
                <h3 className={`font-bold mt-4 mb-2 ${
                  isPositive ? 'text-green-600' : 
                  isNegative ? 'text-red-600' : 
                  'text-gray-900'
                }`}>
                  {children}
                </h3>
              );
            },

            // Box per le soluzioni
            pre: ({ children }) => {
              const text = childrenToString(children);
              if (text.includes('┌') && text.includes('┐')) {
                const lines = text.split('\n').filter(line => 
                  !line.includes('┌') && !line.includes('┐') && 
                  !line.includes('└') && !line.includes('┘')
                );
                return (
                  <Card className="bg-gray-50 p-4 my-4 overflow-hidden">
                    <div className="space-y-2 break-words">
                      {lines.map((line, i) => (
                        <div key={i} className={`
                          ${line.includes('├') || line.includes('┤') 
                            ? 'font-semibold border-b pb-2' 
                            : 'text-gray-600'}
                          whitespace-pre-wrap break-words
                        `}>
                          {line.replace(/[├┤│]/g, '').trim()}
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              }
              return <pre className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap break-words">{children}</pre>;
            },

            // Metriche e statistiche
            strong: ({ children }) => {
              if (!children) return null;
              const text = childrenToString(children);
              
              // Badge per priorità
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

              // Badge per costi
              if (text.includes('€')) {
                return (
                  <Badge variant="outline" className="ml-2 font-normal bg-blue-50 text-blue-700 border-blue-200">
                    {text}
                  </Badge>
                );
              }

              // Numeri positivi/negativi
              if (text.match(/[+]\d+/)) {
                return <span className="text-green-600 font-medium">{text}</span>;
              }
              if (text.match(/[-]\d+/)) {
                return <span className="text-red-600 font-medium">{text}</span>;
              }

              return <strong className="font-semibold text-gray-900">{text}</strong>;
            },

            // Liste con icone
            li: ({ children }) => (
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-gray-400 flex-shrink-0">•</span>
                <span className="flex-1 -mt-1">{children}</span>
              </div>
            ),

            // Citazioni
            blockquote: ({ children }) => (
              <div className="pl-4 border-l-2 border-blue-200 text-gray-600 my-2 italic bg-blue-50 p-2 rounded-r">
                {children}
              </div>
            ),

            // Titoli numerati (es. "① Noise Insulation")
            p: ({ children }) => {
              const text = childrenToString(children);
              if (text.match(/^[①②③]/)) {
                return (
                  <p className="font-bold text-lg text-gray-900 mb-2">
                    {text}
                  </p>
                );
              }
              return <p className="mb-1">{text}</p>;
            },

            // Liste più compatte per i follow-up
            ul: ({ children }) => (
              <div className="space-y-0 my-1">
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