"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AddRuleModal } from "@/components/rules/add-rule-modal"
import { RulesList } from "@/components/rules/rules-list"
import { ThemesAnalysisDialog } from "@/components/rules/themes-analysis-dialog"

interface Rule {
  _id: string
  name: string
  condition: {
    field: string
    operator: string
    value: string | string[] | number
  }
  response: {
    text: string
    settings: {
      style: 'professional' | 'friendly'
      length: 'short' | 'medium' | 'long'
    }
  }
  isActive: boolean
  priority: number
}

export default function RulesPage() {
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false)
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [rules, setRules] = useState<Rule[]>([])

  return (
    <>
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#FAFAFB] via-[#F0F0F2] to-[#FAFAFB] backdrop-blur-sm" />
      
      <div className="flex flex-col px-10 md:pl-[96px] py-12 min-h-screen">
        <div className="max-w-[1400px] mx-auto w-full space-y-12">
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue-600 to-blue-400" />
              <h1 className="text-3xl sm:text-4xl font-semibold bg-gradient-to-b from-blue-800 to-blue-600 bg-clip-text text-transparent">
                Regole di Risposta
              </h1>
            </div>
            
            <div className="flex items-center justify-between w-full">
              <p className="text-base text-gray-500">
                Crea regole automatiche per rispondere alle recensioni in base a criteri specifici
              </p>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsAnalysisDialogOpen(true)}
                  className="gap-2"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing && <Loader2 className="h-4 w-4 animate-spin" />}
                  Analizza Temi Ricorrenti
                </Button>
                
                <Button
                  onClick={() => setIsAddRuleModalOpen(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nuova Regola
                </Button>
              </div>
            </div>
          </div>

          <RulesList rules={rules} onRuleUpdate={setRules} />
        </div>
      </div>

      <AddRuleModal
        isOpen={isAddRuleModalOpen}
        onClose={() => setIsAddRuleModalOpen(false)}
        onSuccess={(newRule) => {
          setRules([...rules, newRule])
          toast.success('Regola creata con successo')
        }}
      />

      <ThemesAnalysisDialog
        isOpen={isAnalysisDialogOpen}
        onClose={() => setIsAnalysisDialogOpen(false)}
        onAnalysisStart={() => setIsAnalyzing(true)}
        onAnalysisComplete={() => setIsAnalyzing(false)}
        onRuleCreated={(newRule) => {
          setRules(prevRules => [...prevRules, newRule])
        }}
      />
    </>
  )
} 