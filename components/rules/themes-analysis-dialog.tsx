import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Sparkles, ThumbsUp, ThumbsDown, Languages, Plus, CreditCard, Eye } from "lucide-react";
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

// Definisci prima le interfacce di base
interface RuleCondition {
  field: string;
  operator: string;
  value: string | string[] | number;
}

interface RuleResponse {
  text: string;
  settings: {
    style: string;
  };
}

interface BaseRule {
  name: string;
  condition: RuleCondition;
  response: RuleResponse;
}

// Estendi BaseRule per SuggestedRule
interface SuggestedRule extends BaseRule {
  _id?: string;
  isActive: boolean;
}

// Estendi BaseRule per Rule (dal database)
interface Rule extends BaseRule {
  _id: string;
  isActive?: boolean; // Ora è opzionale come nel tipo originale
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

  const handleCreateRule = (ruleConfig: Rule) => {
    onRuleCreated?.(ruleConfig);
    onClose();
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

  const handleCreateSelectedRules = () => {
    const selectedRulesArray = Array.from(selectedRules);
    // Implementa la logica per creare multiple regole
    selectedRulesArray.forEach(ruleId => {
      // Trova la regola corrispondente e creala
      // ...
    });
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
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl bg-white p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
              <Sparkles className="h-6 w-6 text-blue-500" />
              Theme Analysis
            </DialogTitle>
            <DialogDescription>
              Analyze your reviews to automatically generate response rules based on common themes and patterns.
            </DialogDescription>
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
                className="h-12 px-6 gap-2 bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all rounded-xl"
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
                className="h-12 px-6 gap-2 bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all rounded-xl"
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
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-blue-500" />
                      Recurring Themes
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl"
                      onClick={() => {
                        analysis.recurringThemes.forEach(theme => {
                          toggleRuleSelection(theme.suggestedRule as SuggestedRule);
                        });
                      }}
                    >
                      Select All Themes
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.recurringThemes.map((theme, i) => (
                      <div key={i} className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedRules.has(theme.suggestedRule._id || `temp-${i}`)}
                            onCheckedChange={() => toggleRuleSelection(theme.suggestedRule as SuggestedRule)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                <h4 className="font-medium text-gray-900">{theme.theme}</h4>
                                <Switch
                                  checked={theme.suggestedRule.isActive ?? true}
                                  onCheckedChange={() => toggleRuleActive(theme.suggestedRule as SuggestedRule)}
                                  className="data-[state=checked]:bg-green-500"
                                />
                              </div>
                              <span className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 font-medium">
                                {theme.frequency} mentions
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 italic mb-4 line-clamp-2">
                              "{theme.exampleQuote}"
                            </p>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="flex-1 gap-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl"
                                onClick={() => setPreviewRule(theme.suggestedRule)}
                              >
                                <Eye className="h-4 w-4" />
                                Preview
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="flex-1 gap-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl"
                                onClick={() => handleCreateRule(theme.suggestedRule)}
                              >
                                <Plus className="h-4 w-4" />
                                Create Rule
                              </Button>
                            </div>
                          </div>
                        </div>
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
                      <div key={i} className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
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
                          className="w-full gap-2 hover:bg-green-50 hover:text-green-600 rounded-xl"
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
                      <div key={i} className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
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
                          className="w-full gap-2 hover:bg-orange-50 hover:text-orange-600 rounded-xl"
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
                      <div key={i} className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
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
                          className="w-full gap-2 hover:bg-purple-50 hover:text-purple-600 rounded-xl"
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

      <Dialog open={!!previewRule} onOpenChange={() => setPreviewRule(null)}>
        <DialogContent className="sm:max-w-[600px] bg-white">
          <DialogHeader>
            <DialogTitle>Rule Preview</DialogTitle>
            <DialogDescription>
              Review the complete configuration of this rule before creating it.
            </DialogDescription>
          </DialogHeader>
          
          {previewRule && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Name</h4>
                  <p className="text-gray-900">{previewRule.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {previewRule.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <Switch
                    checked={previewRule.isActive}
                    onCheckedChange={() => {
                      setPreviewRule(prev => prev ? {
                        ...prev,
                        isActive: !prev.isActive
                      } : null);
                    }}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">Condition</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
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
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{previewRule.response.text}</p>
                  <p className="text-sm mt-2">
                    <span className="font-medium">Style:</span> {previewRule.response.settings.style}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
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

      {selectedRules.size > 0 && (
        <div className="sticky bottom-0 bg-white border-t p-4 mt-8 -mx-6 -mb-6 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {selectedRules.size} rules selected
          </p>
          <Button
            onClick={handleCreateSelectedRules}
            className="rounded-xl bg-primary text-primary-foreground"
          >
            Create {selectedRules.size} Rules
          </Button>
        </div>
      )}
    </>
  );
}