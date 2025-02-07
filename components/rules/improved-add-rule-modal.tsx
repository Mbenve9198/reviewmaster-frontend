import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageSquare, 
  Star, 
  Languages, 
  ChevronRight, 
  Sparkles,
  XCircle
} from "lucide-react";

const FIELD_OPTIONS = [
  { value: 'content.text', label: 'Review Content', icon: MessageSquare },
  { value: 'content.rating', label: 'Rating', icon: Star },
  { value: 'content.language', label: 'Language', icon: Languages }
];

const OPERATOR_OPTIONS = {
  'content.text': [{ value: 'contains', label: 'Contains Keywords' }],
  'content.rating': [
    { value: 'equals', label: 'Equals' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' }
  ],
  'content.language': [{ value: 'equals', label: 'Equals' }]
};

interface AddRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (rule: Rule) => void;
  initialData?: Rule | null;
}

export function AddRuleModal({ isOpen, onClose, onSuccess, initialData = null }: AddRuleModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(initialData?.name || '');
  const [field, setField] = useState(initialData?.condition?.field || '');
  const [operator, setOperator] = useState(initialData?.condition?.operator || '');
  const [value, setValue] = useState(initialData?.condition?.value || '');
  const [keywords, setKeywords] = useState([]);
  const [responseText, setResponseText] = useState(initialData?.response?.text || '');
  const [responseStyle, setResponseStyle] = useState(initialData?.response?.settings?.style || 'professional');
  const [responseLength, setResponseLength] = useState(initialData?.response?.settings?.length || 'medium');
  const [keywordInput, setKeywordInput] = useState('');

  const handleAddKeyword = (e) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
      e.preventDefault();
    }
  };

  const removeKeyword = (indexToRemove) => {
    setKeywords(keywords.filter((_, index) => index !== indexToRemove));
  };

  const insertVariable = (variable) => {
    setResponseText(responseText + ` {${variable}}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Sparkles className="h-6 w-6 text-blue-500" />
            New Response Rule
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-8 py-4">
          {/* Rule Name Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Rule Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Positive Breakfast Response"
              className="h-12 text-base border-gray-200"
            />
          </div>

          {/* Condition Builder Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Condition</Label>
            <div className="p-6 bg-gray-50 rounded-xl space-y-4">
              <div className="flex items-center gap-3 text-base">
                <span className="font-medium text-gray-700">IF</span>
                <Select value={field} onValueChange={setField}>
                  <SelectTrigger className="h-12 min-w-[180px] bg-white">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_OPTIONS.map(option => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className="flex items-center gap-2"
                      >
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={operator} 
                  onValueChange={setOperator}
                  disabled={!field}
                >
                  <SelectTrigger className="h-12 min-w-[180px] bg-white">
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {field && OPERATOR_OPTIONS[field].map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {field === 'content.text' ? (
                  <div className="flex-1">
                    <Input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={handleAddKeyword}
                      placeholder="Type keyword and press Enter"
                      className="h-12 bg-white"
                    />
                  </div>
                ) : field === 'content.rating' ? (
                  <Select value={value} onValueChange={setValue}>
                    <SelectTrigger className="h-12 min-w-[180px] bg-white">
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5].map(rating => (
                        <SelectItem key={rating} value={String(rating)}>
                          {rating} Stars
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field === 'content.language' ? (
                  <Select value={value} onValueChange={setValue}>
                    <SelectTrigger className="h-12 min-w-[180px] bg-white">
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
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Style</Label>
                <Select value={responseStyle} onValueChange={setResponseStyle}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Length</Label>
                <Select value={responseLength} onValueChange={setResponseLength}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select length" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="long">Long</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Response Template Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Response Template</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertVariable('reviewer_name')}
                  className="text-sm"
                >
                  + Guest Name
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertVariable('hotel_name')}
                  className="text-sm"
                >
                  + Hotel Name
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertVariable('rating')}
                  className="text-sm"
                >
                  + Rating
                </Button>
              </div>
            </div>
            <Textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Enter your response template..."
              className="min-h-[200px] text-base"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="h-12 px-6"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isLoading}
              className="h-12 px-6 gap-2 bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all"
            >
              {isLoading ? 'Creating...' : 'Create Rule'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}