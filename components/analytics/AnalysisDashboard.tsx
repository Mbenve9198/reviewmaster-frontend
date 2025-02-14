import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, ArrowRight, Star, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Wrench } from 'lucide-react';
import { Button } from "@/components/ui/button";

// Helper per il colore del trend
const getTrendColor = (value: string): string => {
  if (value.startsWith('+')) return 'text-green-600';
  if (value.startsWith('-')) return 'text-red-600';
  return 'text-gray-600';
};

const TrendIndicator = ({ value }: { value: string }) => {
  if (value.startsWith('+')) return <TrendingUp className="w-4 h-4 text-green-600" />;
  if (value.startsWith('-')) return <TrendingDown className="w-4 h-4 text-red-600" />;
  return <ArrowRight className="w-4 h-4 text-gray-600" />;
};

const StatCard = ({ label, value, trend }: { label: string, value: string | number, trend?: string }) => (
  <Card className="p-4 bg-white">
    <div className="flex flex-col">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-2xl font-bold">{value}</span>
        {trend && (
          <span className={`flex items-center gap-1 text-sm ${getTrendColor(trend)}`}>
            <TrendIndicator value={trend} />
            {trend}
          </span>
        )}
      </div>
    </div>
  </Card>
);

interface Strength {
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
}

interface Issue {
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
}

interface QuickWin {
  action: string
  timeline: string
  cost: string
  impact: string
}

const StrengthCard = ({ strength, onStrengthAction }: { strength: Strength, onStrengthAction?: (strength: any) => Promise<void> }) => (
  <Card className="overflow-hidden bg-gradient-to-br from-green-50 to-green-100/50">
    <div className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-green-800">{strength.title}</h3>
        </div>
        <Badge variant="outline" className="bg-white text-green-700">
          Impact: {strength.impact}
        </Badge>
      </div>
      
      <blockquote className="pl-4 my-3 border-l-2 border-green-300 italic text-gray-600">
        "{strength.quote}"
      </blockquote>
      
      <p className="text-gray-600 mb-3">{strength.details}</p>
      
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Badge variant="outline" className="bg-white">
          {strength.mentions} mentions
        </Badge>
      </div>

      <div className="mt-3 space-y-1">
        {onStrengthAction && (
          <Button
            onClick={() => onStrengthAction(strength)}
            variant="outline"
            className="bg-green-100 hover:bg-green-200 text-green-700 border-green-200"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Maximize Value
          </Button>
        )}
      </div>
    </div>
  </Card>
);

const IssueCard = ({ issue, onIssueAction }: { issue: Issue, onIssueAction?: (issue: any) => Promise<void> }) => (
  <Card className="overflow-hidden bg-gradient-to-br from-red-50 to-red-100/50">
    <div className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="font-semibold text-red-800">{issue.title}</h3>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-white text-red-700">
            Priority: {issue.priority}
          </Badge>
          <Badge variant="outline" className="bg-white text-red-700">
            Impact: {issue.impact}
          </Badge>
        </div>
      </div>

      <blockquote className="pl-4 my-3 border-l-2 border-red-300 italic text-gray-600">
        "{issue.quote}"
      </blockquote>

      <p className="text-gray-600 mb-3">{issue.details}</p>

      {issue.solution && (
        <Card className="bg-white mt-3">
          <div className="p-3">
            <h4 className="font-medium text-red-800 mb-2">{issue.solution.title}</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center p-2 bg-gray-50 rounded">
                <span className="text-gray-500 text-xs block mb-1">Timeline</span>
                <span>{issue.solution.timeline}</span>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <span className="text-gray-500 text-xs block mb-1">Cost</span>
                <span>{issue.solution.cost}</span>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <span className="text-gray-500 text-xs block mb-1">ROI</span>
                <span>{issue.solution.roi}</span>
              </div>
            </div>
            {issue.solution.steps && (
              <div className="mt-3 space-y-1">
                {issue.solution.steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-red-500" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="mt-3 space-y-1">
        {onIssueAction && (
          <Button
            onClick={() => onIssueAction(issue)}
            variant="outline"
            className="bg-red-100 hover:bg-red-200 text-red-700 border-red-200"
          >
            <Wrench className="w-4 h-4 mr-2" />
            Create Action Plan
          </Button>
        )}
      </div>
    </div>
  </Card>
);

const QuickWinCard = ({ win }: { win: QuickWin }) => (
  <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-purple-600">▸</span>
        <span className="font-medium">{win.action}</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-white">{win.timeline}</Badge>
        <Badge variant="outline" className="bg-white">{win.cost}</Badge>
      </div>
    </div>
  </Card>
);

interface AnalysisDashboardProps {
  data: {
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
      distribution?: {
        rating5: string
        rating4: string
        rating3: string
        rating2: string
        rating1: string
      }
    }
    strengths: Strength[]
    issues: Issue[]
    quickWins?: QuickWin[]
    trends: Array<{
      metric: string
      change: string
      period: string
    }>
  }
  onStrengthAction?: (strength: any) => Promise<void>
  onIssueAction?: (issue: any) => Promise<void>
}

const AnalysisDashboard = ({ data, onStrengthAction, onIssueAction }: AnalysisDashboardProps) => {
  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{data.meta.hotelName}</h1>
          <p className="text-gray-600">
            Analysis based on {data.meta.reviewCount} reviews from {data.meta.platforms}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <StatCard 
            label="Average Rating" 
            value={data.meta.avgRating} 
          />
          <StatCard 
            label="Excellent" 
            value={data.sentiment.excellent} 
          />
          <StatCard 
            label="Average" 
            value={data.sentiment.average} 
          />
          <StatCard 
            label="Needs Work" 
            value={data.sentiment.needsImprovement} 
          />
        </div>
      </div>

      {/* Strengths Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Strengths</h2>
        <div className="grid gap-4">
          {data.strengths.map((strength, i) => (
            <div key={i} className="bg-green-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-green-800">{strength.title}</h4>
                  <div className="text-sm text-green-600">
                    Impact: {strength.impact} • {strength.mentions} mentions
                  </div>
                </div>
                {onStrengthAction && (
                  <Button
                    onClick={() => onStrengthAction(strength)}
                    variant="outline"
                    className="bg-green-100 hover:bg-green-200 text-green-700 border-green-200"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Maximize Value
                  </Button>
                )}
              </div>
              <blockquote className="pl-4 my-3 border-l-2 border-green-300 italic text-gray-600">
                "{strength.quote}"
              </blockquote>
              <p className="text-gray-600 mb-3">{strength.details}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Issues Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Critical Issues</h2>
        <div className="grid gap-4">
          {data.issues.map((issue, i) => (
            <div key={i} className="bg-red-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-red-800">{issue.title}</h4>
                  <div className="text-sm text-red-600">
                    Priority: {issue.priority} • {issue.mentions} mentions
                  </div>
                </div>
                {onIssueAction && (
                  <Button
                    onClick={() => onIssueAction(issue)}
                    variant="outline"
                    className="bg-red-100 hover:bg-red-200 text-red-700 border-red-200"
                  >
                    <Wrench className="w-4 h-4 mr-2" />
                    Create Action Plan
                  </Button>
                )}
              </div>
              <blockquote className="pl-4 my-3 border-l-2 border-red-300 italic text-gray-600">
                "{issue.quote}"
              </blockquote>
              <p className="text-gray-600 mb-3">{issue.details}</p>

              {issue.solution && (
                <Card className="bg-white mt-3">
                  <div className="p-3">
                    <h5 className="font-medium text-red-800 mb-2">{issue.solution.title}</h5>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <span className="text-gray-500 text-xs block mb-1">Timeline</span>
                        <span>{issue.solution.timeline}</span>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <span className="text-gray-500 text-xs block mb-1">Cost</span>
                        <span>{issue.solution.cost}</span>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <span className="text-gray-500 text-xs block mb-1">ROI</span>
                        <span>{issue.solution.roi}</span>
                      </div>
                    </div>
                    {issue.solution.steps && (
                      <div className="mt-3 space-y-1">
                        {issue.solution.steps.map((step, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-red-500" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Wins Section */}
      {data.quickWins && data.quickWins.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Wins</h2>
          <div className="grid gap-3">
            {data.quickWins.map((win, i) => (
              <QuickWinCard key={i} win={win} />
            ))}
          </div>
        </div>
      )}

      {/* Trends Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Trends</h2>
        <div className="grid grid-cols-3 gap-4">
          {data.trends.map((trend, i) => (
            <StatCard
              key={i}
              label={trend.metric}
              value={trend.change}
              trend={trend.change}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalysisDashboard;