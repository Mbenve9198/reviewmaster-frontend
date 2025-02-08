import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Pencil, Trash2, GripVertical, AlertCircle, MessageSquare, Star, Languages } from "lucide-react";
import { AddRuleModal } from './improved-add-rule-modal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const getFieldIcon = (field) => {
  switch (field) {
    case 'content.text':
      return <MessageSquare className="h-4 w-4 text-blue-500" />;
    case 'content.rating':
      return <Star className="h-4 w-4 text-yellow-500" />;
    case 'content.language':
      return <Languages className="h-4 w-4 text-purple-500" />;
    default:
      return null;
  }
};

const getFieldBadgeStyle = (field) => {
  switch (field) {
    case 'content.text':
      return 'bg-blue-50 text-blue-700';
    case 'content.rating':
      return 'bg-yellow-50 text-yellow-700';
    case 'content.language':
      return 'bg-purple-50 text-purple-700';
    default:
      return 'bg-gray-50 text-gray-700';
  }
};

const getFieldLabel = (field, value) => {
  switch (field) {
    case 'content.text':
      return `${Array.isArray(value) ? value.length : 1} keywords`;
    case 'content.rating':
      return `${value} stars`;
    case 'content.language':
      return value.toUpperCase();
    default:
      return '';
  }
};

export function RulesList({ rules, onRuleUpdate }) {
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState(null);
  const [deletingRule, setDeletingRule] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const hotelId = localStorage.getItem('selectedHotel');
        if (!hotelId) {
          onRuleUpdate([]);
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rules/${hotelId}`);
        if (!response.ok) throw new Error('Failed to fetch rules');
        
        const data = await response.json();
        onRuleUpdate(data);
      } catch (error) {
        console.error('Fetch rules error:', error);
        toast.error('Error loading rules');
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, [onRuleUpdate]);

  const handleToggleRule = async (ruleId, currentState) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rules/${ruleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentState })
      });

      if (!response.ok) throw new Error('Failed to toggle rule');

      onRuleUpdate(rules.map(rule => 
        rule._id === ruleId ? { ...rule, isActive: !currentState } : rule
      ));

      toast.success('Rule status updated');
    } catch (error) {
      console.error('Toggle rule error:', error);
      toast.error('Error updating rule');
    }
  };

  const handleDeleteRule = async () => {
    if (!deletingRule) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rules/${deletingRule._id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete rule');

      onRuleUpdate(rules.filter(rule => rule._id !== deletingRule._id));
      toast.success('Rule deleted');
    } catch (error) {
      console.error('Delete rule error:', error);
      toast.error('Error deleting rule');
    } finally {
      setDeletingRule(null);
      setIsDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No rules found</h3>
        <p className="text-sm text-gray-500 mb-4">
          Create your first automatic response rule or use theme analysis to generate some
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {rules.map((rule, index) => (
          <div 
            key={rule._id}
            className="group flex items-center gap-4 p-4 bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="cursor-move text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {getFieldIcon(rule.condition.field)}
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {rule.name}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getFieldBadgeStyle(rule.condition.field)}`}>
                  {getFieldLabel(rule.condition.field, rule.condition.value)}
                </span>
                {rule.response.settings.style === 'professional' ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    Professional
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-600">
                    Friendly
                  </span>
                )}
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {rule.response.text}
                  </p>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={() => handleToggleRule(rule._id, rule.isActive)}
                    className="data-[state=checked]:bg-green-500"
                  />
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingRule(rule);
                        setIsEditModalOpen(true);
                      }}
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 rounded-full"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDeletingRule(rule);
                        setIsDeleteDialogOpen(true);
                      }}
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600 rounded-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AddRuleModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setEditingRule(null);
          setIsEditModalOpen(false);
        }}
        initialData={editingRule}
        isEditing={!!editingRule}
        onSuccess={(updatedRule) => {
          onRuleUpdate(rules.map(rule => 
            rule._id === updatedRule._id ? updatedRule : rule
          ));
          setEditingRule(null);
          setIsEditModalOpen(false);
          toast.success('Rule updated successfully');
        }}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The rule will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setDeletingRule(null)}
              className="rounded-xl border-gray-200"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRule}
              className="rounded-xl bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}