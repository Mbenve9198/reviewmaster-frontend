import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Sparkles, ThumbsUp, ThumbsDown, Languages, Plus, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { getCookie } from "cookies-next";
import { Rule } from "@/types/rule";
import CreditPurchaseSlider from "@/components/billing/CreditPurchaseSlider";

interface ThemesAnalysisDialogProps {
  hotelId: string;
  isOpen: boolean;
  onClose: () => void;
  onAnalysisStart: () => void;
  onAnalysisComplete: () => void;
  onRuleCreated: (rule: Rule) => void;
}

interface AnalysisResponse {
  analysis: {
    recurringThemes: Array<{
      theme: string;
      frequency: number;
      exampleQuote: string;
      suggestedRule: Rule;
    }>;
    commonIssues: Array<{
      issue: string;
      frequency: number;
      exampleQuote: string;
      suggestedRule: Rule;
    }>;
    languageRules: Array<{
      language: string;
      frequency: number;
      suggestedRule: Rule;
    }>;
    ratingBasedRules: Array<{
      ratingCondition: string;
      frequency: number;
      exampleQuote: string;
      suggestedRule: Rule;
    }>;
    complexRules: Array<{
      scenario: string;
      frequency: number;
      exampleQuote: string;
      suggestedRule: Rule;
    }>;
  };
  reviewsAnalyzed: number;
}

interface ErrorResponse {
  message: string;
  code?: string;
  type?: string;
}

// Type guard to check if response is an error
function isErrorResponse(data: any): data is ErrorResponse {
  return 'message' in data;
}

export function ThemesAnalysisDialog({
  hotelId,
  isOpen,
  onClose,
  onAnalysisStart,
  onAnalysisComplete,
  onRuleCreated
}: ThemesAnalysisDialogProps) {
  const [analysis, setAnalysis] = useState<AnalysisResponse['analysis'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreditPurchase, setShowCreditPurchase] = useState(false);

  const startAnalysis = async () => {
    try {
      setIsLoading(true);
      setError(null);
      onAnalysisStart?.();

      const token = getCookie('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rules/analyze/${hotelId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (isErrorResponse(data)) {
          if (data.type === 'NO_CREDITS') {
            setShowCreditPurchase(true);
            throw new Error('Insufficient credits. Please purchase more credits to analyze reviews.');
          }
          throw new Error(data.message);
        }
        throw new Error('Error during analysis');
      }

      setAnalysis(data.analysis.analysis);
      toast.success(`Analyzed ${data.reviewsAnalyzed} reviews`);
    } catch (err) {
      console.error('Analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      onAnalysisComplete?.();
    }
  };

  const handleCreateRule = (ruleConfig: Rule) => {
    onRuleCreated?.(ruleConfig);
    onClose();
  };

  const handleCreditPurchaseClose = () => {
    setShowCreditPurchase(false);
    setError(null);
  };

  return (
    <>
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

          {error && error.includes('credits') && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <AlertCircle className="h-12 w-12 text-yellow-500" />
              <div className="text-center space-y-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Insufficient Credits
                </h3>
                <p className="text-sm text-gray-500 max-w-md">
                  You need at least 10 credits to perform this analysis.
                </p>
              </div>
              <Button 
                onClick={() => setShowCreditPurchase(true)}
                className="w-48 gap-2 bg-primary text-primary-foreground"
              >
                <CreditCard className="h-4 w-4" />
                Purchase Credits
              </Button>
            </div>
          )}

          {analysis && (
            <div className="space-y-8">
              {/* Recurring Themes */}
              {analysis.recurringThemes?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-500" />
                    Recurring Themes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.recurringThemes.map((theme, i) => (
                      <div key={i} className="p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-gray-900">{theme.theme}</h4>
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 font-medium">
                            {theme.frequency} mentions
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 italic mb-4 line-clamp-2">
                          "{theme.exampleQuote}"
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full gap-2 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => handleCreateRule(theme.suggestedRule)}
                        >
                          <Plus className="h-4 w-4" />
                          Create Theme Rule
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rating Based Rules */}
              {analysis.ratingBasedRules?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <ThumbsUp className="h-5 w-5 text-green-500" />
                    Rating Based Rules
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.ratingBasedRules.map((rule, i) => (
                      <div key={i} className="p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-gray-900">{rule.ratingCondition}</h4>
                          <span className="px-2 py-1 rounded-full text-xs bg-green-50 text-green-700 font-medium">
                            {rule.frequency} reviews
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 italic mb-4 line-clamp-2">
                          "{rule.exampleQuote}"
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full gap-2 hover:bg-green-50 hover:text-green-600"
                          onClick={() => handleCreateRule(rule.suggestedRule)}
                        >
                          <Plus className="h-4 w-4" />
                          Create Rating Rule
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Complex Rules */}
              {analysis.complexRules?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <ThumbsDown className="h-5 w-5 text-orange-500" />
                    Complex Scenarios
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.complexRules.map((rule, i) => (
                      <div key={i} className="p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-gray-900">{rule.scenario}</h4>
                          <span className="px-2 py-1 rounded-full text-xs bg-orange-50 text-orange-700 font-medium">
                            {rule.frequency} matches
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 italic mb-4 line-clamp-2">
                          "{rule.exampleQuote}"
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full gap-2 hover:bg-orange-50 hover:text-orange-600"
                          onClick={() => handleCreateRule(rule.suggestedRule)}
                        >
                          <Plus className="h-4 w-4" />
                          Create Complex Rule
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Language Rules */}
              {analysis.languageRules?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Languages className="h-5 w-5 text-purple-500" />
                    Language Rules
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
              )}

              {/* Mostra un messaggio se non ci sono regole */}
              {(!analysis.recurringThemes?.length && 
                !analysis.ratingBasedRules?.length && 
                !analysis.complexRules?.length && 
                !analysis.languageRules?.length) && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No rules were generated from the analysis. Try analyzing more reviews.</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CreditPurchaseSlider 
        open={showCreditPurchase} 
        onClose={handleCreditPurchaseClose}
      />
    </>
  );
}