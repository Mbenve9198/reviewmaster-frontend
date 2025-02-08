import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Sparkles, ThumbsUp, ThumbsDown, Languages, Plus, CreditCard, Eye, MessageSquare, Star, ChevronRight, Badge, Check } from "lucide-react";
import { toast } from "sonner";
import { getCookie } from "cookies-next";
import { Rule } from "@/types/rule";
import CreditPurchaseSlider from "@/components/billing/CreditPurchaseSlider";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [field, setField] = useState<FieldKey>('content.rating');
  const [operator, setOperator] = useState<OperatorKey>('>');
  const [value, setValue] = useState<string>('3');
  const [responseStyle, setResponseStyle] = useState<ResponseStyle>('professional');

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
    const ruleId = rule._id || `temp-${rule.name.toLowerCase().replace(/\s+/g, '-')}`;
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

    // Raccoglie tutte le regole da tutte le categorie
    const allRules = [
      ...(analysis.recurringThemes?.map(t => ({
        ...t.suggestedRule,
        _id: t.suggestedRule._id || `temp-${t.theme.toLowerCase().replace(/\s+/g, '-')}`,
        isActive: true
      })) || []),
      ...(analysis.commonIssues?.map(i => ({
        ...i.suggestedRule,
        _id: i.suggestedRule._id || `temp-${i.issue.toLowerCase().replace(/\s+/g, '-')}`,
        isActive: true
      })) || []),
      ...(analysis.languageRules?.map(l => ({
        ...l.suggestedRule,
        _id: l.suggestedRule._id || `temp-${l.language.toLowerCase().replace(/\s+/g, '-')}`,
        isActive: true
      })) || []),
      ...(analysis.ratingBasedRules?.map(r => ({
        ...r.suggestedRule,
        _id: r.suggestedRule._id || `temp-${r.ratingCondition.toLowerCase().replace(/\s+/g, '-')}`,
        isActive: true
      })) || []),
      ...(analysis.complexRules?.map(c => ({
        ...c.suggestedRule,
        _id: c.suggestedRule._id || `temp-${c.scenario.toLowerCase().replace(/\s+/g, '-')}`,
        isActive: true
      })) || [])
    ];

    // Prima cerca per ID esatto
    let rule = allRules.find(r => r._id === ruleId);
    
    // Se non trova, cerca per ID temporaneo basato sul nome
    if (!rule) {
      rule = allRules.find(r => {
        const tempId = `temp-${r.name.toLowerCase().replace(/\s+/g, '-')}`;
        return tempId === ruleId;
      });
    }

    return rule;
  };

  const handleCreateSelectedRules = async () => {
    try {
      const selectedRulesArray = Array.from(selectedRules);
      const createdRules = [];
      const errors = [];

      for (const ruleId of selectedRulesArray) {
        const rule = findRuleById(ruleId);
        if (rule) {
          try {
            const token = getCookie('token');
            const completeRule = {
              ...rule,
              hotelId,
              isActive: true
            };

            // Rimuovi _id temporaneo
            delete completeRule._id;

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rules`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify(completeRule),
            });

            if (!response.ok) {
              throw new Error(`Failed to create rule ${ruleId}`);
            }

            const savedRule = await response.json();
            createdRules.push(savedRule);
            onRuleCreated?.(savedRule);
          } catch (error) {
            errors.push(ruleId);
            console.error(`Error creating rule ${ruleId}:`, error);
          }
        }
      }

      if (createdRules.length > 0) {
        toast.success(`Successfully created ${createdRules.length} rules`);
        if (errors.length > 0) {
          toast.error(`Failed to create ${errors.length} rules`);
        }
        setSelectedRules(new Set()); // Reset selected rules
        onClose();
      } else {
        toast.error('Failed to create any rules');
      }
    } catch (error) {
      console.error('Error creating rules:', error);
      toast.error('Failed to create rules');
    }
  };

  const toggleRuleActive = (rule: SuggestedRule | Rule) => {
    const updatedRule = {
      ...rule,
      isActive: !(rule.isActive ?? true) // Default a true se undefined
    };
    handleCreateRule(updatedRule as Rule);
  };

  const handleOperatorChange = (value: OperatorKey) => {
    setOperator(value);
  };

  const handleValueChange = (value: string) => {
    setValue(value);
  };

  const handleResponseStyleChange = (value: ResponseStyle) => {
    setResponseStyle(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[95vh] p-0 bg-white rounded-xl flex flex-col">
        {/* Header */}
        <div className="shrink-0 sticky top-0 z-10 bg-white border-b px-6 py-4">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold">
                    Review Analysis
                  </DialogTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    AI-powered suggestions based on your review patterns
                  </p>
                </div>
              </div>
              {selectedRules.size > 0 && (
                <div className="flex items-center gap-1.5 h-7 px-3 bg-gray-100 text-gray-700 rounded-full text-sm">
                  <Check className="h-3.5 w-3.5" />
                  <span>{selectedRules.size} selected</span>
                </div>
              )}
            </div>
          </DialogHeader>
        </div>

        {/* Main Content - Con scroll indipendente */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {!analysis && !isLoading && !error && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="text-center space-y-4 max-w-lg">
                <div className="p-3 rounded-xl bg-blue-50 w-fit mx-auto">
                  <Sparkles className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold">Start Review Analysis</h3>
                <p className="text-gray-600">
                  Our AI will analyze your reviews to identify patterns and suggest automated response rules.
                </p>
                <Button
                  onClick={startAnalysis}
                  className="h-11 px-6 gap-2 bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all rounded-xl"
                >
                  <Sparkles className="h-4 w-4" />
                  Start Analysis
                </Button>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
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
            <div className="space-y-8">
              {analysis.recurringThemes?.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    <Label className="text-lg font-medium text-gray-900">
                      Recurring Themes
                    </Label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.recurringThemes.map((theme, i) => (
                      <div 
                        key={i} 
                        className="group p-4 bg-gray-50 hover:bg-gray-100/80 rounded-lg transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedRules.has(theme.suggestedRule._id || `temp-${i}`)}
                            onCheckedChange={() => toggleRuleSelection({
                              ...theme.suggestedRule,
                              _id: theme.suggestedRule._id || `temp-${i}`,
                              isActive: true
                            })}
                            className="h-4 w-4 mt-1"
                          />
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <h4 className="font-medium text-gray-900">{theme.theme}</h4>
                              <div className="shrink-0 px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-sm">
                                {theme.frequency} mentions
                              </div>
                            </div>
                            
                            <blockquote className="text-sm text-gray-600 italic border-l-2 border-gray-200 pl-3">
                              "{theme.exampleQuote}"
                            </blockquote>
                            
                            <p className="line-clamp-2 text-sm text-gray-600">
                              <span className="font-medium">Response:</span> {theme.suggestedRule.response.text}
                            </p>

                            <div className="flex gap-2 pt-2">
                              <Button 
                                size="sm"
                                className="flex-1 gap-1.5 bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all rounded-xl"
                                onClick={() => handleCreateRule(theme.suggestedRule)}
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Create Rule
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="px-2.5 rounded-xl"
                                onClick={() => setPreviewRule(theme.suggestedRule)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 sticky bottom-0 bg-white border-t px-6 py-4 mt-auto">
          <div className="flex justify-between items-center">
            <Button 
              variant="ghost"
              onClick={onClose}
              className="h-10 rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateSelectedRules}
              disabled={isLoading || selectedRules.size === 0}
              className="h-10 px-6 gap-2 bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all rounded-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating Rules...</span>
                </>
              ) : (
                <>
                  <span>Create Selected Rules</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Preview Modal */}
      <Dialog open={!!previewRule} onOpenChange={() => setPreviewRule(null)}>
        <DialogContent className="sm:max-w-xl p-6 rounded-xl">
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Eye className="h-5 w-5 text-gray-500" />
              Rule Preview
            </div>
          </DialogHeader>

          {previewRule && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">When</Label>
                <div className="bg-gray-50 p-3 rounded-lg space-y-1.5">
                  <p className="text-sm flex items-center justify-between">
                    <span className="text-gray-600">Field</span>
                    <span className="font-medium">{previewRule.condition.field}</span>
                  </p>
                  <p className="text-sm flex items-center justify-between">
                    <span className="text-gray-600">Operator</span>
                    <span className="font-medium">{previewRule.condition.operator}</span>
                  </p>
                  <p className="text-sm flex items-center justify-between">
                    <span className="text-gray-600">Value</span>
                    <span className="font-medium">
                      {Array.isArray(previewRule.condition.value) 
                        ? previewRule.condition.value.join(', ')
                        : previewRule.condition.value}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-700">Response</Label>
                <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                  <p className="text-sm whitespace-pre-wrap">{previewRule.response.text}</p>
                  <div className="pt-2 border-t">
                    <p className="text-sm flex items-center justify-between">
                      <span className="text-gray-600">Style</span>
                      <div className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-sm w-fit">
                        {previewRule.response.settings.style}
                      </div>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setPreviewRule(null)}
                  className="h-10 rounded-xl"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleCreateRule(previewRule);
                    setPreviewRule(null);
                  }}
                  className="h-10 px-6 gap-2 bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all rounded-xl"
                >
                  <Plus className="h-4 w-4" />
                  Create Rule
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CreditPurchaseSlider 
        open={showCreditPurchase} 
        onClose={handleCreditPurchaseClose}
      />
    </Dialog>
  );
}