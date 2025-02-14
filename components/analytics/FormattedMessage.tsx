import { ChatBubbleMessage } from "@/components/ui/chat-bubble"
import AnalysisDashboard from "./AnalysisDashboard"
import ReactMarkdown from 'react-markdown'
import { Button } from "@/components/ui/button"
import { TrendingUp, Wrench } from "lucide-react"
import { toast } from "react-hot-toast"
import { api } from "@/services/api"
import { useEffect } from "react"

interface FormattedMessageProps {
  content: string
  variant?: "sent" | "received"
  isLoading?: boolean
  onMessage?: (message: string) => void
  onSuggestions?: (suggestions: string[]) => void
}

interface AnalysisData {
  meta: {
    hotelName: string
    reviewCount: number
    avgRating: number
    platforms: string
  }
  sentiment: {
    excellent: string
    average: string
    needsImprovement: string
    distribution: {
      rating5: string
      rating4: string
      rating3: string
      rating2: string
      rating1: string
    }
  }
  strengths: Array<{
    title: string
    impact: string
    mentions: number
    quote: string
    details: string
    marketingTips: Array<{
      action: string
      cost: string
      roi: string
    }>
  }>
  issues: Array<{
    title: string
    priority: "HIGH" | "MEDIUM" | "LOW"
    impact: string
    mentions: number
    quote: string
    details: string
    solution: {
      title: string
      timeline: string
      cost: string
      roi: string
      steps: string[]
    }
  }>
  quickWins: Array<{
    action: string
    timeline: string
    cost: string
    impact: string
  }>
  trends: Array<{
    metric: string
    change: string
    period: string
  }>
  suggestions?: string[]
}

export function FormattedMessage({ 
  content, 
  variant = "received", 
  isLoading = false,
  onMessage,
  onSuggestions 
}: FormattedMessageProps) {
  // Se è in caricamento, mostra il feedback (spinner, ecc.)
  if (isLoading) {
    return (
      <ChatBubbleMessage
        variant={variant}
        isLoading
        className="text-base rounded-2xl whitespace-pre-wrap"
        aria-busy="true"
      >
        {content}
      </ChatBubbleMessage>
    );
  }

  // Verifica se il contenuto è JSON
  let analysisData: AnalysisData | null = null;
  try {
    if (typeof content === 'string') {
      const parsed = JSON.parse(content);
      if (parsed.meta && parsed.sentiment && parsed.strengths) {
        analysisData = parsed;
      }
    } else {
      analysisData = content;
    }
  } catch (e) {
    // Non è JSON, lo trattiamo come testo markdown
  }

  // Se non è JSON strutturato, mostra come messaggio markdown
  if (!analysisData) {
    return (
      <ChatBubbleMessage 
        variant={variant}
        className="text-base rounded-2xl prose prose-blue max-w-none"
      >
        <ReactMarkdown
          components={{
            // Personalizza lo stile dei vari elementi markdown
            strong: ({ children }) => (
              <span className="font-semibold text-blue-600">{children}</span>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-4 my-2 space-y-1">{children}</ul>
            ),
            li: ({ children }) => (
              <li className="text-gray-700">{children}</li>
            ),
            p: ({ children }) => (
              <p className="mb-4 last:mb-0">{children}</p>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-blue-200 pl-4 my-2 text-gray-600 italic">
                {children}
              </blockquote>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </ChatBubbleMessage>
    );
  }

  // Quando viene parsato il JSON dell'analisi, estraiamo e inviamo i suggerimenti
  useEffect(() => {
    if (analysisData?.suggestions) {
      onSuggestions?.(analysisData.suggestions);
    }
  }, [analysisData, onSuggestions]);

  // Rendering dell'analisi strutturata
  return (
    <ChatBubbleMessage 
      variant={variant}
      className="rounded-2xl overflow-hidden p-0"
    >
      <AnalysisDashboard 
        data={analysisData} 
        onStrengthAction={async (strength) => {
          try {
            const response = await api.analytics.getValuePlan(strength);
            toast.success("Piano di valorizzazione generato con successo");
            onMessage?.(`Come possiamo massimizzare il valore di "${strength.title}"?`);
          } catch (error) {
            toast.error("Errore nella generazione del piano");
          }
        }}
        onIssueAction={async (issue) => {
          try {
            const response = await api.analytics.getSolutionPlan(issue);
            toast.success("Piano di risoluzione generato con successo");
            if (onMessage) {
              onMessage(response.message || `Come possiamo risolvere il problema "${issue.title}"?\n\n${JSON.stringify(response.plan, null, 2)}`);
            }
          } catch (error: any) {
            if (error.message === 'QUOTA_EXCEEDED') {
              toast.error("Quota API esaurita. Riprova più tardi.");
            } else {
              toast.error("Errore nella generazione del piano");
            }
          }
        }}
        onMessage={onMessage}
      />
    </ChatBubbleMessage>
  );
}