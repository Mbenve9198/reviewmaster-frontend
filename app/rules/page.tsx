"use client"

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddRuleModal } from "@/components/rules/improved-add-rule-modal";
import { RulesList } from "@/components/rules/rules-list";
import { ThemesAnalysisDialog } from "@/components/rules/themes-analysis-dialog";
import { Rule } from "@/types/rule";
import { toast } from "react-hot-toast";

interface Hotel {
  _id: string;
  name: string;
}

export default function RulesPage() {
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
  const [isThemesDialogOpen, setIsThemesDialogOpen] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carica gli hotel dell'utente
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch hotels');
        
        const data = await response.json();
        setHotels(data);
        
        // Seleziona il primo hotel o quello salvato nel localStorage
        const savedHotelId = localStorage.getItem('selectedHotel');
        if (savedHotelId && data.find((h: Hotel) => h._id === savedHotelId)) {
          setSelectedHotelId(savedHotelId);
        } else if (data.length > 0) {
          setSelectedHotelId(data[0]._id);
          localStorage.setItem('selectedHotel', data[0]._id);
        }
      } catch (error) {
        console.error('Error fetching hotels:', error);
        toast.error('Failed to load hotels');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotels();
  }, []);

  // Carica le regole quando cambia l'hotel selezionato
  useEffect(() => {
    const fetchRules = async () => {
      if (!selectedHotelId) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rules/${selectedHotelId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch rules');
        
        const data = await response.json();
        setRules(data);
      } catch (error) {
        console.error('Error fetching rules:', error);
        setError('Failed to load rules');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRules();
  }, [selectedHotelId]);

  const handleHotelChange = (hotelId: string) => {
    setSelectedHotelId(hotelId);
    localStorage.setItem('selectedHotel', hotelId);
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex flex-col gap-6">
        {/* Header con selettore hotel */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 w-full sm:w-auto max-w-xs">
            <Select value={selectedHotelId} onValueChange={handleHotelChange}>
              <SelectTrigger className="h-12 rounded-xl bg-white border-gray-200">
                <SelectValue placeholder="Select hotel" />
              </SelectTrigger>
              <SelectContent>
                {hotels.map(hotel => (
                  <SelectItem key={hotel._id} value={hotel._id}>
                    {hotel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setIsThemesDialogOpen(true)}
              variant="outline"
              className="h-12 px-6 gap-2 rounded-xl border-gray-200 hover:bg-gray-50 transition-colors"
              disabled={!selectedHotelId}
            >
              <Sparkles className="h-4 w-4" />
              Analyze Reviews
            </Button>
            <Button
              onClick={() => setIsAddRuleModalOpen(true)}
              className="h-12 px-6 gap-2 bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all rounded-xl"
              disabled={!selectedHotelId}
            >
              <Plus className="h-4 w-4" />
              Add Rule
            </Button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="flex justify-center py-8 text-red-500 items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Plus className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No rules yet</h3>
            <p className="text-gray-500 mb-4">Create your first rule to start automating responses</p>
            <Button
              onClick={() => setIsAddRuleModalOpen(true)}
              className="h-12 px-6 gap-2 bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all rounded-xl"
              disabled={!selectedHotelId}
            >
              <Plus className="h-4 w-4" />
              Create First Rule
            </Button>
          </div>
        ) : (
          <RulesList rules={rules} onRuleUpdate={setRules} />
        )}
      </div>

      {/* Modals */}
      {selectedHotelId && (
        <>
          <AddRuleModal
            hotelId={selectedHotelId}
            isOpen={isAddRuleModalOpen}
            onClose={() => setIsAddRuleModalOpen(false)}
            onSuccess={(newRule: Rule) => {
              setRules(prevRules => [...prevRules, newRule]);
              toast.success('Rule created successfully');
              setIsAddRuleModalOpen(false);
            }}
          />

          <ThemesAnalysisDialog
            hotelId={selectedHotelId}
            isOpen={isThemesDialogOpen}
            onClose={() => setIsThemesDialogOpen(false)}
            onRuleCreate={(rule: Rule) => {
              setRules(prevRules => [...prevRules, rule]);
              setIsThemesDialogOpen(false);
              toast.success('Rule created from analysis');
            }}
          />
        </>
      )}
    </div>
  );
}