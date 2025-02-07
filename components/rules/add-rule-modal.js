import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, MessageSquare, Star, Languages, ChevronRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

const FIELD_OPTIONS = [
  { value: 'content.text', label: 'Review Content', icon: MessageSquare },
  { value: 'content.rating', label: 'Rating', icon: Star },
  { value: 'content.language', label: 'Language', icon: Languages }
];

const OPERATOR_OPTIONS = {
  'content.text': [
    { value: 'contains', label: 'Contains Keywords' }
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

export function AddRuleModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(initialData?.name || '');
  const [field, setField] = useState(initialData?.condition?.field || '');
  const [operator, setOperator] = useState(initialData?.condition?.operator || '');
  const [value, setValue] = useState(initialData?.condition?.value || '');
  const [responseText, setResponseText] = useState(initialData?.response?.text || '');
  const [responseStyle, setResponseStyle] = useState(initialData?.response?.settings?.style || 'professional');
  const [responseLength, setResponseLength] = useState(initialData?.response?.settings?.length || 'medium');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);

      // Validazione
      if (!name || !field || !operator || !value || !responseText) {
        toast.error('Please fill in all required fields');
        return;
      }

      const hotelId = localStorage.getItem('selectedHotel');
      if (!hotelId) {
        toast.error('Please select a hotel first');
        return;
      }

      const payload = {
        hotelId,
        name,
        condition: {
          field,
          operator,
          value: field === 'content.text' ? value.split(',').map(v => v.trim()) : value
        },
        response: {
          text: responseText,
          settings: {
            style: responseStyle,
            length: responseLength
          }
        }
      };

      const url = initialData 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/rules/${initialData._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/rules`;

      const response = await fetch(url, {
        method: initialData ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const rule = await response.json();
      onSuccess?.(rule);
      onClose();
      toast.success(initialData ? 'Rule updated' : 'Rule created');

    } catch (error) {
      console.error('Rule save error:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {initialData ? (
              <>
                <MessageSquare className="h-5 w-5 text-blue-500" />
                Edit Rule
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 text-blue-500" />
                New Response Rule
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rule Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Rule Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Positive Breakfast Response"
              className="rounded-xl border-gray-200"
            />
          </div>

          {/* Condition Builder */}
          <div className="space-y-4">
            <Label>Condition</Label>
            <div className="grid grid-cols-3 gap-4">
              {/* Field Selection */}
              <div>
                <Select value={field} onValueChange={setField}>
                  <SelectTrigger className="h-10 rounded-xl border-gray-200">
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
              </div>

              {/* Operator Selection */}
              <div>
                <Select 
                  value={operator} 
                  onValueChange={setOperator}
                  disabled={!field}
                >
                  <SelectTrigger className="h-10 rounded-xl border-gray-200">
                    <SelectValue placeholder="Operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {field && OPERATOR_OPTIONS[field].map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Value Input */}
              <div>
                {field === 'content.text' ? (
                  <Input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="word1, word2, ..."
                    className="h-10 rounded-xl border-gray-200"
                  />
                ) : field === 'content.rating' ? (
                  <Select value={value} onValueChange={setValue}>
                    <SelectTrigger className="h-10 rounded-xl border-gray-200">
                      <SelectValue placeholder="Rating" />
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
                    <SelectTrigger className="h-10 rounded-xl border-gray-200">
                      <SelectValue placeholder="Language" />
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
            </div>
          </div>

          {/* Response Settings */}
          <div className="space-y-4">
            <Label>Response</Label>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Select value={responseStyle} onValueChange={setResponseStyle}>
                <SelectTrigger className="h-10 rounded-xl border-gray-200">
                  <SelectValue placeholder="Style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                </SelectContent>
              </Select>

              <Select value={responseLength} onValueChange={setResponseLength}>
                <SelectTrigger className="h-10 rounded-xl border-gray-200">
                  <SelectValue placeholder="Length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Response Template */}
            <Textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Enter response template..."
              rows={6}
              className="rounded-xl border-gray-200 resize-none"
            />

            {/* Helper Text */}
            <div className="flex items-start gap-2 text-sm text-gray-500">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <p>
                You can use variables in your response:
                <br />
                {'{reviewer_name}'} - Guest's name
                <br />
                {'{hotel_name}'} - Your hotel's name
                <br />
                {'{rating}'} - Review rating
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="rounded-xl border-gray-200"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="rounded-xl gap-2 bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all"
            >
              {isLoading ? (
                <>Loading...</>
              ) : (
                <>
                  {initialData ? 'Update' : 'Create'} Rule
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