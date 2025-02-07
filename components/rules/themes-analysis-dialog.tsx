import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Sparkles, ThumbsUp, ThumbsDown, Languages, Plus } from "lucide-react";
import { toast } from "sonner";
import { getCookie } from "@/lib/utils";

interface ThemesAnalysisDialogProps {
  hotelId: string;
  isOpen: boolean;
  onClose: () => void;
  onAnalysisStart: () => void;
  onAnalysisComplete: () => void;
  onRuleCreated: (rule: Rule) => void;
}

export function ThemesAnalysisDialog({
  hotelId,
  isOpen,
  onClose,
  onAnalysisStart,
  onAnalysisComplete,
  onRuleCreated
}: ThemesAnalysisDialogProps) {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const startAnalysis = async () => {
    try {
      setIsLoading(true);
      setError(null);
      onAnalysisStart?.();

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rules/analyze/${hotelId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error during analysis');
      }

      setAnalysis(data.analysis);
      toast.success(`Analyzed ${data.reviewsAnalyzed} reviews`);
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
      onAnalysisComplete?.();
    }
  };

  const handleCreateRule = (ruleConfig) => {
    onRuleCreated?.(ruleConfig);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Theme Analysis
          </DialogTitle>
        </DialogHeader>

        {!analysis && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="text-center space-y-3">
              <h3 className="text-lg font-medium text-gray-900">
                Let's analyze your reviews
              </h3>
              <p className="text-sm text-gray-500 max-w-md">
                We'll scan all your reviews to identify common themes and suggest automatic response rules.
                This operation will use 10 credits.
              </p>
            </div>
            <Button 
              onClick={startAnalysis} 
              className="w-48 gap-2 bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all"
            >
              <Sparkles className="h-4 w-4" />
              Start Analysis
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-gray-500">Analyzing your reviews...</p>
          </div>
        )}

        {analysis && (
          <div className="space-y-8">
            {/* Recurring Themes Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <ThumbsUp className="h-5 w-5 text-green-500" />
                Common Positive Themes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.recurringThemes.map((theme, i) => (
                  <div key={i} className="p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-gray-900">{theme.theme}</h4>
                      <span className="px-2 py-1 rounded-full text-xs bg-green-50 text-green-700 font-medium">
                        {theme.frequency} mentions
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 italic mb-4 line-clamp-2">
                      "{theme.exampleQuote}"
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full gap-2 hover:bg-green-50 hover:text-green-600"
                      onClick={() => handleCreateRule(theme.suggestedRule)}
                    >
                      <Plus className="h-4 w-4" />
                      Create Response Rule
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Common Issues Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <ThumbsDown className="h-5 w-5 text-red-500" />
                Common Issues
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.commonIssues.map((issue, i) => (
                  <div key={i} className="p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-gray-900">{issue.issue}</h4>
                      <span className="px-2 py-1 rounded-full text-xs bg-red-50 text-red-700 font-medium">
                        {issue.frequency} mentions
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 italic mb-4 line-clamp-2">
                      "{issue.exampleQuote}"
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full gap-2 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleCreateRule(issue.suggestedRule)}
                    >
                      <Plus className="h-4 w-4" />
                      Create Response Rule
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Language-based Rules */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Languages className="h-5 w-5 text-purple-500" />
                Language-based Rules
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.languageRules.map((rule, i) => (
                  <div key={i} className="p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-gray-900">
                        {rule.language === 'it' ? 'Italian' : 
                         rule.language === 'en' ? 'English' :
                         rule.language === 'de' ? 'German' :
                         rule.language === 'fr' ? 'French' : rule.language}
                      </h4>
                      <span className="px-2 py-1 rounded-full text-xs bg-purple-50 text-purple-700 font-medium">
                        {rule.frequency} reviews
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full gap-2 hover:bg-purple-50 hover:text-purple-600"
                      onClick={() => handleCreateRule(rule.suggestedRule)}
                    >
                      <Plus className="h-4 w-4" />
                      Create Language Rule
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}