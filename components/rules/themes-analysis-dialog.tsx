import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Sparkles, ThumbsUp, ThumbsDown, Languages, Plus, CreditCard, Eye, MessageSquare, Star } from "lucide-react";
import { toast } from "sonner";
import { getCookie } from "cookies-next";
import { Rule } from "@/types/rule";
import CreditPurchaseSlider from "@/components/billing/CreditPurchaseSlider";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

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

// Estendi Rule per SuggestedRule
interface SuggestedRule extends Omit<Rule, 'hotelId'> {
  _id?: string;
  hotelId?: string;
  isActive: boolean;
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
  const [selectedRules, setSelectedRules] = useState<Set<string>>(new Set());
  const [previewRule, setPreviewRule] = useState<Rule | null>(null);

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

  const handleCreateRule = async (ruleConfig: SuggestedRule | Rule) => {
    try {
      const token = getCookie('token');
      const completeRule = {
        ...ruleConfig,
        hotelId,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(completeRule),
      });

      if (!response.ok) {
        throw new Error('Failed to create rule');
      }

      const savedRule = await response.json();
      onRuleCreated?.(savedRule);
      toast.success('Rule created successfully');
    } catch (error) {
      console.error('Error creating rule:', error);
      toast.error('Failed to create rule');
    }
  };

  const handleCreditPurchaseClose = () => {
    setShowCreditPurchase(false);
    setError(null);
  };

  const toggleRuleSelection = (rule: SuggestedRule | Rule) => {
    const ruleId = rule._id || `temp-${Math.random()}`;
    setSelectedRules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ruleId)) {
        newSet.delete(ruleId);
      } else {
        newSet.add(ruleId);
      }
      return newSet;
    });
  };

  const findRuleById = (ruleId: string): SuggestedRule | undefined => {
    if (!analysis) return undefined;

    // Cerca in tutte le categorie di regole
    const allRules = [
      ...(analysis.recurringThemes?.map(t => t.suggestedRule) || []),
      ...(analysis.commonIssues?.map(i => i.suggestedRule) || []),
      ...(analysis.languageRules?.map(l => l.suggestedRule) || []),
      ...(analysis.ratingBasedRules?.map(r => r.suggestedRule) || []),
      ...(analysis.complexRules?.map(c => c.suggestedRule) || [])
    ];

    const rule = allRules.find(rule => rule._id === ruleId || `temp-${Math.random()}` === ruleId);
    
    // Assicuriamoci che isActive sia sempre definito
    if (rule) {
      return {
        ...rule,
        isActive: rule.isActive ?? true // Se isActive è undefined, impostiamo a true
      };
    }
    
    return undefined;
  };

  const handleCreateSelectedRules = async () => {
    const selectedRulesArray = Array.from(selectedRules);
    for (const ruleId of selectedRulesArray) {
      const rule = findRuleById(ruleId);
      if (rule) {
        await handleCreateRule(rule);
      }
    }
    onClose();
  };

  const toggleRuleActive = (rule: SuggestedRule | Rule) => {
    const updatedRule = {
      ...rule,
      isActive: !(rule.isActive ?? true) // Default a true se undefined
    };
    handleCreateRule(updatedRule as Rule);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[100vw] h-[100vh] p-0">
        {/* Header Section */}
        <div className="sticky top-0 z-10 bg-white border-b px-8 py-6">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2 text-2xl font-semibold">
                  <Sparkles className="h-7 w-7 text-blue-500" />
                  Review Analysis
                </DialogTitle>
                <DialogDescription className="text-base mt-1">
                  AI-powered suggestions based on your review patterns
                </DialogDescription>
              </div>
              {selectedRules.size > 0 && (
                <Button
                  onClick={handleCreateSelectedRules}
                  className="h-12 px-6 gap-2 bg-primary text-primary-foreground shadow-lg rounded-xl"
                >
                  Create {selectedRules.size} Selected Rules
                </Button>
              )}
            </div>
          </DialogHeader>
        </div>

        {/* Main Content Area */}
        <div className="h-[calc(100vh-180px)] overflow-y-auto bg-gray-50">
          {!analysis && !isLoading && !error && (
            <div className="flex flex-col items-center justify-center h-full space-y-6 px-8">
              <div className="text-center space-y-4 max-w-lg">
                <Sparkles className="h-12 w-12 text-blue-500 mx-auto" />
                <h3 className="text-xl font-semibold">Start Review Analysis</h3>
                <p className="text-gray-600">
                  Our AI will analyze your reviews to identify patterns and suggest automated response rules.
                </p>
                <Button
                  onClick={startAnalysis}
                  className="h-12 px-8 gap-2 bg-primary text-primary-foreground shadow-lg rounded-xl"
                >
                  <Sparkles className="h-5 w-5" />
                  Start Analysis
                </Button>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-gray-600">Analyzing your reviews...</p>
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
                className="h-12 px-6 gap-2 bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all rounded-xl"
              >
                <CreditCard className="h-4 w-4" />
                Purchase Credits
              </Button>
            </div>
          )}

          {analysis && !isLoading && !error && (
            <div className="px-8 py-6 space-y-8">
              {/* Categories Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Recurring Themes Section */}
                {analysis.recurringThemes?.length > 0 && (
                  <div className="col-span-full">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-gray-100">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-blue-500" />
                          Recurring Themes
                        </h3>
                      </div>
                      <div className="p-6 grid gap-4 md:grid-cols-2">
                        {analysis.recurringThemes.map((theme, i) => (
                          <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={selectedRules.has(theme.suggestedRule._id || `temp-${i}`)}
                                  onCheckedChange={() => toggleRuleSelection({
                                    ...theme.suggestedRule,
                                    _id: theme.suggestedRule._id || `temp-${i}`,
                                    isActive: true
                                  })}
                                  className="h-5 w-5"
                                />
                                <h4 className="font-medium text-gray-900">{theme.theme}</h4>
                              </div>
                              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                {theme.frequency} mentions
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 italic">"{theme.exampleQuote}"</p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Response:</span> {theme.suggestedRule.response.text}
                            </p>
                            <div className="flex gap-2 pt-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="flex-1 gap-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl"
                                onClick={() => handleCreateRule(theme.suggestedRule)}
                              >
                                <Plus className="h-4 w-4" />
                                Create Rule
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="px-3 hover:bg-gray-50 rounded-xl"
                                onClick={() => setPreviewRule(theme.suggestedRule)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Similar structure for Rating, Language and Complex rules... */}
                {/* ... keeping the same pattern but with different colors and icons */}
              </div>
            </div>
          )}
        </div>

        {/* Preview Modal */}
        <Dialog open={!!previewRule} onOpenChange={() => setPreviewRule(null)}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Rule Preview</DialogTitle>
            </DialogHeader>
            {previewRule && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Condition</h4>
                  <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Field:</span> {previewRule.condition.field}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Operator:</span> {previewRule.condition.operator}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Value:</span>{' '}
                      {Array.isArray(previewRule.condition.value) 
                        ? previewRule.condition.value.join(', ')
                        : previewRule.condition.value}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Response</h4>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm whitespace-pre-wrap">{previewRule.response.text}</p>
                    <p className="text-sm mt-2">
                      <span className="font-medium">Style:</span> {previewRule.response.settings.style}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setPreviewRule(null)}
                className="rounded-xl"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  handleCreateRule(previewRule!);
                  setPreviewRule(null);
                }}
                className="rounded-xl bg-primary text-primary-foreground"
              >
                Create Rule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>

      <CreditPurchaseSlider 
        open={showCreditPurchase} 
        onClose={handleCreditPurchaseClose}
      />
    </Dialog>
  );
}