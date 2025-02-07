import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  XCircle
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
type ResponseLength = 'short' | 'medium' | 'long';

interface AddRuleModalProps {
  hotelId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (rule: Rule) => void;
  initialData?: Rule | null;
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
  initialData = null 
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
  const [responseLength, setResponseLength] = useState<ResponseLength>(
    (initialData?.response?.settings?.length as ResponseLength) || 'medium'
  );
  const [keywordInput, setKeywordInput] = useState('');

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
      // Struttura riallineata per corrispondere esattamente al modello mongoose
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
      console.log('Using token:', token); // Per debugging

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rules`, {
        method: 'POST',
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
      onClose();

    } catch (error) {
      console.error('Error creating rule:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create rule');
    } finally {
      setIsLoading(false);
    }
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

  const handleResponseLengthChange = (newValue: string) => {
    setResponseLength(newValue as ResponseLength);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] bg-white p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-6">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Sparkles className="h-6 w-6 text-blue-500" />
            New Response Rule
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rule Name Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Rule Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Positive Breakfast Response"
              className="h-12 text-base border-gray-200 rounded-xl"
            />
          </div>

          {/* Condition Builder Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Condition</Label>
            <div className="p-6 bg-gray-50 rounded-xl space-y-4">
              <div className="grid grid-cols-[auto_180px_180px_1fr] gap-3 items-center">
                <span className="font-medium text-gray-700">IF</span>
                <Select value={field} onValueChange={(value: FieldKey) => setField(value)}>
                  <SelectTrigger className="h-12 bg-white rounded-xl">
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
                  <SelectTrigger className="h-12 bg-white rounded-xl">
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
                    placeholder="Type keyword and press Enter"
                    className="h-12 bg-white rounded-xl w-full"
                  />
                ) : field === 'content.rating' ? (
                  <Select value={value} onValueChange={handleValueChange}>
                    <SelectTrigger className="h-12 bg-white rounded-xl">
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5].map(rating => (
                        <SelectItem key={rating} value={rating.toString()}>
                          {rating} Stars
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field === 'content.language' ? (
                  <Select value={value} onValueChange={handleValueChange}>
                    <SelectTrigger className="h-12 bg-white rounded-xl">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="it">Italian</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                ) : null}
              </div>

              {/* Keywords Tags */}
              {field === 'content.text' && keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-xl text-sm"
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
          <div className="space-y-4">
            <Label className="text-base font-semibold">Response Configuration</Label>
            <div>
              <Label className="mb-2 block">Response Style</Label>
              <Select value={responseStyle} onValueChange={handleResponseStyleChange}>
                <SelectTrigger className="h-12 rounded-xl w-full">
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
          </div>

          {/* Response Prompt Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Response Behavior</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertVariable('reviewer_name')}
                  className="text-sm rounded-xl"
                >
                  + Guest Name
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertVariable('hotel_name')}
                  className="text-sm rounded-xl"
                >
                  + Hotel Name
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertVariable('rating')}
                  className="text-sm rounded-xl"
                >
                  + Rating
                </Button>
              </div>
            </div>
            <Textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Describe how the AI should respond in this situation. For example: 'Thank the guest for their positive feedback about breakfast, mention our commitment to quality ingredients, and invite them to try our seasonal specialties on their next visit.'"
              className="min-h-[200px] text-base rounded-xl"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="h-12 px-6 rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isLoading || !isFormValid()}
              className="h-12 px-6 gap-2 bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all rounded-xl"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Creating...
                </>
              ) : (
                <>
                  Create Rule
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}