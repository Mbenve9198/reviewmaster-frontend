import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { getCookie } from "cookies-next"
import { Pencil, Trash2, GripVertical, AlertCircle } from "lucide-react"
import { AddRuleModal } from "./add-rule-modal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function RulesList({ rules, onRuleUpdate }) {
  const [loading, setLoading] = useState(true)
  const [editingRule, setEditingRule] = useState(null)
  const [deletingRule, setDeletingRule] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const fetchRules = async () => {
    try {
      const hotelId = localStorage.getItem('selectedHotel')
      if (!hotelId) {
        onRuleUpdate([])
        return
      }

      const token = getCookie('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rules/${hotelId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch rules')
      }

      const data = await response.json()
      onRuleUpdate(data)
    } catch (error) {
      console.error('Fetch rules error:', error)
      toast.error('Errore nel caricamento delle regole')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRules()
  }, [onRuleUpdate])

  const handleToggleRule = async (ruleId, currentState) => {
    try {
      const token = getCookie('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rules/${ruleId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentState })
      })

      if (!response.ok) {
        throw new Error('Failed to toggle rule')
      }

      onRuleUpdate(rules.map(rule => 
        rule._id === ruleId ? { ...rule, isActive: !currentState } : rule
      ))

      toast.success('Stato regola aggiornato')
    } catch (error) {
      console.error('Toggle rule error:', error)
      toast.error('Errore nell\'aggiornamento della regola')
    }
  }

  const handleDeleteRule = async () => {
    if (!deletingRule) return

    try {
      const token = getCookie('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rules/${deletingRule._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete rule')
      }

      onRuleUpdate(rules.filter(rule => rule._id !== deletingRule._id))
      toast.success('Regola eliminata')
    } catch (error) {
      console.error('Delete rule error:', error)
      toast.error('Errore nell\'eliminazione della regola')
    } finally {
      setDeletingRule(null)
      setIsDeleteDialogOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (rules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Nessuna regola trovata</h3>
        <p className="text-sm text-gray-500 mb-4">
          Crea la tua prima regola di risposta automatica o usa l'analisi dei temi per generarne alcune
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {rules.map((rule, index) => (
          <div 
            key={rule._id}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border shadow-sm"
          >
            <div className="cursor-move text-gray-400">
              <GripVertical className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {rule.name}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  rule.condition.field === 'content.rating' 
                    ? 'bg-yellow-100 text-yellow-700'
                    : rule.condition.field === 'content.language'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {rule.condition.field === 'content.rating' 
                    ? `${rule.condition.value} stelle`
                    : rule.condition.field === 'content.language'
                    ? rule.condition.value.toUpperCase()
                    : `${rule.condition.value.length} parole chiave`}
                </span>
              </div>
              <p className="text-sm text-gray-500 truncate">
                {rule.response.text}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={rule.isActive}
                onCheckedChange={() => handleToggleRule(rule._id, rule.isActive)}
              />
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingRule(rule)
                  setIsEditModalOpen(true)
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setDeletingRule(rule)
                  setIsDeleteDialogOpen(true)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AddRuleModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setEditingRule(null)
          setIsEditModalOpen(false)
        }}
        initialData={editingRule}
        onSuccess={(updatedRule) => {
          onRuleUpdate(rules.map(rule => 
            rule._id === updatedRule._id ? updatedRule : rule
          ))
        }}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. La regola verrà eliminata permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingRule(null)}>
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRule}>
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 