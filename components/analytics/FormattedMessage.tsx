import { ChatBubbleMessage } from "@/components/ui/chat-bubble"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp, Minus } from "lucide-react"

interface FormattedMessageProps {
  content: string
  variant?: "sent" | "received"
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

const StatsCard = ({ label, value, trend }: { label: string; value: string; trend?: string }) => (
  <div className="text-center p-3 bg-gray-50 rounded-lg">
    <div className="text-sm text-gray-500 mb-1">{label}</div>
    <div className="text-xl font-bold">{value}</div>
    {trend && (
      <div className={`text-sm flex items-center justify-center gap-1 ${
        trend.startsWith('+') ? 'text-green-600' : 
        trend.startsWith('-') ? 'text-red-600' : 
        'text-gray-600'
      }`}>
        {trend.startsWith('+') ? <ArrowUp className="w-3 h-3" /> :
         trend.startsWith('-') ? <ArrowDown className="w-3 h-3" /> :
         <Minus className="w-3 h-3" />}
        {trend}
      </div>
    )}
  </div>
);

const StrengthCard = ({ strength }: { strength: AnalysisData['strengths'][0] }) => (
  <Card className="bg-gradient-to-br from-green-50 to-green-100/50 p-4 space-y-2">
    <div className="flex justify-between items-start">
      <h3 className="font-semibold text-green-800">{strength.title}</h3>
      <Badge variant="outline" className="bg-white">+{strength.impact} impact</Badge>
    </div>
    <blockquote className="border-l-2 border-green-200 pl-3 py-1 text-sm italic text-gray-600">
      "{strength.quote}"
    </blockquote>
    <div className="text-sm text-gray-600">{strength.details}</div>
    {strength.marketingTips.length > 0 && (
      <div className="border-t border-green-200/50 pt-2 mt-2 space-y-1">
        <div className="text-sm font-medium text-green-800">Marketing Opportunities:</div>
        {strength.marketingTips.map((tip, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span>{tip.action}</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white">{tip.cost}</Badge>
              <Badge variant="outline" className="bg-white">ROI: {tip.roi}</Badge>
            </div>
          </div>
        ))}
      </div>
    )}
  </Card>
);

const IssueCard = ({ issue }: { issue: AnalysisData['issues'][0] }) => (
  <Card className="bg-gradient-to-br from-red-50 to-red-100/50 p-4 space-y-2">
    <div className="flex justify-between items-start">
      <h3 className="font-semibold text-red-800">{issue.title}</h3>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={`
          ${issue.priority === 'HIGH' ? 'bg-red-100 text-red-800 border-red-200' :
            issue.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
            'bg-green-100 text-green-800 border-green-200'}
        `}>
          {issue.priority}
        </Badge>
        <Badge variant="outline" className="bg-white">{issue.impact} impact</Badge>
      </div>
    </div>
    <blockquote className="border-l-2 border-red-200 pl-3 py-1 text-sm italic text-gray-600">
      "{issue.quote}"
    </blockquote>
    <div className="text-sm text-gray-600">{issue.details}</div>
    <Card className="bg-white p-3">
      <div className="font-medium text-red-800 mb-2">{issue.solution.title}</div>
      <div className="grid grid-cols-3 gap-2 text-sm mb-3">
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-gray-500 text-xs mb-1">Timeline</div>
          <div>{issue.solution.timeline}</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-gray-500 text-xs mb-1">Cost</div>
          <div>{issue.solution.cost}</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-gray-500 text-xs mb-1">ROI</div>
          <div>{issue.solution.roi}</div>
        </div>
      </div>
      <div className="space-y-1">
        {issue.solution.steps.map((step, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <span className="text-red-400 mt-1">•</span>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </Card>
  </Card>
);

const QuickWinsCard = ({ quickWins }: { quickWins: AnalysisData['quickWins'] }) => (
  <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-4">
    <h3 className="font-semibold text-purple-800 mb-3">Quick Wins</h3>
    <div className="space-y-2">
      {quickWins.map((win, i) => (
        <div key={i} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-purple-400">▸</span>
            <span>{win.action}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white">{win.timeline}</Badge>
            <Badge variant="outline" className="bg-white">{win.cost}</Badge>
          </div>
        </div>
      ))}
    </div>
  </Card>
);

export function FormattedMessage({ content, variant = "received" }: FormattedMessageProps) {
  // Verifica se il contenuto è JSON
  let analysisData: AnalysisData | null = null;
  try {
    const parsed = JSON.parse(content);
    if (parsed.meta && parsed.sentiment && parsed.strengths) {
      analysisData = parsed;
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

  const formatMentions = (mentions: number, total: number) => {
    return `mentioned in ${mentions} reviews on ${total} analyzed reviews (${Math.round((mentions/total) * 100)}%)`;
  };

  // Rendering dell'analisi strutturata
  return (
    <ChatBubbleMessage 
      variant={variant}
      className="rounded-2xl overflow-hidden p-0"
    >
      <div className="space-y-6 p-4">
        {/* Header con meta info */}
        <div className="text-center pb-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">{analysisData.meta.hotelName}</h2>
          <p className="text-sm text-gray-500 mt-1">
            Analysis based on {analysisData.meta.reviewCount} reviews from {analysisData.meta.platforms}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4">
          <StatsCard 
            label="Average Rating" 
            value={analysisData.meta.avgRating.toString()}
          />
          <StatsCard 
            label="Excellent" 
            value={analysisData.sentiment.excellent}
          />
          <StatsCard 
            label="Average" 
            value={analysisData.sentiment.average}
          />
          <StatsCard 
            label="Needs Work" 
            value={analysisData.sentiment.needsImprovement}
          />
        </div>

        {/* Strengths Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Key Strengths
          </h3>
          <div className="space-y-4">
            {analysisData.strengths.map((strength, i) => (
              <div key={i} className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{strength.title}</h4>
                  <span className="text-sm text-gray-600">
                    {formatMentions(strength.mentions, analysisData.meta.reviewCount)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{strength.details}</p>
                <blockquote className="text-sm italic text-gray-500 border-l-4 border-green-200 pl-3">
                  "{strength.quote}"
                </blockquote>
              </div>
            ))}
          </div>
        </div>

        {/* Issues Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Critical Issues
          </h3>
          <div className="space-y-4">
            {analysisData.issues.map((issue, i) => (
              <div key={i} className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{issue.title}</h4>
                  <span className="text-sm text-gray-600">
                    {formatMentions(issue.mentions, analysisData.meta.reviewCount)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{issue.details}</p>
                <blockquote className="text-sm italic text-gray-500 border-l-4 border-red-200 pl-3">
                  "{issue.quote}"
                </blockquote>
                {issue.solution && (
                  <div className="mt-3 pt-3 border-t border-red-100">
                    <p className="text-sm font-medium text-gray-900">Proposed Solution:</p>
                    <p className="text-sm text-gray-600">{issue.solution.title}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Wins */}
        {analysisData.quickWins.length > 0 && (
          <QuickWinsCard quickWins={analysisData.quickWins} />
        )}

        {/* Trends Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Recent Trends
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {analysisData.trends.map((trend, i) => (
              <StatsCard
                key={i}
                label={trend.metric}
                value={trend.change}
                trend={trend.change}
              />
            ))}
          </div>
        </div>
      </div>
    </ChatBubbleMessage>
  );
}