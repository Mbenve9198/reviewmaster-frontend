import { ChatBubbleMessage } from "@/components/ui/chat-bubble"
import AnalysisDashboard from "./AnalysisDashboard"
import ReactMarkdown from 'react-markdown'
import { Button } from "@/components/ui/button"
import { TrendingUp, Wrench } from "lucide-react"
import { toast } from "react-hot-toast"
import { api } from "@/lib/api"

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

const AnalysisDashboard = ({ data }: { data: AnalysisData }) => {
  const handleStrengthAction = async (strength: any) => {
    try {
      const response = await api.analytics.getValuePlan(strength);
      toast.success("Piano di valorizzazione generato con successo");
      // Qui puoi gestire la risposta, magari mostrandola in un modal o in un nuovo componente
    } catch (error) {
      toast.error("Errore nella generazione del piano");
    }
  };

  const handleIssueAction = async (issue: any) => {
    try {
      const response = await api.analytics.getSolutionPlan(issue);
      toast.success("Piano di risoluzione generato con successo");
      // Qui puoi gestire la risposta
    } catch (error) {
      toast.error("Errore nella generazione del piano");
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* ... existing meta section ... */}

      {/* Strengths Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-green-700">Key Strengths</h3>
        {data.strengths.map((strength, index) => (
          <div key={index} className="bg-green-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-green-800">{strength.title}</h4>
                <div className="text-sm text-green-600">
                  Impact: {strength.impact} • {strength.mentions} mentions
                </div>
              </div>
              <Button
                onClick={() => handleStrengthAction(strength)}
                variant="outline"
                className="bg-green-100 hover:bg-green-200 text-green-700 border-green-200"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Maximize Value
              </Button>
            </div>
            <blockquote className="text-sm italic text-gray-600 border-l-4 border-green-200 pl-3">
              "{strength.quote}"
            </blockquote>
            <p className="text-sm text-gray-600">{strength.details}</p>
          </div>
        ))}
      </div>

      {/* Issues Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-red-700">Critical Issues</h3>
        {data.issues.map((issue, index) => (
          <div key={index} className="bg-red-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-red-800">{issue.title}</h4>
                <div className="text-sm text-red-600">
                  Priority: {issue.priority} • {issue.mentions} mentions
                </div>
              </div>
              <Button
                onClick={() => handleIssueAction(issue)}
                variant="outline"
                className="bg-red-100 hover:bg-red-200 text-red-700 border-red-200"
              >
                <Wrench className="w-4 h-4 mr-2" />
                Create Action Plan
              </Button>
            </div>
            <blockquote className="text-sm italic text-gray-600 border-l-4 border-red-200 pl-3">
              "{issue.quote}"
            </blockquote>
            <p className="text-sm text-gray-600">{issue.details}</p>
            {issue.solution && (
              <div className="bg-white rounded p-3 mt-2">
                <div className="font-medium text-red-800 mb-2">{issue.solution.title}</div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Timeline:</span>
                    <div>{issue.solution.timeline}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Cost:</span>
                    <div>{issue.solution.cost}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">ROI:</span>
                    <div>{issue.solution.roi}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ... rest of the existing sections ... */}
    </div>
  );
};