import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { getCookie } from "cookies-next"

const FIELD_OPTIONS = [
  { value: 'content.text', label: 'Contenuto Recensione' },
  { value: 'content.rating', label: 'Rating' },
  { value: 'content.language', label: 'Lingua' }
]

const OPERATOR_OPTIONS = {
  'content.text': [
    { value: 'contains', label: 'Contiene' }
  ],
  'content.rating': [
    { value: 'equals', label: 'Uguale a' },
    { value: 'greater_than', label: 'Maggiore di' },
    { value: 'less_than', label: 'Minore di' }
  ],
  'content.language': [
    { value: 'equals', label: 'Uguale a' }
  ]
}

export function AddRuleModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState(initialData?.name || '')
  const [field, setField] = useState(initialData?.condition?.field || '')
  const [operator, setOperator] = useState(initialData?.condition?.operator || '')
  const [value, setValue] = useState(initialData?.condition?.value || '')
  const [responseText, setResponseText] = useState(initialData?.response?.text || '')
  const [responseStyle, setResponseStyle] = useState(initialData?.response?.settings?.style || 'professional')
  const [responseLength, setResponseLength] = useState(initialData?.response?.settings?.length || 'medium')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setIsLoading(true)

      // Validazione
      if (!name || !field || !operator || !value || !responseText) {
        toast.error('Compila tutti i campi obbligatori')
        return
      }

      const hotelId = localStorage.getItem('selectedHotel')
      if (!hotelId) {
        toast.error('Seleziona prima un hotel')
        return
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
      }

      const token = getCookie('token')
      const url = initialData 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/rules/${initialData._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/rules`

      const response = await fetch(url, {
        method: initialData ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message)
      }

      const rule = await response.json()
      onSuccess?.(rule)
      onClose()
      toast.success(initialData ? 'Regola aggiornata' : 'Regola creata')

    } catch (error) {
      console.error('Rule save error:', error)
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Modifica Regola' : 'Nuova Regola'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome Regola */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome Regola</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es: Risposta Colazione Positiva"
            />
          </div>

          {/* Condizione */}
          <div className="space-y-4">
            <Label>Condizione</Label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Select value={field} onValueChange={setField}>
                  <SelectTrigger>
                    <SelectValue placeholder="Campo" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select 
                  value={operator} 
                  onValueChange={setOperator}
                  disabled={!field}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Operatore" />
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

              <div>
                {field === 'content.text' ? (
                  <Input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="parola1, parola2, ..."
                  />
                ) : field === 'content.rating' ? (
                  <Select value={value} onValueChange={setValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Rating" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5].map(rating => (
                        <SelectItem key={rating} value={String(rating)}>
                          {rating} Stelle
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field === 'content.language' ? (
                  <Select value={value} onValueChange={setValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Lingua" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="it">Italiano</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                ) : null}
              </div>
            </div>
          </div>

          {/* Risposta */}
          <div className="space-y-4">
            <Label>Risposta</Label>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Select value={responseStyle} onValueChange={setResponseStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Stile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professionale</SelectItem>
                  <SelectItem value="friendly">Amichevole</SelectItem>
                </SelectContent>
              </Select>

              <Select value={responseLength} onValueChange={setResponseLength}>
                <SelectTrigger>
                  <SelectValue placeholder="Lunghezza" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Breve</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="long">Lunga</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Inserisci il testo della risposta..."
              rows={6}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvataggio...' : initialData ? 'Aggiorna' : 'Crea'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 