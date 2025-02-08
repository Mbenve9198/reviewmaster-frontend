import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Rule } from "@/types/rule";
import { 
  MessageSquare, 
  Star, 
  Languages, 
  ChevronRight, 
  Sparkles,
  XCircle,
  Loader2,
  Info
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { getCookie } from "cookies-next";

type FieldOption = {
  value: FieldKey;
  label: string;
};

type OperatorOption = {
  value: string;
  label: string;
};

type FieldKey = 'content.text' | 'content.rating' | 'content.language';

type ResponseStyle = 'professional' | 'friendly' | 'personal' | 'sarcastic' | 'challenging';

interface AddRuleModalProps {
  hotelId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (rule: Rule) => void;
  initialData?: Rule;
  isEditing?: boolean;
}

const FIELD_OPTIONS: FieldOption[] = [
  { value: 'content.text', label: 'Review Content' },
  { value: 'content.rating', label: 'Rating' },
  { value: 'content.language', label: 'Language' }
];

const OPERATOR_OPTIONS: Record<FieldKey, OperatorOption[]> = {
  'content.text': [
    { value: 'contains', label: 'Contains Keywords' },
    { value: 'not_contains', label: "Doesn't Contain" },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
    { value: 'equals', label: 'Equals' }
  ],
  'content.rating': [
    { value: 'equals', label: 'Equals' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' }
  ],
  'content.language': [
    { value: 'equals', label: 'Equals' }
  ]
};

export function AddRuleModal({ 
  hotelId,
  isOpen, 
  onClose, 
  onSuccess, 
  initialData, 
  isEditing = false 
}: AddRuleModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(initialData?.name || '');
  const [field, setField] = useState<FieldKey | ''>(initialData?.condition?.field as FieldKey || '');
  const [operator, setOperator] = useState(initialData?.condition?.operator || '');
  const [value, setValue] = useState<string>(initialData?.condition?.value?.toString() || '');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [responseText, setResponseText] = useState(initialData?.response?.text || '');
  const [responseStyle, setResponseStyle] = useState<ResponseStyle>(
    (initialData?.response?.settings?.style as ResponseStyle) || 'professional'
  );
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    if (initialData && isEditing) {
      setName(initialData.name);
      setField(initialData.condition.field);
      setOperator(initialData.condition.operator);
      
      if (initialData.condition.field === 'content.text') {
        const keywordsArray = Array.isArray(initialData.condition.value) 
          ? initialData.condition.value.map(String)
          : [String(initialData.condition.value)];
        setKeywords(keywordsArray);
      } else {
        setValue(String(initialData.condition.value));
      }
      
      setResponseText(initialData.response.text);
      setResponseStyle(initialData.response.settings.style);
    } else {
      setName('');
      setField('content.text');
      setOperator('contains');
      setKeywords([]);
      setValue('');
      setResponseText('');
      setResponseStyle('professional');
    }
  }, [initialData, isEditing]);

  const handleAddKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
      e.preventDefault();
    }
  };

  const removeKeyword = (indexToRemove: number) => {
    setKeywords(keywords.filter((_, index) => index !== indexToRemove));
  };

  const insertVariable = (variable: string) => {
    setResponseText(responseText + ` {${variable}}`);
  };

  const isFormValid = () => {
    // Debug logs
    console.log('Form validation state:', {
      name: name.trim(),
      field,
      operator,
      keywords,
      value,
      responseText: responseText.trim(),
      responseStyle
    });

    // Basic field validation
    if (!name.trim()) {
      console.log('Name is empty');
      return false;
    }

    if (!field || !operator) {
      console.log('Field or operator is missing');
      return false;
    }

    // Content type specific validation
    if (field === 'content.text') {
      if (keywords.length === 0) {
        console.log('Keywords are required for text content');
        return false;
      }
    } else if ((field === 'content.rating' || field === 'content.language')) {
      if (!value.trim()) {
        console.log('Value is required for rating/language');
        return false;
      }
    }

    // Response validation
    if (!responseText.trim()) {
      console.log('Response text is empty');
      return false;
    }

    if (!responseStyle || !['professional', 'friendly', 'personal', 'sarcastic', 'challenging'].includes(responseStyle)) {
      console.log('Invalid response style:', responseStyle);
      return false;
    }

    console.log('Form is valid');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      const ruleData = {
        hotelId,
        name: name.trim(),
        condition: {
          field,
          operator,
          value: field === 'content.text' ? keywords : field === 'content.rating' ? parseInt(value) : value
        },
        response: {
          text: responseText.trim(),
          settings: {
            style: responseStyle
          }
        },
        isActive: true
      };

      console.log('Sending rule data:', JSON.stringify(ruleData, null, 2));

      const token = getCookie('token');
      
      const url = isEditing 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/rules/${initialData?._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/rules`;
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(ruleData)
      });

      const responseData = await response.json();
      console.log('Server response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || 'Failed to create rule');
      }

      toast.success("Rule created successfully");
      onSuccess(responseData);
      handleReset();

    } catch (error) {
      console.error('Error creating rule:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create rule');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setName('');
    setField('content.text');
    setOperator('contains');
    setValue('');
    setKeywords([]);
    setResponseText('');
    setResponseStyle('professional');
    onClose();
  };

  const handleOperatorChange = (newValue: string) => {
    setOperator(newValue);
  };

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
  };

  const handleResponseStyleChange = (newValue: string) => {
    setResponseStyle(newValue as ResponseStyle);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[95vh] p-0 bg-white rounded-2xl flex flex-col overflow-hidden">
        {/* Header fisso */}
        <div className="shrink-0 bg-white border-b rounded-t-2xl px-6 py-4">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                </div>
                <DialogTitle className="text-xl font-semibold">
                  {isEditing ? 'Edit Rule' : 'New Response Rule'}
                </DialogTitle>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Info className="h-4 w-4" />
                All changes are saved automatically
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content scrollabile */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-6">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Step sections... */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-sm font-medium border border-blue-100">
                    1
                  </div>
                  <h3 className="font-medium text-gray-900">Name Your Rule</h3>
                </div>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Handle Positive Breakfast Reviews"
                  className="h-11 text-base rounded-xl border-gray-200 hover:border-gray-300"
                />
              </div>

              {/* Step 2: Condition */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-sm font-medium border border-blue-100">
                    2
                  </div>
                  <h3 className="font-medium text-gray-900">Set Trigger Conditions</h3>
                </div>
                <div className="p-4 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm">
                  <div className="grid grid-cols-[1.5fr_1.5fr_2fr] gap-4 items-start">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">When</Label>
                      <Select value={field} onValueChange={(value: FieldKey) => setField(value)}>
                        <SelectTrigger className="h-11 bg-white rounded-xl border-gray-200 hover:border-gray-300">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">Condition</Label>
                      <Select value={operator} onValueChange={handleOperatorChange} disabled={!field}>
                        <SelectTrigger className="h-11 bg-white rounded-xl border-gray-200 hover:border-gray-300">
                          <SelectValue placeholder="Select operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {field && OPERATOR_OPTIONS[field]?.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">Value</Label>
                      {field === 'content.text' ? (
                        <div className="space-y-2">
                          <Input
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            onKeyDown={handleAddKeyword}
                            placeholder="Type keyword and press Enter"
                            className="h-11 text-base rounded-xl border-gray-200 hover:border-gray-300 bg-white"
                          />
                          {keywords.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {keywords.map((keyword, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                                >
                                  {keyword}
                                  <button
                                    type="button"
                                    onClick={() => removeKeyword(index)}
                                    className="text-gray-400 hover:text-gray-600"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : field === 'content.rating' ? (
                        <Select value={value} onValueChange={handleValueChange}>
                          <SelectTrigger className="h-11 bg-white rounded-xl border-gray-200 hover:border-gray-300">
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1,2,3,4,5].map(rating => (
                              <SelectItem key={rating} value={rating.toString()}>
                                <div className="flex items-center gap-1.5">
                                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                  <span>{rating}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : field === 'content.language' ? (
                        <Input
                          value={value}
                          onChange={(e) => handleValueChange(e.target.value)}
                          placeholder="e.g., en, es, fr"
                          className="h-11 text-base rounded-xl border-gray-200 hover:border-gray-300 bg-white"
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Response Configuration */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-sm font-medium border border-blue-100">
                    3
                  </div>
                  <h3 className="font-medium text-gray-900">Configure Response</h3>
                </div>
                
                <div className="grid grid-cols-[200px_1fr] gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Response Style</Label>
                    <Select value={responseStyle} onValueChange={handleResponseStyleChange}>
                      <SelectTrigger className="h-11 bg-white rounded-xl border-gray-200 hover:border-gray-300">
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="sarcastic">Witty</SelectItem>
                        <SelectItem value="challenging">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-gray-600">Response Template</Label>
                      <div className="flex gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => insertVariable('reviewer_name')}
                          className="h-8 px-3 rounded-full border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900"
                        >
                          +Name
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => insertVariable('hotel_name')}
                          className="h-8 px-3 rounded-full border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900"
                        >
                          +Hotel
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => insertVariable('rating')}
                          className="h-8 px-3 rounded-full border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900"
                        >
                          +Rating
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Write your response template..."
                      className="min-h-[200px] text-base p-3 bg-white rounded-xl border-gray-200 hover:border-gray-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer fisso */}
        <div className="shrink-0 bg-white border-t rounded-b-2xl px-6 py-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <Button 
              type="button" 
              variant="ghost"
              onClick={handleReset}
              className="h-10 rounded-xl hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading || !isFormValid()}
              className="h-10 px-6 gap-2 bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all rounded-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isEditing ? 'Saving Changes...' : 'Create Rule'}</span>
                </>
              ) : (
                <>
                  <span>{isEditing ? 'Save Changes' : 'Create Rule'}</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}