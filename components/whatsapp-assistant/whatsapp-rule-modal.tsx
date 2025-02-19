import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { MessageSquare, Info, ChevronRight, Loader2 } from "lucide-react";
import { WhatsAppRule } from "@/types/whatsapp";

interface WhatsAppRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (rule: WhatsAppRule) => void;
  currentRule?: WhatsAppRule | null;
}

const COMMON_TOPICS = [
  { value: "check_in", label: "Check-in Process" },
  { value: "check_out", label: "Check-out Time" },
  { value: "breakfast", label: "Breakfast Information" },
  { value: "parking", label: "Parking Facilities" },
  { value: "wifi", label: "WiFi Access" },
  { value: "room_service", label: "Room Service" },
  { value: "amenities", label: "Hotel Amenities" },
  { value: "restaurant", label: "Restaurant Hours" },
  { value: "transportation", label: "Transportation" },
  { value: "local_attractions", label: "Local Attractions" },
  { value: "custom", label: "Custom Topic" }
] as const;

export function WhatsAppRuleModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  currentRule = null 
}: WhatsAppRuleModalProps) {
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [customTopic, setCustomTopic] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (currentRule) {
      if (currentRule.isCustom) {
        setSelectedTopic('custom');
        setCustomTopic(currentRule.customTopic || currentRule.topic);
      } else {
        setSelectedTopic(currentRule.topic);
        setCustomTopic('');
      }
      setResponse(currentRule.response);
    } else {
      setSelectedTopic('');
      setCustomTopic('');
      setResponse('');
    }
  }, [currentRule, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const ruleData: WhatsAppRule = {
        topic: selectedTopic === "custom" ? customTopic : selectedTopic,
        customTopic: selectedTopic === "custom" ? customTopic : undefined,
        response: response,
        isCustom: selectedTopic === "custom",
        isActive: true
      };

      onSuccess(ruleData);
      handleReset();
    } catch (error) {
      console.error('Error submitting rule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedTopic("");
    setCustomTopic("");
    setResponse("");
    onClose();
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
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                </div>
                <DialogTitle className="text-lg font-semibold">
                  {currentRule ? "Edit Assistant Rule" : "New Assistant Rule"}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content scrollabile */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-6">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
              {/* Topic Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100">
                    1
                  </div>
                  <h3 className="font-medium text-sm text-gray-900">Select Topic</h3>
                </div>
                <div className="p-4 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm">
                  <Select 
                    value={selectedTopic} 
                    onValueChange={setSelectedTopic}
                  >
                    <SelectTrigger className="h-9 bg-white rounded-xl border-gray-200 hover:border-gray-300 text-sm">
                      <SelectValue placeholder="When guests ask about..." />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_TOPICS.map(topic => (
                        <SelectItem key={topic.value} value={topic.value} className="text-sm">
                          {topic.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedTopic === "custom" && (
                    <div className="mt-3">
                      <Input
                        placeholder="Enter custom topic"
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        className="h-9 text-sm rounded-xl border-gray-200 hover:border-gray-300"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Response Configuration */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100">
                    2
                  </div>
                  <h3 className="font-medium text-sm text-gray-900">Configure Response</h3>
                </div>
                <div className="p-4 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-700">
                      Response Template
                    </label>
                    <div className="flex gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setResponse(response + " {guest_name}")}
                        className="h-8 px-3 rounded-full border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900"
                      >
                        +Name
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setResponse(response + " {hotel_name}")}
                        className="h-8 px-3 rounded-full border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900"
                      >
                        +Hotel
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setResponse(response + " {time}")}
                        className="h-8 px-3 rounded-full border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900"
                      >
                        +Time
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    placeholder="Add specific details or instructions for the AI when responding about this topic..."
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    className="min-h-[200px] text-sm p-3 bg-white rounded-xl border-gray-200 hover:border-gray-300"
                  />
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Use variables to personalize responses for each guest
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Footer fisso */}
        <div className="shrink-0 bg-white border-t rounded-b-2xl px-6 py-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <Button 
              type="button" 
              variant="ghost"
              onClick={handleReset}
              disabled={isLoading}
              className="h-10 rounded-xl hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading || !selectedTopic || (selectedTopic === "custom" && !customTopic) || !response}
              className="h-10 px-6 gap-2 bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all rounded-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{currentRule ? "Saving Changes..." : "Create Rule"}</span>
                </>
              ) : (
                <>
                  <span>{currentRule ? "Save Changes" : "Create Rule"}</span>
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