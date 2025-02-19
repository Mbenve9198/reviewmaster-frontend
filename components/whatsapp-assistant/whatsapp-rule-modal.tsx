import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

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
];

export function WhatsAppRuleModal({ isOpen, onClose, onSuccess, currentRule = null }) {
  const [selectedTopic, setSelectedTopic] = useState(currentRule?.topic || "");
  const [customTopic, setCustomTopic] = useState(currentRule?.customTopic || "");
  const [response, setResponse] = useState(currentRule?.response || "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const ruleData = {
      topic: selectedTopic === "custom" ? customTopic : selectedTopic,
      response: response,
      isCustom: selectedTopic === "custom"
    };

    // Qui andrà la logica per salvare la regola
    onSuccess(ruleData);
    handleReset();
  };

  const handleReset = () => {
    setSelectedTopic("");
    setCustomTopic("");
    setResponse("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {currentRule ? "Edit Assistant Rule" : "New Assistant Rule"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700">
              When guests ask about:
            </label>
            <Select 
              value={selectedTopic} 
              onValueChange={setSelectedTopic}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a topic" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_TOPICS.map(topic => (
                  <SelectItem key={topic.value} value={topic.value}>
                    {topic.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedTopic === "custom" && (
              <Input
                placeholder="Enter custom topic"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
              />
            )}
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700">
              Customize the response:
            </label>
            <Textarea
              placeholder="Add specific details or instructions for the AI when responding about this topic..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={6}
            />
            <p className="text-xs text-gray-500">
              You can use variables like {"{guest_name}"}, {"{hotel_name}"}, and {"{time}"} 
              in your response.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={handleReset}>
              Cancel
            </Button>
            <Button type="submit">
              {currentRule ? "Save Changes" : "Create Rule"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 