"use client"

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { AddRuleModal } from "@/components/rules/add-rule-modal";
import { RulesList } from "@/components/rules/rules-list";
import { ThemesAnalysisDialog } from "@/components/rules/themes-analysis-dialog";
import { Rule } from "@/types/rule";

export default function RulesPage() {
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);

  return (
    <>
      {/* Gradient Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#FAFAFB] via-[#F0F0F2] to-[#FAFAFB] backdrop-blur-sm" />
      
      <div className="flex flex-col px-10 md:pl-[96px] py-12 min-h-screen">
        <div className="max-w-[1400px] mx-auto w-full space-y-12">
          {/* Header Section */}
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue-600 to-blue-400" />
              <h1 className="text-3xl sm:text-4xl font-semibold bg-gradient-to-b from-blue-800 to-blue-600 bg-clip-text text-transparent">
                Response Rules
              </h1>
            </div>
            
            <div className="flex items-center justify-between w-full">
              <p className="text-base text-gray-500">
                Create automatic rules to respond to reviews based on specific criteria
              </p>
              
              <div className="flex items-center gap-3">
                {/* Analysis Button */}
                <Button
                  variant="outline"
                  onClick={() => setIsAnalysisDialogOpen(true)}
                  className="gap-2 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  Analyze Common Themes
                </Button>
                
                {/* Add Rule Button */}
                <Button
                  onClick={() => setIsAddRuleModalOpen(true)}
                  className="gap-2 bg-primary text-primary-foreground shadow-[0_4px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-[2px] transition-all"
                >
                  <Plus className="h-4 w-4" />
                  New Rule
                </Button>
              </div>
            </div>
          </div>

          {/* Rules List */}
          <RulesList rules={rules} onRuleUpdate={setRules} />
        </div>
      </div>

      {/* Modals */}
      <AddRuleModal
        isOpen={isAddRuleModalOpen}
        onClose={() => setIsAddRuleModalOpen(false)}
        onSuccess={(newRule: Rule) => {
          setRules([...rules, newRule]);
          toast.success('Rule created successfully');
        }}
      />

      <ThemesAnalysisDialog
        isOpen={isAnalysisDialogOpen}
        onClose={() => setIsAnalysisDialogOpen(false)}
        onAnalysisStart={() => setIsAnalyzing(true)}
        onAnalysisComplete={() => setIsAnalyzing(false)}
        onRuleCreated={(newRule: Rule) => {
          setRules(prevRules => [...prevRules, newRule]);
        }}
      />
    </>
  );
}