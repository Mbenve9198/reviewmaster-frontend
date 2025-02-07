import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { getCookie } from "cookies-next"

export function ThemesAnalysisDialog({ isOpen, onClose, onAnalysisStart, onAnalysisComplete, onRuleCreated }) {
  const [analysis, setAnalysis] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const startAnalysis = async () => {
    try {
      setIsLoading(true)
      setError(null)
      onAnalysisStart?.()

      const hotelId = localStorage.getItem('selectedHotel')
      if (!hotelId) {
        throw new Error('Nessun hotel selezionato')
      }

      const token = getCookie('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rules/analyze/${hotelId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Errore durante l\'analisi')
      }

      setAnalysis(data.analysis)
      toast.success(`Analizzate ${data.reviewsAnalyzed} recensioni`)

    } catch (error) {
      console.error('Analysis error:', error)
      setError(error.message)
      toast.error(error.message)
    } finally {
      setIsLoading(false)
      onAnalysisComplete?.()
    }
  }

  const handleCreateRule = async (suggestedRule) => {
    try {
      const hotelId = localStorage.getItem('selectedHotel')
      if (!hotelId) {
        toast.error('Seleziona prima un hotel')
        return
      }

      const token = getCookie('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hotelId,
          ...suggestedRule
        })
      })

      if (!response.ok) {
        throw new Error('Errore nella creazione della regola')
      }

      const rule = await response.json()
      toast.success('Regola creata con successo')
      
      // Aggiorna la lista delle regole nel componente padre
      onRuleCreated?.(rule)
    } catch (error) {
      console.error('Create rule error:', error)
      toast.error(error.message)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Analisi Temi Ricorrenti</DialogTitle>
        </DialogHeader>

        {!analysis && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">Analizza le tue recensioni</h3>
              <p className="text-sm text-gray-500">
                Analizzeremo tutte le tue recensioni per identificare temi ricorrenti e suggerire regole di risposta automatica.
                <br />
                Questa operazione consumerà 10 crediti.
              </p>
            </div>
            <Button onClick={startAnalysis} className="w-48">
              Inizia Analisi
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-gray-500">Analisi in corso...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium text-red-500">Errore</h3>
              <p className="text-sm text-gray-500">{error}</p>
            </div>
            <Button onClick={startAnalysis} variant="outline">
              Riprova
            </Button>
          </div>
        )}

        {analysis && (
          <div className="space-y-8">
            {/* Temi Ricorrenti */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Temi Ricorrenti</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.recurringThemes.map((theme, i) => (
                  <div key={i} className="p-4 rounded-xl border bg-white shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{theme.theme}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        theme.sentiment === 'positive' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {theme.frequency} menzioni
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 italic mb-3">"{theme.exampleQuote}"</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => handleCreateRule(theme.suggestedRule)}
                    >
                      Crea Regola
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Problemi Comuni */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Problemi Comuni</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.commonIssues.map((issue, i) => (
                  <div key={i} className="p-4 rounded-xl border bg-white shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{issue.issue}</h4>
                      <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
                        {issue.frequency} menzioni
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 italic mb-3">"{issue.exampleQuote}"</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        handleCreateRule(issue)
                      }}
                    >
                      Crea Regola
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Regole basate sul Rating */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Regole basate sul Rating</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.ratingBasedRules.map((rule, i) => (
                  <div key={i} className="p-4 rounded-xl border bg-white shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{rule.rating} Stelle</h4>
                      <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
                        {rule.frequency} recensioni
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        handleCreateRule(rule)
                      }}
                    >
                      Crea Regola
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 