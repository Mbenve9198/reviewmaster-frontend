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
  Loader2
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
      <DialogContent className="max-w-[100vw] h-[100vh] p-0 bg-[#FAFAFA]">
        {/* Header Section */}
        <div className="sticky top-0 z-10 bg-white border-b px-8 py-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-semibold">
              <Sparkles className="h-7 w-7 text-blue-500" />
              {isEditing ? 'Edit Response Rule' : 'Create New Response Rule'}
            </DialogTitle>
            <DialogDescription className="text-base">
              {isEditing 
                ? 'Fine-tune your automatic response rule settings below.'
                : 'Configure how your AI assistant should respond to specific review patterns.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Main Content */}
        <div className="px-8 py-6 h-[calc(100vh-180px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
            {/* Rule Name Section */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Rule Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Positive Breakfast Response"
                className="h-14 text-base border-gray-200 rounded-xl"
              />
            </div>

            {/* Condition Builder Section */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Condition</Label>
              <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <div className="grid grid-cols-[auto_200px_200px_1fr] gap-4 items-center">
                  <span className="font-medium text-gray-700">IF</span>
                  <Select value={field} onValueChange={(value: FieldKey) => setField(value)}>
                    <SelectTrigger className="h-14 bg-white rounded-xl">
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

                  <Select value={operator} onValueChange={handleOperatorChange} disabled={!field}>
                    <SelectTrigger className="h-14 bg-white rounded-xl">
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

                  {field === 'content.text' ? (
                    <Input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={handleAddKeyword}
                      placeholder="Enter a topic/theme (e.g., breakfast, cleanliness, staff) and press Enter"
                      className="h-14 bg-white rounded-xl w-full"
                    />
                  ) : field === 'content.rating' ? (
                    <Select value={value} onValueChange={handleValueChange}>
                      <SelectTrigger className="h-14 bg-white rounded-xl">
                        <SelectValue placeholder="Select star rating" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5].map(rating => (
                          <SelectItem key={rating} value={rating.toString()}>
                            {rating} {rating === 1 ? 'Star' : 'Stars'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field === 'content.language' ? (
                    <Input
                      value={value}
                      onChange={(e) => handleValueChange(e.target.value)}
                      placeholder="Enter language code (e.g., en, it, fr, de)"
                      className="h-14 bg-white rounded-xl w-full"
                    />
                  ) : null}
                </div>

                {/* Topics Tags */}
                {field === 'content.text' && keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(index)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Response Configuration Section */}
            <div className="space-y-6">
              <Label className="text-lg font-semibold">Response Configuration</Label>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="text-base font-medium">Response Style</Label>
                  <Select value={responseStyle} onValueChange={handleResponseStyleChange}>
                    <SelectTrigger className="h-14 rounded-xl">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional and Formal</SelectItem>
                      <SelectItem value="friendly">Friendly and Warm</SelectItem>
                      <SelectItem value="personal">Personal and Empathetic</SelectItem>
                      <SelectItem value="sarcastic">Ironic and Witty</SelectItem>
                      <SelectItem value="challenging">Questioning and Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Available Variables</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => insertVariable('reviewer_name')}
                      className="h-14 px-6 rounded-xl"
                    >
                      + Guest Name
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => insertVariable('hotel_name')}
                      className="h-14 px-6 rounded-xl"
                    >
                      + Hotel Name
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => insertVariable('rating')}
                      className="h-14 px-6 rounded-xl"
                    >
                      + Rating
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium">Response Behavior</Label>
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Describe how the AI should respond in this situation. For example: 'Thank the guest for their positive feedback about breakfast, mention our commitment to quality ingredients, and invite them to try our seasonal specialties on their next visit.'"
                  className="min-h-[200px] text-base rounded-xl p-4"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions - Fixed at bottom */}
        <div className="sticky bottom-0 bg-white border-t px-8 py-4">
          <div className="max-w-4xl mx-auto flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleReset}
              className="h-14 px-8 rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading || !isFormValid()}
              className="h-14 px-8 gap-2 bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all rounded-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {isEditing ? 'Update Rule' : 'Create Rule'}
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}