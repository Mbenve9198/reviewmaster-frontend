import { ChatBubbleMessage } from "@/components/ui/chat-bubble"
import AnalysisDashboard from "./AnalysisDashboard"

interface FormattedMessageProps {
  content: string
  variant?: "sent" | "received"
  isLoading?: boolean
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
}

export function FormattedMessage({ content, variant = "received", isLoading = false }: FormattedMessageProps) {
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
    // Non è JSON, lo trattiamo come testo normale
  }

  // Se non è JSON strutturato, mostra come messaggio normale
  if (!analysisData) {
    return (
      <ChatBubbleMessage 
        variant={variant}
        className="text-base rounded-2xl whitespace-pre-wrap"
      >
        {content}
      </ChatBubbleMessage>
    );
  }

  // Rendering dell'analisi strutturata
  return (
    <ChatBubbleMessage 
      variant={variant}
      className="rounded-2xl overflow-hidden p-0"
    >
      <AnalysisDashboard data={analysisData} />
    </ChatBubbleMessage>
  );
}